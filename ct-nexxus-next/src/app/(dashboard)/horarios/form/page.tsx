import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import HorariosFormClient from './HorariosFormClient'

export const dynamic = "force-dynamic"

export default async function HorariosFormPage(props: { searchParams: Promise<{ id?: string, inicio?: string, fim?: string, dia?: string }> }) {
  const searchParams = await props.searchParams
  const horarioId = searchParams.id ? Number(searchParams.id) : null
  const inicioLivre = searchParams.inicio
  const fimLivre = searchParams.fim
  const diaLivre = searchParams.dia

  let horario = null
  if (horarioId) {
    horario = await prisma.horarios.findUnique({ where: { id: horarioId } })
    if (!horario) {
      notFound()
    }
  } else if (inicioLivre && fimLivre && diaLivre) {
    horario = {
      hora_inicio: new Date(`1970-01-01T${inicioLivre}:00.000Z`),
      hora_fim: new Date(`1970-01-01T${fimLivre}:00.000Z`),
      dias_semana: diaLivre,
      ativo: true
    }
  }

  const modalidades = await prisma.modalidades.findMany({
    orderBy: { nome: 'asc' }
  })

  const serializableHorario = horario ? {
    id: Number(horario.id),
    modalidade_id: horario.modalidade_id ? Number(horario.modalidade_id) : null,
    dias_semana: horario.dias_semana,
    hora_inicio: horario.hora_inicio ? horario.hora_inicio.toISOString() : null,
    hora_fim: horario.hora_fim ? horario.hora_fim.toISOString() : null,
    ativo: horario.ativo
  } : null

  const serializableModalidades = modalidades.map((m: any) => ({
    id: Number(m.id),
    nome: m.nome
  }))

  return (
    <HorariosFormClient 
      horario={serializableHorario} 
      modalidades={serializableModalidades} 
    />
  )
}
