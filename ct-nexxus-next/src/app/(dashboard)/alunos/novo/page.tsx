import { getModalidades, getPrecos, getHorarios } from "@/app/actions"
import NovoAlunoForm from "./NovoAlunoForm"

export default async function Page() {
  const modalidades = await getModalidades()
  const precos = await getPrecos()
  const horarios = await getHorarios()

  const safeMods = modalidades.map((m: any) => ({ ...m, id: Number(m.id) }))
  const safePrecos = precos.map((p: any) => ({ 
    ...p, 
    id: Number(p.id), 
    modalidade_id: Number(p.modalidade_id), 
    modalidade: { ...p.modalidades, id: Number(p.modalidades?.id) },
    frequenciaSemanal: p.frequencia_semanal
  }))
  const safeHorarios = horarios.map((h: any) => ({ 
    ...h, 
    id: Number(h.id), 
    modalidade_id: h.modalidade_id ? Number(h.modalidade_id) : null, 
    modalidade: h.modalidades ? { ...h.modalidades, id: Number(h.modalidades.id) } : null,
    horaInicio: h.hora_inicio ? new Date(h.hora_inicio).toISOString().substring(11, 16) : '',
    horaFim: h.hora_fim ? new Date(h.hora_fim).toISOString().substring(11, 16) : '',
    diasSemana: h.dias_semana
  }))

  return (
    <NovoAlunoForm 
      initialModalidades={safeMods}
      initialPrecos={safePrecos}
      initialHorarios={safeHorarios}
    />
  )
}
