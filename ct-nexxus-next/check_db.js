const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const matriculas = await prisma.matriculas.findMany({
    include: { horarios: true }
  })
  console.log('MATRICULAS:')
  matriculas.forEach(m => {
    console.log(`Matricula ${m.id} - Horario ID: ${m.horario_id} - Dias (Horario): ${m.horarios?.dias_semana} - Dias (Custom): ${m.dias_personalizados}`)
  })
  const horarios = await prisma.horarios.findMany()
  console.log('HORARIOS:')
  horarios.forEach(h => {
    console.log(`Horario ${h.id} - Dias: ${h.dias_semana}`)
  })
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect())
