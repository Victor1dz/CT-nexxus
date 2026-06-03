import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import ModalidadesFormClient from './ModalidadesFormClient'

export const dynamic = "force-dynamic"

export default async function ModalidadesFormPage(props: { searchParams: Promise<{ id?: string }> }) {
  const searchParams = await props.searchParams
  const modalidadeId = searchParams.id ? Number(searchParams.id) : null

  let modalidade = null
  let horarios: any[] = []

  if (modalidadeId) {
    modalidade = await prisma.modalidades.findUnique({ where: { id: modalidadeId } })
    if (!modalidade) {
      notFound()
    }
    horarios = await prisma.horarios.findMany({
      where: { modalidade_id: modalidadeId },
      orderBy: { hora_inicio: 'asc' }
    })
  }

  // Convert database types to simple serializable objects for Client Component
  const serializableModalidade = modalidade ? {
    id: Number(modalidade.id),
    nome: modalidade.nome,
    descricao: modalidade.descricao,
    ativa: modalidade.ativa,
    exige_horario: modalidade.exige_horario
  } : null

  const serializableHorarios = horarios.map((h: any) => ({
    id: Number(h.id),
    modalidade_id: h.modalidade_id ? Number(h.modalidade_id) : null,
    dias_semana: h.dias_semana,
    hora_inicio: h.hora_inicio ? h.hora_inicio.toISOString() : null,
    hora_fim: h.hora_fim ? h.hora_fim.toISOString() : null,
    ativo: h.ativo
  }))

  return (
    <ModalidadesFormClient 
      modalidade={serializableModalidade} 
      initialHorarios={serializableHorarios} 
    />
  )
}
