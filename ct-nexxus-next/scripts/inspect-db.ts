import prisma from '../src/lib/prisma';

async function main() {
  const modalities = await prisma.modalidades.findMany({ where: { ativa: true } });
  const precos = await prisma.precos.findMany({ include: { modalidades: true } });
  const alunos = await prisma.alunos.findMany({ take: 5 });

  console.log('--- MODALIDADES ATIVAS ---');
  console.log(modalities.map((m: any) => ({ id: m.id.toString(), nome: m.nome })));

  console.log('--- PRECOS ---');
  console.log(precos.map((p: any) => ({
    id: p.id.toString(),
    modalidade: p.modalidades?.nome,
    frequencia: p.frequencia_semanal,
    valor: p.valor
  })));

  console.log('--- ALUNOS (Primeiros 5) ---');
  console.log(alunos.map((a: any) => ({ id: a.id.toString(), nome: a.nome, ativo: a.ativo, telefone: a.telefone })));
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
