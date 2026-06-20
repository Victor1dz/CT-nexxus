import prisma from '../src/lib/prisma';

async function main() {
  console.log('Iniciando seed de teste para Paulo...');

  // 1. Deativar todos os outros alunos existentes para segurança
  await prisma.alunos.updateMany({
    where: {
      NOT: {
        telefone: {
          contains: '997040121'
        }
      }
    },
    data: {
      ativo: false
    }
  });
  console.log('Outros alunos desativados temporariamente para teste.');

  // 2. Encontrar ou criar o aluno Paulo
  let paulo = await prisma.alunos.findFirst({
    where: {
      telefone: {
        contains: '997040121'
      }
    }
  });

  if (!paulo) {
    paulo = await prisma.alunos.create({
      data: {
        nome: 'Paulo Cliente Teste',
        telefone: '15997040121',
        ativo: true,
        data_cadastro: new Date()
      }
    });
    console.log('Criado novo aluno Paulo:', paulo.nome);
  } else {
    paulo = await prisma.alunos.update({
      where: { id: paulo.id },
      data: {
        nome: 'Paulo Cliente Teste',
        telefone: '15997040121',
        ativo: true
      }
    });
    console.log('Atualizado aluno Paulo existente.');
  }

  // Limpar matrículas antigas do Paulo
  await prisma.mensalidades.deleteMany({ where: { aluno_id: paulo.id } });
  await prisma.presenca.deleteMany({ where: { matriculas: { aluno_id: paulo.id } } });
  await prisma.matriculas.deleteMany({ where: { aluno_id: paulo.id } });

  // 3. Criar uma nova matrícula ativa para Paulo
  // Vamos usar a modalidade Muay Thai (ID 8) e preço (ID 20)
  const hoje = new Date();
  
  // Vencimento daqui a 2 dias (22/06/2026)
  const diaVencimento = 22;

  const matricula = await prisma.matriculas.create({
    data: {
      aluno_id: paulo.id,
      modalidade_id: 8, // Muay Thai
      preco_id: 20, // Muay Thai 3x semana (120 reais)
      ativo: true,
      data_inicio: hoje,
      dia_vencimento: diaVencimento,
      dias_personalizados: 'Sáb|Ter|Qui', // Sábado é hoje!
      horario_personalizado: 'Personalizado|10:00 às 11:00'
    }
  });
  console.log('Matrícula criada para Paulo (Muay Thai, Sáb|Ter|Qui, vencimento dia 22).');

  // 4. Criar mensalidades de teste
  // Mensalidade 1: Vence em 2 dias (22/06/2026), status PENDENTE
  const vencimentoPerto = new Date(2026, 5, 22); // Junho é mês 5 (0-indexed)
  await prisma.mensalidades.create({
    data: {
      aluno_id: paulo.id,
      matricula_id: matricula.id,
      competencia: '2026-06',
      valor: 120,
      vencimento: vencimentoPerto,
      status: 'PENDENTE'
    }
  });
  console.log('Mensalidade de Junho (vencimento em 2 dias) criada como PENDENTE.');

  // Mensalidade 2: Vencida em 22/05/2026, status INADIMPLENTE
  const vencimentoAtrasado = new Date(2026, 4, 22); // Maio é mês 4
  await prisma.mensalidades.create({
    data: {
      aluno_id: paulo.id,
      matricula_id: matricula.id,
      competencia: '2026-05',
      valor: 120,
      vencimento: vencimentoAtrasado,
      status: 'INADIMPLENTE'
    }
  });
  console.log('Mensalidade de Maio (vencida) criada como INADIMPLENTE.');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
