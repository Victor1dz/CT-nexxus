const makeWASocket = require('@whiskeysockets/baileys').default;
const { BufferJSON, initAuthCreds, proto, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const cors = require('cors');
const pino = require('pino');
const QRCode = require('qrcode');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

let sock = null;
let qrCodeData = null;
let connectionStatus = 'DISCONNECTED';
let connectedNumber = null;
let isManualLogout = false;
let authState = null;

// Função para formatar data UTC de forma segura sem shift de fuso horário
function formatarDataUTC(date) {
  if (!date) return '';
  const d = new Date(date);
  const dia = String(d.getUTCDate()).padStart(2, '0');
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
  const ano = d.getUTCFullYear();
  return `${dia}/${mes}/${ano}`;
}

const defaultTemplates = {
  aulaHoje: "Olá, {nome}! Passando para avisar que hoje ({dia}) você tem aula de {modalidade} marcada para as {horario}. Esperamos você no CT!",
  lembreteVencimento: "Olá, {nome}! Lembramos que sua mensalidade de {competencia} vence daqui a {dias} dia(s) (no dia {vencimento}). Valor: R$ {valor}.\n\n💵 *Formas de Pagamento:*\n• Pix: ctnexxus@gmail.com 📱\n• Dinheiro 💵\n• Cartão 💳",
  mensalidadeAtrasada: "Olá, {nome}! Constatamos que sua mensalidade de {competencia} (vencida em {vencimento}) está em aberto. Se já efetuou o pagamento, favor desconsiderar e nos enviar o comprovante.\n\n💵 *Formas de Pagamento:*\n• Pix: ctnexxus@gmail.com 📱\n• Dinheiro 💵\n• Cartão 💳",
  confirmacaoPagamento: "Obrigado, {nome}! Confirmamos o recebimento do pagamento da sua mensalidade referente a {competencia}. Bom treino!\n\n💵 *Formas de Pagamento:*\n• Pix: ctnexxus@gmail.com 📱\n• Dinheiro 💵\n• Cartão 💳"
};

let globalTemplates = { ...defaultTemplates };

async function carregarTemplates() {
  try {
    const record = await prisma.whatsapp_session.findUnique({
      where: { key: 'templates' }
    });
    if (record) {
      globalTemplates = JSON.parse(record.value);
    } else {
      // Se não existir, salvar o padrão no banco
      await prisma.whatsapp_session.create({
        data: {
          key: 'templates',
          value: JSON.stringify(defaultTemplates)
        }
      });
      globalTemplates = { ...defaultTemplates };
    }
  } catch (err) {
    console.error('Erro ao carregar templates do banco, usando default:', err);
    globalTemplates = { ...defaultTemplates };
  }
}

async function salvarTemplates(templates) {
  try {
    const value = JSON.stringify(templates);
    await prisma.whatsapp_session.upsert({
      where: { key: 'templates' },
      update: { value },
      create: { key: 'templates', value }
    });
    globalTemplates = { ...templates };
    return true;
  } catch (err) {
    console.error('Erro ao salvar templates no banco:', err);
    return false;
  }
}

// Provedor de estado de autenticação customizado usando Prisma (Banco de Dados)
async function usePrismaAuthState(prismaInstance) {
  const writeData = async (data, key) => {
    const value = JSON.stringify(data, BufferJSON.replacer);
    await prismaInstance.whatsapp_session.upsert({
      where: { key },
      update: { value },
      create: { key, value }
    });
  };

  const readData = async (key) => {
    try {
      const record = await prismaInstance.whatsapp_session.findUnique({
        where: { key }
      });
      if (!record) return null;
      return JSON.parse(record.value, BufferJSON.reviver);
    } catch (error) {
      return null;
    }
  };

  const removeData = async (key) => {
    try {
      await prismaInstance.whatsapp_session.delete({
        where: { key }
      });
    } catch (error) {
      // Ignora se não existir
    }
  };

  const creds = (await readData('creds')) || initAuthCreds();

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const data = {};
          await Promise.all(ids.map(async (id) => {
            let value = await readData(`${type}-${id}`);
            if (type === 'app-state-sync-key' && value) {
              if (proto && proto.Message && proto.Message.AppStateSyncKeyData) {
                value = proto.Message.AppStateSyncKeyData.fromObject(value);
              }
            }
            data[id] = value;
          }));
          return data;
        },
        set: async (data) => {
          const tasks = [];
          for (const category in data) {
            for (const id in data[category]) {
              const value = data[category][id];
              const key = `${category}-${id}`;
              tasks.push(value ? writeData(value, key) : removeData(key));
            }
          }
          await Promise.all(tasks);
        }
      }
    },
    saveCreds: async () => {
      return writeData(creds, 'creds');
    },
    clearAll: async () => {
      try {
        // Remove tudo, exceto as templates de mensagens
        await prismaInstance.whatsapp_session.deleteMany({
          where: {
            key: {
              not: 'templates'
            }
          }
        });
      } catch (error) {
        console.error('Erro ao limpar sessão no banco:', error);
      }
    }
  };
}

function formatPhone(phone) {
  let cleaned = phone.replace(/\D/g, '');
  if (!cleaned) return '';
  if (!cleaned.startsWith('55')) {
    if (cleaned.length === 10 || cleaned.length === 11) {
      cleaned = '55' + cleaned;
    }
  }
  return cleaned;
}

async function sendWhatsAppMessage(phone, text, context) {
  try {
    const formatted = formatPhone(phone);
    if (!formatted) {
      console.log(`[${context}] Telefone inválido: "${phone}"`);
      return false;
    }

    const jid = `${formatted}@s.whatsapp.net`;
    console.log(`\n--- MENSAGEM GERADA [${context}] ---`);
    console.log(`Para: ${phone} (Formatado: ${formatted})`);
    console.log(`Conteúdo: "${text}"`);
    console.log(`------------------------------------\n`);

    if (connectionStatus !== 'CONNECTED' || !sock) {
      console.log(`[${context}] Erro ao enviar: WhatsApp desconectado.`);
      return false;
    }

    await sock.sendMessage(jid, { text });
    console.log(`[${context}] Mensagem enviada com sucesso para ${phone}!`);
    return true;
  } catch (error) {
    console.error(`[${context}] Erro no envio via Baileys para ${phone}:`, error);
    return false;
  }
}

async function connectToWhatsApp() {
  try {
    connectionStatus = 'CONNECTING';
    authState = await usePrismaAuthState(prisma);

    sock = makeWASocket({
      auth: authState.state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: true,
      defaultQueryTimeoutMs: undefined
    });

    sock.ev.on('creds.update', authState.saveCreds);

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        try {
          qrCodeData = await QRCode.toDataURL(qr);
        } catch (err) {
          console.error('Erro ao gerar imagem base64 do QR:', err);
        }
      }

      if (connection === 'close') {
        qrCodeData = null;
        connectionStatus = 'DISCONNECTED';
        connectedNumber = null;
        
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const isLoggedOut = statusCode === DisconnectReason.loggedOut;
        console.log(`Conexão com WhatsApp fechada. Status Code: ${statusCode || 'N/A'}. Motivo:`, lastDisconnect?.error?.message || 'Desconhecido');
        
        if (isManualLogout || isLoggedOut) {
          console.log('Sessão encerrada permanentemente (desconectado pelo usuário ou deslogado no celular). Limpando credenciais no banco...');
          if (authState) {
            await authState.clearAll();
          }
          isManualLogout = false; // Reset flag
          
          // Reconnect after 5 seconds to generate a new QR Code for login
          console.log('Tentando inicializar nova sessão em 5 segundos...');
          setTimeout(connectToWhatsApp, 5000);
        } else {
          console.log('Conexão perdida (possível sleep do PC ou queda de rede). Tentando reconectar automaticamente em 5 segundos sem limpar credenciais...');
          setTimeout(connectToWhatsApp, 5000);
        }
      } else if (connection === 'open') {
        connectionStatus = 'CONNECTED';
        qrCodeData = null;
        const userJid = sock.user.id;
        connectedNumber = userJid.split(':')[0] || userJid;
        console.log(`WhatsApp Conectado com sucesso no número: ${connectedNumber}`);
      }
    });
  } catch (error) {
    console.error('Erro no fluxo de inicialização do Baileys:', error);
    connectionStatus = 'DISCONNECTED';
  }
}

// Lógica de verificação automática do banco de dados
async function rodarVerificacoesDoDia() {
  console.log('Iniciando varredura e envio de avisos automáticos...');
  const templates = globalTemplates;

  try {
    const SPDate = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Sao_Paulo" }));
    const hojeUTC = new Date(Date.UTC(SPDate.getFullYear(), SPDate.getMonth(), SPDate.getDate(), 0, 0, 0, 0));

    // Atualiza automaticamente as mensalidades vencidas de PENDENTE para INADIMPLENTE
    await prisma.mensalidades.updateMany({
      where: {
        status: 'PENDENTE',
        vencimento: { lt: hojeUTC }
      },
      data: {
        status: 'INADIMPLENTE'
      }
    });

    // Reverte automaticamente as mensalidades futuras de INADIMPLENTE para PENDENTE
    await prisma.mensalidades.updateMany({
      where: {
        status: 'INADIMPLENTE',
        vencimento: { gte: hojeUTC }
      },
      data: {
        status: 'PENDENTE'
      }
    });
    
    // --- 1. AULA HOJE ---
    const diasMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const diaTermo = diasMap[SPDate.getDay()];
    const diasMapLong = {
      'Seg': 'Segunda-feira',
      'Ter': 'Terça-feira',
      'Qua': 'Quarta-feira',
      'Qui': 'Quinta-feira',
      'Sex': 'Sexta-feira',
      'Sáb': 'Sábado',
      'Dom': 'Domingo'
    };
    const diaLongo = diasMapLong[diaTermo] || '';

    const matriculasAtivas = await prisma.matriculas.findMany({
      where: { ativo: true },
      include: {
        horarios: true,
        alunos: true,
        modalidades: true
      }
    });

    const matriculasDoDia = matriculasAtivas.filter((m) => {
      if (!m.alunos || !m.alunos.ativo) return false;
      const fixo = m.horarios?.dias_semana?.includes(diaTermo);
      const custom = m.dias_personalizados?.includes(diaLongo) || m.dias_personalizados?.includes(diaTermo);
      const livre = m.horario_personalizado?.toLowerCase().includes('livre');
      return fixo || custom || livre;
    });

    for (const m of matriculasDoDia) {
      const aluno = m.alunos;
      const modNome = m.modalidades?.nome || 'Treino';
      let horaDisplay = 'Livre';
      
      const isCustomToday = m.dias_personalizados?.includes(diaLongo) || m.dias_personalizados?.includes(diaTermo);
      
      if (isCustomToday) {
        if (m.hora_inicio_personalizada) {
          horaDisplay = new Date(m.hora_inicio_personalizada).toISOString().substring(11, 16);
        } else if (m.horario_personalizado) {
          horaDisplay = m.horario_personalizado.split('|')[1] || m.horario_personalizado;
        }
      } else if (m.horarios?.hora_inicio) {
        horaDisplay = new Date(m.horarios.hora_inicio).toISOString().substring(11, 16);
      }

      const msg = templates.aulaHoje
        .replace('{nome}', aluno.nome || 'Aluno')
        .replace('{dia}', diaTermo)
        .replace('{modalidade}', modNome)
        .replace('{horario}', horaDisplay);

      await sendWhatsAppMessage(aluno.telefone, msg, 'Aviso de Aula Hoje');
    }

    console.log('Varredura de aulas concluída com sucesso!');
  } catch (error) {
    console.error('Erro na varredura automatizada:', error);
  }
}

// Rota HTTP para buscar status e QR Code
app.get('/status', (req, res) => {
  res.json({
    status: connectionStatus,
    qr: qrCodeData,
    number: connectedNumber
  });
});

// Rota HTTP para buscar templates de mensagens
app.get('/templates', (req, res) => {
  res.json(globalTemplates);
});

// Rota HTTP para salvar templates de mensagens
app.post('/templates', async (req, res) => {
  const templates = req.body;
  if (!templates || typeof templates !== 'object') {
    return res.status(400).json({ error: 'Objeto de templates inválido' });
  }

  const success = await salvarTemplates(templates);
  res.json({ success });
});

// Rota HTTP para desconectar e limpar sessão
app.post('/disconnect', async (req, res) => {
  console.log('Desconectando WhatsApp por requisição...');
  try {
    isManualLogout = true;
    qrCodeData = null;
    connectionStatus = 'DISCONNECTED';
    connectedNumber = null;

    if (sock) {
      await sock.logout();
    } else {
      // Se não houver socket ativo mas houver credenciais antigas no banco, limpar agora
      if (authState) {
        await authState.clearAll();
      }
      setTimeout(connectToWhatsApp, 1000);
    }
  } catch (err) {
    console.error('Erro ao efetuar logout:', err);
    // Em caso de erro ao tentar logout do socket, força a limpeza local das credenciais
    if (authState) {
      await authState.clearAll();
    }
    isManualLogout = false;
    setTimeout(connectToWhatsApp, 1000);
  }

  res.json({ success: true });
});

// Rota HTTP para envio manual / webhook instantâneo
app.post('/send', async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res.status(400).json({ error: 'Parâmetros phone e message são obrigatórios' });
  }

  const success = await sendWhatsAppMessage(phone, message, 'Envio Instantâneo');
  res.json({ success });
});

// Rota HTTP para disparar varredura do dia manualmente
app.post('/trigger-checks', async (req, res) => {
  await rodarVerificacoesDoDia();
  res.json({ success: true, message: 'Varredura de avisos executada no servidor!' });
});

const MILISEGUNDOS_DIA = 24 * 60 * 60 * 1000;
setInterval(rodarVerificacoesDoDia, MILISEGUNDOS_DIA);

app.listen(PORT, async () => {
  console.log(`Servidor WhatsApp rodando na porta ${PORT}`);
  await carregarTemplates();
  connectToWhatsApp();
});
