import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import NovoAlunoForm from '../../novo/NovoAlunoForm'
import { getModalidades, getPrecos, getHorarios } from '@/app/actions'

export const dynamic = "force-dynamic"

export default async function EditarAlunoPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const id = Number(params.id)

  const aluno = await prisma.alunos.findUnique({
    where: { id },
    include: {
      matriculas: {
        where: { ativo: true }
      }
    }
  })

  if (!aluno) {
    notFound()
  }

  const modalidades = await getModalidades()
  const precos = await getPrecos()
  const horarios = await getHorarios()

  // Convert to serializable format
  const serializableAluno = {
    ...aluno,
    id: Number(aluno.id),
    matriculas: aluno.matriculas.map((m: any) => ({
      ...m,
      id: Number(m.id),
      aluno_id: Number(m.aluno_id),
      modalidade_id: m.modalidade_id ? Number(m.modalidade_id) : null,
      preco_id: m.preco_id ? Number(m.preco_id) : null,
      horario_id: m.horario_id ? Number(m.horario_id) : null,
      data_inicio: m.data_inicio ? m.data_inicio.toISOString() : null,
      data_fim: m.data_fim ? m.data_fim.toISOString() : null,
      hora_inicio_personalizada: m.hora_inicio_personalizada ? m.hora_inicio_personalizada.toISOString() : null,
      hora_fim_personalizada: m.hora_fim_personalizada ? m.hora_fim_personalizada.toISOString() : null
    }))
  }

  return (
    <NovoAlunoForm 
      initialModalidades={modalidades}
      initialPrecos={precos}
      initialHorarios={horarios}
      initialAluno={serializableAluno}
    />
  )
}
