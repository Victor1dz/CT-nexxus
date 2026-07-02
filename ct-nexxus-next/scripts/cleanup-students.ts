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
