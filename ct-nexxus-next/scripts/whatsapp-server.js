const makeWASocket = require('@whiskeysockets/baileys').default;
const { useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const express = require('express');
const cors = require('cors');
const pino = require('pino');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const AUTH_DIR = path.join(__dirname, '../.wpp_auth');
const TEMPLATES_FILE = path.join(__dirname, '../whatsapp-templates.json');

let sock = null;
let qrCodeData = null;
let connectionStatus = 'DISCONNECTED';
let connectedNumber = null;
let isManualLogout = false;

// SAFETY CHECK: ONLY ALLOW SENDING MESSAGES TO PAULO DURING TESTING
const ALLOWED_TEST_NUMBER = '5515997040121';

// Função para formatar data UTC de forma segura sem shift de fuso horário
function formatarDataUTC(date) {
  if (!date) return '';
  const d = new Date(date);
  const dia = String(d.getUTCDate()).padStart(2, '0');
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
  const ano = d.getUTCFullYear();
  return `${dia}/${mes}/${ano}`;
}

// Carregar templates do arquivo JSON ou usar defaults
function carregarTemplates() {
  const defaultTemplates = {
    aulaHoje: "Olá, {nome}! Passando para avisar que hoje ({dia}) você tem aula de {modalidade} marcada para as {horario}. Esperamos você no CT!",
    lembreteVencimento: "Olá, {nome}! Lembramos que sua mensalidade de {competencia} vence daqui a {dias} dia(s) (no dia {vencimento}). Valor: R$ {valor}.\n\n💵 *Formas de Pagamento:*\n• Pix: ctnexxus@gmail.com 📱\n• Dinheiro 💵\n• Cartão 💳",
    mensalidadeAtrasada: "Olá, {nome}! Constatamos que sua mensalidade de {competencia} (vencida em {vencimento}) está em aberto. Se já efetuou o pagamento, favor desconsiderar e nos enviar o comprovante.\n\n💵 *Formas de Pagamento:*\n• Pix: ctnexxus@gmail.com 📱\n• Dinheiro 💵\n• Cartão 💳",
    confirmacaoPagamento: "Obrigado, {nome}! Confirmamos o recebimento do pagamento da sua mensalidade referente a {competencia}. Bom treino!\n\n💵 *Formas de Pagamento:*\n• Pix: ctnexxus@gmail.com 📱\n• Dinheiro 💵\n• Cartão 💳"
  };

  try {
    if (fs.existsSync(TEMPLATES_FILE)) {
      const data = fs.readFileSync(TEMPLATES_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Erro ao carregar arquivo de templates:', err);
  }

  // Se não existir, salvar o padrão
  try {
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(defaultTemplates, null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao escrever arquivo default de templates:', err);
  }
  return defaultTemplates;
}

function salvarTemplates(templates) {
  try {
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(templates, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Erro ao salvar arquivo de templates:', err);
    return false;
  }
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

    // Safety check interceptor
    if (formatted !== ALLOWED_TEST_NUMBER) {
      console.log(`[SAFETY INTERCEPT] Ignorando envio real para o número ${phone}. Apenas o número de teste ${ALLOWED_TEST_NUMBER} está liberado.`);
      return true;
    }

    if (connectionStatus !== 'CONNECTED' || !sock) {
      console.log(`[${context}] Erro ao enviar: WhatsApp desconectado.`);
      return false;
    }

    await sock.sendMessage(jid, { text });
    console.log(`[${context}] Mensagem enviada com sucesso no WhatsApp do Paulo!`);
    return true;
  } catch (error) {
    console.error(`[${context}] Erro no envio via Baileys para ${phone}:`, error);
    return false;
  }
}

async function connectToWhatsApp() {
  try {
    connectionStatus = 'CONNECTING';
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);

    sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }),
      printQRInTerminal: true,
      defaultQueryTimeoutMs: undefined
    });

    sock.ev.on('creds.update', saveCreds);

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
          console.log('Sessão encerrada permanentemente (desconectado pelo usuário ou deslogado no celular). Limpando credenciais...');
          if (fs.existsSync(AUTH_DIR)) {
            fs.rmSync(AUTH_DIR, { recursive: true, force: true });
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
  const templates = carregarTemplates();

  try {
    const hojeLocal = new Date();
    
    // --- 1. AULA HOJE ---
    const diasMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const diaTermo = diasMap[hojeLocal.getDay()];

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
      const custom = m.dias_personalizados?.includes(diaTermo);
      const livre = m.horario_personalizado?.toLowerCase().includes('livre');
      return fixo || custom || livre;
    });

    for (const m of matriculasDoDia) {
      const aluno = m.alunos;
      const modNome = m.modalidades?.nome || 'Treino';
      let horaDisplay = 'Livre';
      
      if (m.horarios?.hora_inicio) {
        horaDisplay = new Date(m.horarios.hora_inicio).toISOString().substring(11, 16);
      } else if (m.horario_personalizado) {
        horaDisplay = m.horario_personalizado.split('|')[1] || m.horario_personalizado;
      }

      const msg = templates.aulaHoje
        .replace('{nome}', aluno.nome || 'Aluno')
        .replace('{dia}', diaTermo)
        .replace('{modalidade}', modNome)
        .replace('{horario}', horaDisplay);

      await sendWhatsAppMessage(aluno.telefone, msg, 'Aviso de Aula Hoje');
    }

    // --- 2. LEMBRETE DE VENCIMENTO (3, 2 E 1 DIAS ANTES) ---
    // Usando cálculo UTC robusto para evitar deslocamento de fuso horário
    for (let dias of [1, 2, 3]) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + dias);
      
      const startOfTarget = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0));
      const endOfTarget = new Date(Date.UTC(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999));

      const mensalidadesPerto = await prisma.mensalidades.findMany({
        where: {
          status: 'PENDENTE',
          vencimento: {
            gte: startOfTarget,
            lte: endOfTarget
          }
        },
        include: {
          alunos: true
        }
      });

      for (const m of mensalidadesPerto) {
        const aluno = m.alunos;
        if (!aluno || !aluno.ativo || !aluno.telefone) continue;

        const dataFormatada = formatarDataUTC(m.vencimento);
        const msg = templates.lembreteVencimento
          .replace('{nome}', aluno.nome || 'Aluno')
          .replace('{competencia}', m.competencia || '')
          .replace('{dias}', dias.toString())
          .replace('{vencimento}', dataFormatada)
          .replace('{valor}', Number(m.valor || 0).toFixed(2));

        await sendWhatsAppMessage(aluno.telefone, msg, `Lembrete Vencimento ${dias}d`);
      }
    }

    // --- 3. MENSALIDADES ATRASADAS (INADIMPLENTES) ---
    const mensalidadesAtrasadas = await prisma.mensalidades.findMany({
      where: {
        status: 'INADIMPLENTE'
      },
      include: {
        alunos: true
      }
    });

    for (const m of mensalidadesAtrasadas) {
      const aluno = m.alunos;
      if (!aluno || !aluno.ativo || !aluno.telefone) continue;

      const dataVenc = formatarDataUTC(m.vencimento);
      const msg = templates.mensalidadeAtrasada
        .replace('{nome}', aluno.nome || 'Aluno')
        .replace('{competencia}', m.competencia || '')
        .replace('{vencimento}', dataVenc);

      await sendWhatsAppMessage(aluno.telefone, msg, 'Mensalidade Atrasada');
    }

    console.log('Varredura e envio concluídos com sucesso!');
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
  const templates = carregarTemplates();
  res.json(templates);
});

// Rota HTTP para salvar templates de mensagens
app.post('/templates', (req, res) => {
  const templates = req.body;
  if (!templates || typeof templates !== 'object') {
    return res.status(400).json({ error: 'Objeto de templates inválido' });
  }

  const success = salvarTemplates(templates);
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
      // Se não houver socket ativo mas houver credenciais antigas na pasta, limpar agora
      if (fs.existsSync(AUTH_DIR)) {
        fs.rmSync(AUTH_DIR, { recursive: true, force: true });
      }
      setTimeout(connectToWhatsApp, 1000);
    }
  } catch (err) {
    console.error('Erro ao efetuar logout:', err);
    // Em caso de erro ao tentar logout do socket, força a limpeza local das credenciais
    if (fs.existsSync(AUTH_DIR)) {
      fs.rmSync(AUTH_DIR, { recursive: true, force: true });
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

app.listen(PORT, () => {
  console.log(`Servidor WhatsApp rodando na porta ${PORT}`);
  connectToWhatsApp();
});
