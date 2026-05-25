import prisma from '@/lib/prisma'
import { AgendaCalendar } from './AgendaCalendar'

export const dynamic = "force-dynamic"

export default async function AgendaPage() {
  // We need to fetch all matriculas to map them to weekly events
  const matriculas = await prisma.matriculas.findMany({
    where: { ativo: true },
    include: {
      alunos: true,
      modalidades: true,
      horarios: true
    }
  })

  // Convert matriculas into events for FullCalendar (with custom startTime/endTime fields)
  // FullCalendar recurring events format:
  // { title: 'Boxe - João', daysOfWeek: [1, 3], startTime: '10:00', endTime: '11:00' }
  const events: any[] = []

  const diaMap: Record<string, number> = {
    'Dom': 0, 'Seg': 1, 'Ter': 2, 'Qua': 3, 'Qui': 4, 'Sex': 5, 'Sab': 6,
    'Dom.': 0, 'Seg.': 1, 'Ter.': 2, 'Qua.': 3, 'Qui.': 4, 'Sex.': 5, 'Sab.': 6,
    'Domingo': 0, 'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6,
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6
  }

  // Map for Horarios
  const horarioMap = new Map<number, {
    modalidade: string,
    diasStr: string,
    hInicio: string,
    hFim: string,
    alunos: { nome: string, telefone: string }[]
  }>()

  // Custom events
  const customEvents: any[] = []

  const parseDays = (diasStr: string) => {
    // Pode vir como "Seg, Qua, Sex" ou "Seg/Qua/Sex"
    const separator = diasStr.includes('/') ? '/' : ','
    return diasStr.split(separator).map((d: string) => diaMap[d.trim()]).filter((d: number | undefined) => d !== undefined)
  }

  matriculas.forEach((m: any) => {
    if (m.horario_id && m.horarios) {
      if (!horarioMap.has(m.horario_id)) {
        horarioMap.set(m.horario_id, {
          modalidade: m.modalidades?.nome || 'Treino',
          diasStr: m.horarios.dias_semana || "",
          hInicio: m.horarios.hora_inicio ? new Date(m.horarios.hora_inicio).toISOString().substring(11, 16) : "",
          hFim: m.horarios.hora_fim ? new Date(m.horarios.hora_fim).toISOString().substring(11, 16) : "",
          alunos: []
        })
      }
      if (m.alunos) {
        horarioMap.get(m.horario_id)?.alunos.push({ nome: m.alunos.nome, telefone: m.alunos.telefone || '' })
      }
    } else if (m.dias_personalizados || m.horario_personalizado) {
      const diasStr = m.dias_personalizados || ""
      const hInicio = m.hora_inicio_personalizada ? new Date(m.hora_inicio_personalizada).toISOString().substring(11, 16) : ""
      const hFim = m.hora_fim_personalizada ? new Date(m.hora_fim_personalizada).toISOString().substring(11, 16) : undefined
      if (diasStr && hInicio) {
        const daysOfWeek = parseDays(diasStr)
        if (daysOfWeek.length > 0) {
          customEvents.push({
            title: `${m.modalidades?.nome || 'Treino'} - ${m.alunos?.nome}`,
            daysOfWeek,
            startTime: hInicio,
            endTime: hFim,
            color: '#10b981', // emerald-500
            extendedProps: {
              isCustom: true,
              telefone: m.alunos?.telefone,
              modalidade: m.modalidades?.nome || 'Treino',
              alunosList: m.alunos ? [{ nome: m.alunos.nome, telefone: m.alunos.telefone || '' }] : [],
              startTime: hInicio,
              endTime: hFim || ''
            }
          })
        }
      }
    }
  })

  Array.from(horarioMap.values()).forEach(h => {
    const daysOfWeek = parseDays(h.diasStr)
    if (daysOfWeek.length > 0 && h.hInicio) {
      events.push({
        title: `${h.modalidade} (${h.alunos.length} Alunos)`,
        daysOfWeek,
        startTime: h.hInicio,
        endTime: h.hFim || undefined,
        extendedProps: {
          modalidade: h.modalidade,
          alunosList: h.alunos,
          startTime: h.hInicio,
          endTime: h.hFim || ''
        }
      })
    }
  })

  events.push(...customEvents)

  // We should also fetch "horarios livres" (bloqueios)
  const bloqueios = await prisma.horarios.findMany({
    where: { modalidade_id: null }
  })

  bloqueios.forEach((b: any) => {
    if (b.dias_semana && b.hora_inicio) {
      const daysOfWeek = parseDays(b.dias_semana)
      if (daysOfWeek.length > 0) {
        const hIn = new Date(b.hora_inicio).toISOString().substring(11, 16)
        const hFi = b.hora_fim ? new Date(b.hora_fim).toISOString().substring(11, 16) : undefined
        events.push({
          title: 'Horário Livre (Vaga)',
          daysOfWeek,
          startTime: hIn,
          endTime: hFi,
          color: '#f1f5f9', // slate-100
          textColor: '#64748b', // slate-500
          extendedProps: {
            isBloqueio: true
          }
        })
      }
    }
  })

  const dbLembretes = await prisma.lembretes.findMany({
    orderBy: { data: 'asc' }
  })

  const lembretes = dbLembretes.map((l: any) => ({
    id: Number(l.id),
    data: l.data.toISOString().substring(0, 10),
    texto: l.texto,
    cor: l.cor || 'blue'
  }))

  lembretes.forEach((l: any) => {
    events.push({
      id: `lembrete-${l.id}`,
      title: `📝 ${l.texto}`,
      start: l.data,
      allDay: true,
      color: l.cor === 'rose' ? '#ffe4e6' : l.cor === 'emerald' ? '#d1fae5' : l.cor === 'amber' ? '#fef3c7' : '#dbeafe',
      textColor: l.cor === 'rose' ? '#9f1239' : l.cor === 'emerald' ? '#065f46' : l.cor === 'amber' ? '#92400e' : '#1e40af',
      extendedProps: {
        isLembrete: true,
        lembreteId: l.id,
        texto: l.texto,
        corLabel: l.cor
      }
    })
  })

  return (
    <div className="w-full text-slate-800 font-sans">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#2c3e50] flex items-center gap-3">
            <i className="bi bi-calendar-week text-blue-600"></i> Agenda Geral
          </h1>
          <p className="text-slate-500 text-sm mt-1">Visualize treinos, horários livres e adicione anotações do dia a dia.</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-0 overflow-hidden">
        <AgendaCalendar initialEvents={events} initialLembretes={lembretes} />
      </div>
    </div>
  )
}
