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
  const diaMap: Record<string, number> = {
    'Dom': 0, 'Seg': 1, 'Ter': 2, 'Qua': 3, 'Qui': 4, 'Sex': 5, 'Sab': 6,
    'Dom.': 0, 'Seg.': 1, 'Ter.': 2, 'Qua.': 3, 'Qui.': 4, 'Sex.': 5, 'Sab.': 6,
    'Domingo': 0, 'Segunda': 1, 'Terça': 2, 'Quarta': 3, 'Quinta': 4, 'Sexta': 5, 'Sábado': 6,
    '0': 0, '1': 1, '2': 2, '3': 3, '4': 4, '5': 5, '6': 6
  }

  // Map for Horarios
  const getDatesForRecurring = (daysOfWeek: number[], startTime: string, endTime?: string) => {
    const dates: { start: string; end?: string }[] = []
    
    const startRange = new Date()
    startRange.setDate(startRange.getDate() - 60)
    const endRange = new Date()
    endRange.setDate(endRange.getDate() + 180)

    const cur = new Date(startRange)
    while (cur <= endRange) {
      const localDay = cur.getDay()
      if (daysOfWeek.includes(localDay)) {
        const year = cur.getFullYear()
        const month = String(cur.getMonth() + 1).padStart(2, '0')
        const dayStr = String(cur.getDate()).padStart(2, '0')
        const datePart = `${year}-${month}-${dayStr}`
        
        dates.push({
          start: `${datePart}T${startTime}`,
          end: endTime ? `${datePart}T${endTime}` : undefined
        })
      }
      cur.setDate(cur.getDate() + 1)
    }
    return dates
  }

  const horarioMap = new Map<number, {
    modalidade: string,
    diasStr: string,
    hInicio: string,
    hFim: string,
    alunos: { id: number, nome: string, telefone: string }[]
  }>()

  const parseDays = (diasStr: string) => {
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
        horarioMap.get(m.horario_id)?.alunos.push({ id: Number(m.alunos.id), nome: m.alunos.nome, telefone: m.alunos.telefone || '' })
      }
    }
  })

  const rawEvents: any[] = []

  // 1. Expand Fixed schedules
  Array.from(horarioMap.values()).forEach(h => {
    const daysOfWeek = parseDays(h.diasStr)
    if (daysOfWeek.length > 0) {
      if (h.hInicio) {
        const occurrences = getDatesForRecurring(daysOfWeek, h.hInicio, h.hFim || undefined)
        occurrences.forEach(occ => {
          rawEvents.push({
            title: `${h.modalidade} (${h.alunos.length} Alunos)`,
            start: occ.start,
            end: occ.end,
            extendedProps: {
              modalidade: h.modalidade,
              alunosList: h.alunos,
              startTime: h.hInicio,
              endTime: h.hFim || ''
            }
          })
        })
      } else {
        const occurrences = getDatesForRecurring(daysOfWeek, "00:00")
        occurrences.forEach(occ => {
          const datePart = occ.start.split('T')[0]
          rawEvents.push({
            title: `${h.modalidade} (Livre - ${h.alunos.length} Alunos)`,
            start: datePart,
            allDay: true,
            color: '#0284c7',
            extendedProps: {
              modalidade: h.modalidade,
              alunosList: h.alunos,
              startTime: 'Livre',
              endTime: ''
            }
          })
        })
      }
    }
  })

  // 2. Expand Custom schedules
  matriculas.forEach((m: any) => {
    if (m.dias_personalizados || m.horario_personalizado) {
      const diasStr = m.dias_personalizados || ""
      const hInicio = m.hora_inicio_personalizada ? new Date(m.hora_inicio_personalizada).toISOString().substring(11, 16) : ""
      const hFim = m.hora_fim_personalizada ? new Date(m.hora_fim_personalizada).toISOString().substring(11, 16) : undefined
      if (diasStr) {
        const daysOfWeek = parseDays(diasStr)
        if (daysOfWeek.length > 0) {
          const isLivre = !hInicio
          if (!isLivre) {
            const occurrences = getDatesForRecurring(daysOfWeek, hInicio, hFim)
            occurrences.forEach(occ => {
              rawEvents.push({
                title: `${m.modalidades?.nome || 'Treino'} (${hInicio}) - ${m.alunos?.nome}`,
                start: occ.start,
                end: occ.end,
                extendedProps: {
                  isCustom: true,
                  telefone: m.alunos?.telefone,
                  modalidade: m.modalidades?.nome || 'Treino',
                  alunosList: m.alunos ? [{ id: Number(m.alunos.id), nome: m.alunos.nome, telefone: m.alunos.telefone || '' }] : [],
                  startTime: hInicio,
                  endTime: hFim || ''
                }
              })
            })
          } else {
            const occurrences = getDatesForRecurring(daysOfWeek, "00:00")
            occurrences.forEach(occ => {
              const datePart = occ.start.split('T')[0]
              rawEvents.push({
                title: `${m.modalidades?.nome || 'Treino'} (Livre) - ${m.alunos?.nome}`,
                start: datePart,
                allDay: true,
                color: '#0284c7',
                extendedProps: {
                  isCustom: true,
                  telefone: m.alunos?.telefone,
                  modalidade: m.modalidades?.nome || 'Treino',
                  alunosList: m.alunos ? [{ id: Number(m.alunos.id), nome: m.alunos.nome, telefone: m.alunos.telefone || '' }] : [],
                  startTime: 'Livre',
                  endTime: ''
                }
              })
            })
          }
        }
      }
    }
  })

  // 3. Expand Bloqueios (Vagas Livres)
  const bloqueios = await prisma.horarios.findMany({
    where: { modalidade_id: null }
  })
  bloqueios.forEach((b: any) => {
    if (b.dias_semana && b.hora_inicio) {
      const daysOfWeek = parseDays(b.dias_semana)
      if (daysOfWeek.length > 0) {
        const hIn = new Date(b.hora_inicio).toISOString().substring(11, 16)
        const hFi = b.hora_fim ? new Date(b.hora_fim).toISOString().substring(11, 16) : undefined
        const occurrences = getDatesForRecurring(daysOfWeek, hIn, hFi)
        occurrences.forEach(occ => {
          rawEvents.push({
            title: 'Horário Livre (Vaga)',
            start: occ.start,
            end: occ.end,
            color: '#f1f5f9',
            textColor: '#64748b',
            extendedProps: {
              isBloqueio: true
            }
          })
        })
      }
    }
  })

  // 4. Lembretes
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
    rawEvents.push({
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

  // Group events by slot
  const finalEvents: any[] = []
  const tempGroups = new Map<string, any[]>()

  rawEvents.forEach(evt => {
    if (!evt.extendedProps?.isBloqueio && !evt.extendedProps?.isLembrete) {
      const key = evt.allDay ? `allday|${evt.start}` : `hourly|${evt.start}`
      if (!tempGroups.has(key)) {
        tempGroups.set(key, [])
      }
      tempGroups.get(key)!.push(evt)
    } else {
      finalEvents.push(evt)
    }
  })

  tempGroups.forEach((group, key) => {
    if (group.length === 1) {
      finalEvents.push(group[0])
    } else {
      const first = group[0]
      const combinedAlunosList: any[] = []
      const modalitiesSet = new Set<string>()
      let maxFim = first.end || undefined

      group.forEach(evt => {
        const modName = evt.extendedProps?.modalidade || 'Treino'
        modalitiesSet.add(modName)
        
        if (evt.end && (!maxFim || evt.end > maxFim)) {
          maxFim = evt.end
        }

        const list = evt.extendedProps?.alunosList || []
        list.forEach((aluno: any) => {
          combinedAlunosList.push({
            ...aluno,
            modalidade: modName,
            isCustom: !!evt.extendedProps?.isCustom,
            startTime: evt.extendedProps?.startTime || '',
            endTime: evt.extendedProps?.endTime || ''
          })
        })
      })

      const modalitiesArr = Array.from(modalitiesSet)
      const isAllDay = !!first.allDay
      const combinedTitle = isAllDay 
        ? `${modalitiesArr.join(', ')} (Livre - ${combinedAlunosList.length} Alunos)`
        : `${modalitiesArr.join(', ')} (${combinedAlunosList.length} Alunos)`

      finalEvents.push({
        title: combinedTitle,
        start: first.start,
        end: maxFim,
        allDay: isAllDay,
        color: isAllDay ? '#0284c7' : undefined,
        extendedProps: {
          isGrouped: true,
          modalidade: modalitiesArr.join(', '),
          modalidadesList: modalitiesArr,
          alunosList: combinedAlunosList,
          startTime: isAllDay ? 'Livre' : first.start.substring(11, 16),
          endTime: isAllDay ? '' : (maxFim ? maxFim.substring(11, 16) : '')
        }
      })
    }
  })

  const events = finalEvents

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
