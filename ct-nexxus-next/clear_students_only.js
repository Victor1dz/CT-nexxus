const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('Iniciando limpeza seletiva (Apenas Alunos)...')

  console.log('Deletando presenças de alunos...')
  await prisma.presenca.deleteMany()

  console.log('Deletando treinos diários das fichas...')
  await prisma.treinos_dia.deleteMany()

  console.log('Deletando fichas de treino...')
  await prisma.fichas_treino.deleteMany()

  console.log('Deletando notificações de email...')
  await prisma.notificacao_email.deleteMany()

  console.log('Deletando mensalidades...')
  await prisma.mensalidades.deleteMany()

  console.log('Deletando matrículas dos alunos...')
  await prisma.matriculas.deleteMany()

  console.log('Deletando anamneses...')
  await prisma.anamneses.deleteMany()

  console.log('Deletando agendamentos...')
  await prisma.agendamentos.deleteMany()

  console.log('Deletando alunos...')
  await prisma.alunos.deleteMany()

  console.log('Deletando lembretes rápidos da agenda...')
  await prisma.lembretes.deleteMany()

  console.log('--- LIMPEZA SELETIVA CONCLUÍDA ---')
  console.log('Alunos, matrículas, pagamentos e fichas apagados.');
  console.log('Modalidades, Preços e Horários foram POUPADOS e continuam salvos!');
}

main()
  .catch(e => {
    console.error('Erro ao realizar limpeza seletiva:', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
