import prisma from '../src/lib/prisma';

async function main() {
  console.log('Iniciando limpeza de alunos...');

  // Alunos para deletar: Paulo (id: 26) e Victor (id: 6)
  const idsToDelete = [26, 6];

  for (const id of idsToDelete) {
    console.log(`Limpando dados do aluno ID ${id}...`);
    
    // Deletar mensalidades
    const mensDel = await prisma.mensalidades.deleteMany({
      where: { aluno_id: id }
    });
    console.log(`Deletadas ${mensDel.count} mensalidades.`);

    // Deletar presença
    const presDel = await prisma.presenca.deleteMany({
      where: { matriculas: { aluno_id: id } }
    });
    console.log(`Deletadas ${presDel.count} presenças.`);

    // Deletar matrículas
    const matDel = await prisma.matriculas.deleteMany({
      where: { aluno_id: id }
    });
    console.log(`Deletadas ${matDel.count} matrículas.`);

    // Deletar anamneses
    const anamDel = await prisma.anamneses.deleteMany({
      where: { aluno_id: id }
    });
    console.log(`Deletadas ${anamDel.count} anamneses.`);

    // Busca todas as fichas de treino deste aluno para deletar treinos_dia associados
    const fichas = await prisma.fichas_treino.findMany({
      where: { aluno_id: id }
    });
    const fichaIds = fichas.map((f: any) => f.id);

    // Deletar treinos_dia
    const treinosDel = await prisma.treinos_dia.deleteMany({
      where: { ficha_treino_id: { in: fichaIds } }
    });
    console.log(`Deletados ${treinosDel.count} treinos do dia.`);

    // Deletar fichas de treino
    const fichasDel = await prisma.fichas_treino.deleteMany({
      where: { id: { in: fichaIds } }
    });
    console.log(`Deletadas ${fichasDel.count} fichas de treino.`);

    // Deletar agendamentos
    const agendDel = await prisma.agendamentos.deleteMany({
      where: { aluno_id: id }
    });
    console.log(`Deletados ${agendDel.count} agendamentos.`);

    // Deletar aluno
    try {
      const alunoDel = await prisma.alunos.delete({
        where: { id }
      });
      console.log(`Deletado aluno: ${alunoDel.nome}`);
    } catch (e: any) {
      console.log(`Aluno ID ${id} já não existia ou erro:`, e.message);
    }
  }

  // Ativar Tatiana (id: 16) e Mayra (id: 25)
  console.log('Ativando Tatiana Diniz e Mayra Rodrigues...');
  await prisma.alunos.updateMany({
    where: {
      id: { in: [16, 25] }
    },
    data: {
      ativo: true
    }
  });

  console.log('Alunos atualizados com sucesso!');
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
