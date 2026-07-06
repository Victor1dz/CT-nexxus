"use client"

import { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { salvarLembrete, excluirLembrete, getFichaTreinoAtivaDoAluno, salvarDescricaoExercicioDoTreino } from '@/app/actions'

interface Lembrete {
  id: number
  data: string
  texto: string
  cor: string
}

interface Props {
  initialEvents: any[]
  initialLembretes: Lembrete[]
}

function AlunoTreinoItem({ 
  treino, 
  eventDayOfWeek, 
  onUpdate 
}: { 
  treino: any
  eventDayOfWeek: string
  onUpdate: (updatedTreino: any) => void 
}) {
  const isToday = treino.dia_semana?.toLowerCase() === eventDayOfWeek?.toLowerCase()
  const [isExpanded, setIsExpanded] = useState(isToday)
  const [isEditing, setIsEditing] = useState(false)
  const [editedDescricao, setEditedDescricao] = useState(treino.descricao_exercicios || "")
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await salvarDescricaoExercicioDoTreino(treino.id, editedDescricao)
      if (res.success) {
        onUpdate({ ...treino, descricao_exercicios: editedDescricao })
        setIsEditing(false)
      } else {
        alert("Erro ao salvar treino: " + res.error)
      }
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar treino.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={`border rounded-2xl overflow-hidden transition-all duration-200 bg-white ${isToday ? 'border-blue-300 ring-2 ring-blue-500/10' : 'border-slate-200'}`}>
      <div 
        onClick={() => setIsExpanded(!isExpanded)}
        className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex justify-between items-center cursor-pointer select-none hover:bg-slate-100/50 transition-colors"
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <i className={`bi ${isExpanded ? 'bi-chevron-down' : 'bi-chevron-right'} text-slate-400 text-xs`}></i>
          {isToday ? (
            <span className="bg-blue-600 text-white px-2 py-0.5 rounded-lg font-extrabold uppercase tracking-wider text-[9px] flex items-center gap-1 shrink-0 shadow-sm animate-pulse">
              🔥 Hoje
            </span>
          ) : null}
          <span className="bg-slate-200/80 text-slate-700 px-2 py-0.5 rounded-lg font-extrabold uppercase tracking-wider text-[9px] shrink-0">
            {treino.dia_semana}
          </span>
          <span className="text-slate-500 font-bold text-xs truncate ml-1">{treino.foco_do_dia}</span>
        </div>
      </div>
      
      {isExpanded && (
        <div className="p-4 bg-white space-y-3">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editedDescricao}
                onChange={(e) => setEditedDescricao(e.target.value)}
                className="w-full min-h-[180px] bg-slate-50 border border-slate-300 rounded-xl p-4 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all font-semibold text-[15px] shadow-inner animate-in fade-in duration-200"
                placeholder="Digite os exercícios do aluno..."
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setIsEditing(false)
                    setEditedDescricao(treino.descricao_exercicios || "")
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-[10px] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSave}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-[10px] transition-colors flex items-center gap-1 shadow-sm"
                >
                  {saving ? (
                    <>
                      <i className="bi bi-arrow-repeat animate-spin"></i> Salvando...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-check-lg"></i> Salvar
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="relative group">
              <p className="whitespace-pre-wrap text-[15px] font-bold text-slate-800 bg-slate-50 border border-slate-200/60 rounded-xl p-4 leading-relaxed min-h-[80px] shadow-sm animate-in fade-in duration-205">
                {treino.descricao_exercicios || (
                  <span className="italic text-slate-400 font-medium">Nenhum exercício cadastrado para este dia.</span>
                )}
              </p>
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="absolute right-2 top-2 p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200 transition-all opacity-0 group-hover:opacity-100 shadow-sm"
                title="Editar treino"
              >
                <i className="bi bi-pencil-fill text-[9px]"></i>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function AgendaCalendar({ initialEvents, initialLembretes }: Props) {
  const [lembretes, setLembretes] = useState<Lembrete[]>(initialLembretes)
  const [modalOpen, setModalOpen] = useState(false)
  const [activeLembrete, setActiveLembrete] = useState<Partial<Lembrete> | null>(null)
  const [detailsModal, setDetailsModal] = useState<any | null>(null)

  interface StudentTab {
    id: number
    nome: string
    ficha: any | null
    loading: boolean
  }

  const [openTabs, setOpenTabs] = useState<StudentTab[]>([])
  const [activeTabId, setActiveTabId] = useState<number | null>(null)

  const handleOpenStudentTab = async (alunoId: number, alunoNome: string) => {
    const tabExists = openTabs.some(t => t.id === alunoId)
    if (!tabExists) {
      const newTab: StudentTab = {
        id: alunoId,
        nome: alunoNome,
        ficha: null,
        loading: true
      }
      setOpenTabs(prev => [...prev, newTab])
      setActiveTabId(alunoId)
      
      const data = await getFichaTreinoAtivaDoAluno(alunoId)
      
      setOpenTabs(prev => prev.map(t => t.id === alunoId ? { ...t, ficha: data, loading: false } : t))
    } else {
      setActiveTabId(alunoId)
    }
  }

  const handleCloseStudentTab = (alunoId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const updatedTabs = openTabs.filter(t => t.id !== alunoId)
    setOpenTabs(updatedTabs)
    if (activeTabId === alunoId) {
      if (updatedTabs.length > 0) {
        setActiveTabId(updatedTabs[updatedTabs.length - 1].id)
      } else {
        setActiveTabId(null)
      }
    }
  }

  const handleCloseDetails = () => {
    setDetailsModal(null)
    setOpenTabs([])
    setActiveTabId(null)
  }

  // Color mapping helpers
  const getGradient = (title: string) => {
    const t = title.toUpperCase()
    if (t.includes('BOXE')) return 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' // Blue
    if (t.includes('MUAY')) return 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)' // Red
    if (t.includes('JIU') || t.includes('BJJ')) return 'linear-gradient(135deg, #8b5cf6 0%, #5b21b6 100%)' // Purple
    if (t.includes('KICK')) return 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)' // Orange
    return 'linear-gradient(135deg, #10b981 0%, #047857 100%)' // Emerald for Personal/Others
  }

  const getBorderColor = (title: string) => {
    const t = title.toUpperCase()
    if (t.includes('BOXE')) return '#2563eb'
    if (t.includes('MUAY')) return '#dc2626'
    if (t.includes('JIU') || t.includes('BJJ')) return '#7c3aed'
    if (t.includes('KICK')) return '#ea580c'
    return '#059669'
  }

  const handleDateClick = (arg: any) => {
    setActiveLembrete({
      data: arg.dateStr,
      texto: '',
      cor: 'blue'
    })
    setModalOpen(true)
  }

  const handleEventClick = (arg: any) => {
    const { extendedProps, title, start } = arg.event
    if (extendedProps?.isLembrete) {
      setActiveLembrete({
        id: extendedProps.lembreteId,
        texto: extendedProps.texto,
        data: start.toISOString().substring(0, 10),
        cor: extendedProps.corLabel
      })
      setModalOpen(true)
    } else if (extendedProps?.isBloqueio) {
      // do nothing for blockages
    } else {
      const diasSemanaMap = [
        "Domingo",
        "Segunda-feira",
        "Terça-feira",
        "Quarta-feira",
        "Quinta-feira",
        "Sexta-feira",
        "Sábado"
      ]
      const eventDayOfWeek = start ? diasSemanaMap[start.getDay()] : ""

      // Show details modal for training/classes
      setDetailsModal({
        title,
        modalidade: extendedProps.modalidade || 'Treino',
        alunos: extendedProps.alunosList || [],
        isCustom: extendedProps.isCustom,
        telefone: extendedProps.telefone,
        startTime: extendedProps.startTime || '',
        endTime: extendedProps.endTime || '',
        eventDayOfWeek
      })
    }
  }

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    
    const res = await salvarLembrete(formData)
    if (res?.success) {
      setModalOpen(false)
      setActiveLembrete(null)
      // Hard refresh page to get updated server-state
      window.location.reload()
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente excluir esta anotação?')) return
    const formData = new FormData()
    formData.append('id', String(id))
    const res = await excluirLembrete(formData)
    if (res?.success) {
      setModalOpen(false)
      setActiveLembrete(null)
      window.location.reload()
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-4 bg-slate-50 min-h-screen">
      {/* Calendar Area */}
      <div className="flex-1 bg-white p-6 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          locale="pt-br"
          buttonText={{
            today: 'Hoje',
            month: 'Mês',
            week: 'Semana',
            day: 'Dia'
          }}
          allDaySlot={true}
          slotMinTime="06:00:00"
          slotMaxTime="23:00:00"
          events={initialEvents}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventContent={(arg) => {
            const { title, extendedProps } = arg.event
            const isMonthView = arg.view.type === 'dayGridMonth'
            
            // Lembretes Styling
            if (extendedProps?.isLembrete) {
              return (
                <div className="p-1 md:p-1.5 overflow-hidden rounded-lg flex items-center gap-1.5 h-full cursor-pointer hover:brightness-95 transition-all text-[9px] md:text-xs font-bold leading-tight shadow-sm border border-black/5">
                  <span>📌</span>
                  <span className="truncate">{title.replace('📝 ', '')}</span>
                </div>
              )
            }

            // Horário Livre Styling
            if (extendedProps?.isBloqueio) {
              return (
                <div className="p-1 md:p-1.5 overflow-hidden rounded-xl flex flex-col justify-center items-center h-full border border-dashed border-slate-300 bg-slate-50 text-[9px] font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                  <span className="uppercase tracking-wider">🔓 Vaga Livre</span>
                </div>
              )
            }

            // Training Classes Styling
            const isLivre = title.includes('(Livre)') || title.includes('(A Combinar)') || extendedProps.startTime === 'Livre'

            // Month View: Compact badges with no student list
            if (isMonthView) {
              const displayTitle = title.split(' (')[0]
              return (
                <div 
                  className="px-1.5 py-0.5 overflow-hidden flex items-center justify-between w-full cursor-pointer hover:brightness-95 transition-all rounded-lg border text-white text-[9px] font-extrabold shadow-sm"
                  style={{ 
                    background: isLivre ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : getGradient(title),
                    borderColor: isLivre ? '#0284c7' : getBorderColor(title)
                  }}
                  title={title}
                >
                  <span className="truncate">{displayTitle}</span>
                  {extendedProps?.alunosList && extendedProps.alunosList.length > 0 && (
                    <span className="ml-1 px-1 bg-white/20 rounded-md shrink-0 text-[8px]">
                      {extendedProps.alunosList.length}
                    </span>
                  )}
                </div>
              )
            }

            // Week & Day View: Spacious layout
            const displayTitle = title.split(' (')[0]
            return (
              <div 
                className="p-1.5 md:p-2 overflow-hidden flex flex-col h-full cursor-pointer hover:scale-[1.01] transition-transform rounded-xl border text-white shadow-md"
                style={{ 
                  background: isLivre ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : getGradient(title),
                  borderColor: isLivre ? '#0284c7' : getBorderColor(title)
                }}
              >
                <div className="font-extrabold text-[10px] md:text-xs uppercase tracking-wide leading-tight truncate shrink-0">
                  {displayTitle}
                </div>

                {extendedProps?.alunosList && extendedProps.alunosList.length > 0 && !extendedProps.isCustom && (
                  <div className="mt-1 flex-1 overflow-hidden flex flex-col gap-0.5">
                    <div className="text-[8px] font-bold uppercase tracking-wider opacity-75 border-b border-white/20 pb-0.5 mb-0.5 shrink-0">
                      Alunos ({extendedProps.alunosList.length}):
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-[40px] overflow-hidden">
                      {extendedProps.alunosList.map((aluno: any, i: number) => (
                        <span key={i} className="text-[8px] font-bold bg-white/20 px-1 py-0.5 rounded-md truncate max-w-[75px]">
                          {aluno.nome.split(' ')[0]}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {extendedProps?.isCustom && (
                  <div className="mt-1 flex-1 overflow-hidden flex flex-col gap-0.5">
                    <div className="text-[8px] font-bold uppercase tracking-wider opacity-75 border-b border-white/20 pb-0.5 mb-0.5 shrink-0">
                      Horário Livre:
                    </div>
                    <div className="text-[8px] font-bold bg-white/20 px-1 py-0.5 rounded-md truncate">
                      {title.split(') - ')[1] || 'Livre'}
                    </div>
                  </div>
                )}
              </div>
            )
          }}
          height="auto"
        />
      </div>

      {/* Sidebar Lembretes */}
      <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6">
        {/* Nova Anotação Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-3xl text-white shadow-xl shadow-blue-500/10">
          <h2 className="text-xl font-bold mb-2 flex items-center gap-2">
            <i className="bi bi-pin-angle"></i> Anotações Rápidas
          </h2>
          <p className="text-blue-100 text-xs mb-5">Adicione avisos ou eventos importantes para visualizar diretamente no calendário.</p>
          <button 
            onClick={() => {
              setActiveLembrete({ data: new Date().toISOString().substring(0, 10), texto: '', cor: 'blue' })
              setModalOpen(true)
            }}
            className="w-full py-3 bg-white hover:bg-slate-100 text-blue-700 font-bold text-sm rounded-2xl transition-all shadow-md active:scale-95"
          >
            + Nova Anotação
          </button>
        </div>

        {/* Lista de Lembretes */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl shadow-slate-100/50 flex-1 flex flex-col">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
            <i className="bi bi-clock-history"></i> Próximos Avisos
          </h3>
          
          <div className="flex flex-col gap-3 overflow-y-auto max-h-[500px] pr-1">
            {lembretes.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <i className="bi bi-info-circle text-lg block mb-2"></i>
                Nenhum aviso agendado.
              </div>
            ) : (
              lembretes.map((l) => {
                const c = l.cor === 'rose' ? 'bg-rose-50 border-rose-200 text-rose-800' : l.cor === 'emerald' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : l.cor === 'amber' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-blue-50 border-blue-200 text-blue-800'
                const [ano, mes, dia] = l.data.split('-')
                
                const hojeLocal = new Date()
                const hojeYMD = `${hojeLocal.getFullYear()}-${String(hojeLocal.getMonth() + 1).padStart(2, '0')}-${String(hojeLocal.getDate()).padStart(2, '0')}`
                const isHoje = l.data === hojeYMD
                
                return (
                  <div 
                    key={l.id} 
                    onClick={() => {
                      setActiveLembrete(l)
                      setModalOpen(true)
                    }}
                    className={`p-3.5 rounded-2xl border ${c} cursor-pointer hover:scale-[1.02] transition-transform shadow-sm relative group`}
                  >
                    <div className="text-[10px] font-bold opacity-75 uppercase tracking-wider flex items-center justify-between">
                      <span>📅 {dia}/{mes}/{ano}</span>
                      {isHoje && (
                        <span className="text-red-500 animate-pulse flex items-center gap-0.5 font-extrabold">
                          <i className="bi bi-bell-fill text-[10px]"></i>
                          Hoje
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold mt-1 leading-snug break-words pr-4">{l.texto}</p>
                    <i className="bi bi-pencil-square absolute right-3 top-3 text-xs opacity-0 group-hover:opacity-60 transition-opacity"></i>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Modal Nova/Editar Anotação */}
      {modalOpen && activeLembrete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                📌 {activeLembrete.id ? 'Editar Anotação' : 'Nova Anotação'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-xl"><i className="bi bi-x"></i></button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col gap-4">
              {activeLembrete.id && <input type="hidden" name="id" value={activeLembrete.id} />}
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Data</label>
                <input 
                  type="date" 
                  name="data" 
                  required
                  defaultValue={activeLembrete.data} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Texto do Aviso</label>
                <textarea 
                  name="texto" 
                  required
                  rows={3}
                  placeholder="Ex: Anunciar campeonato de boxe"
                  defaultValue={activeLembrete.texto} 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Etiqueta de Cor</label>
                <div className="flex gap-3">
                  {['blue', 'rose', 'emerald', 'amber'].map((c) => {
                    const labelBg = c === 'blue' ? 'bg-blue-500' : c === 'rose' ? 'bg-rose-500' : c === 'emerald' ? 'bg-emerald-500' : 'bg-amber-500'
                    return (
                      <label key={c} className="flex items-center cursor-pointer">
                        <input 
                          type="radio" 
                          name="cor" 
                          value={c} 
                          defaultChecked={activeLembrete.cor === c}
                          className="sr-only peer"
                        />
                        <span className={`w-8 h-8 rounded-full ${labelBg} border-2 border-transparent peer-checked:border-slate-800 peer-checked:scale-110 transition-all flex items-center justify-center`}>
                          {activeLembrete.cor === c && <i className="bi bi-check text-white font-bold"></i>}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              <div className="flex gap-2.5 mt-4">
                {activeLembrete.id && (
                  <button 
                    type="button" 
                    onClick={() => handleDelete(activeLembrete.id!)}
                    className="flex-1 py-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 font-bold rounded-2xl transition-colors text-sm"
                  >
                    Excluir
                  </button>
                )}
                <button 
                  type="submit" 
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-colors text-sm shadow-md shadow-blue-600/10"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Details Modal */}
      {detailsModal && (() => {
        const hasTabs = openTabs.length > 0;
        const activeTab = openTabs.find(t => t.id === activeTabId);
        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className={`bg-white rounded-3xl w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col overflow-hidden transition-all ${
              hasTabs ? 'max-w-5xl h-[85vh]' : 'max-w-md max-h-[90vh]'
            }`}>
              {hasTabs ? (
                <div className="flex-1 flex overflow-hidden">
                  {/* Left Column */}
                  <div className="w-1/3 border-r border-slate-200 flex flex-col p-6 overflow-y-auto">
                    <div className="flex justify-between items-center mb-5 shrink-0">
                      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        🥊 Detalhes do Treino
                      </h3>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      <div>
                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Modalidade</span>
                        <span className="text-base font-extrabold text-blue-600 uppercase mt-0.5 block">{detailsModal.modalidade}</span>
                      </div>

                      {detailsModal.startTime && (
                        <div>
                          <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Horário</span>
                          <span className="text-base font-extrabold text-blue-600 uppercase mt-0.5 block">
                            {detailsModal.startTime}{detailsModal.endTime ? ` às ${detailsModal.endTime}` : ''}
                          </span>
                        </div>
                      )}

                      {detailsModal.isCustom && detailsModal.telefone && (
                        <div>
                          <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Contato do Aluno</span>
                          <a 
                            href={`https://wa.me/55${detailsModal.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${detailsModal.title.split(' - ')[1] || 'aluno(a)'}, passando para lembrar que você tem treino de ${detailsModal.modalidade} hoje às ${detailsModal.startTime}! Nos vemos lá! 💪`)}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-sm font-bold text-emerald-600 flex items-center gap-1.5 mt-1 hover:underline"
                          >
                            <i className="bi bi-whatsapp"></i> {detailsModal.telefone}
                          </a>
                        </div>
                      )}

                      <div className="flex-1">
                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Alunos Matriculados ({detailsModal.alunos.length})</span>
                        {detailsModal.alunos.length === 0 ? (
                          <p className="text-xs text-slate-500 italic">Nenhum aluno cadastrado.</p>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {(detailsModal.alunos as any[]).map((a: any, i: number) => {
                              const isTabOpen = openTabs.some(t => t.id === a.id);
                              const isActive = activeTabId === a.id;
                              return (
                                <div key={i} className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                                  isActive ? 'bg-blue-50 border-blue-200' : isTabOpen ? 'bg-slate-50 border-slate-200' : 'bg-white border-slate-100 hover:border-slate-200'
                                }`}>
                                  <button 
                                    type="button" 
                                    onClick={() => {
                                      if (a.id) handleOpenStudentTab(a.id, a.nome);
                                    }}
                                    className="text-left font-bold text-xs text-slate-800 hover:text-blue-600 transition-colors truncate flex-1 mr-1"
                                  >
                                    {a.nome}
                                  </button>
                                  
                                  <div className="flex items-center gap-1">
                                    {a.telefone && (
                                      <a 
                                        href={`https://wa.me/55${a.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${a.nome.split(' ')[0]}, passando para lembrar que você tem treino de ${detailsModal.modalidade} hoje às ${detailsModal.startTime}! Nos vemos lá! 💪`)}`} 
                                        target="_blank" 
                                        rel="noreferrer" 
                                        className="w-6 h-6 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-150 hover:bg-emerald-100 transition-colors"
                                        title="Enviar lembrete por WhatsApp"
                                      >
                                        <i className="bi bi-whatsapp text-[10px]"></i>
                                      </a>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-100">
                      <button 
                        onClick={handleCloseDetails}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors text-xs"
                      >
                        Fechar
                      </button>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="w-2/3 flex flex-col bg-slate-50 overflow-hidden">
                    {/* Chrome Tabs */}
                    <div className="flex bg-slate-100 border-b border-slate-200 overflow-x-auto shrink-0 select-none px-3 pt-2">
                      {openTabs.map((tab) => {
                        const isActive = activeTabId === tab.id
                        return (
                          <div
                            key={tab.id}
                            onClick={() => setActiveTabId(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-t-xl cursor-pointer transition-all border-t border-x ${
                              isActive 
                                ? 'bg-white border-slate-200 text-blue-600 shadow-[0_-2px_4px_rgba(0,0,0,0.02)]' 
                                : 'bg-transparent border-transparent text-slate-500 hover:bg-slate-200/50'
                            }`}
                          >
                            <span className="truncate max-w-[120px]">{tab.nome.split(' ')[0]}</span>
                            <button 
                              onClick={(e) => handleCloseStudentTab(tab.id, e)} 
                              className="text-slate-400 hover:text-slate-655 p-0.5 rounded-full hover:bg-slate-200 flex items-center justify-center"
                            >
                              <i className="bi bi-x text-xs leading-none"></i>
                            </button>
                          </div>
                        )
                      })}
                    </div>

                    {/* Tab content */}
                    {activeTab ? (
                      activeTab.loading ? (
                        <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400">
                          <i className="bi bi-arrow-repeat animate-spin text-blue-500 text-xl"></i>
                          <span className="font-semibold text-xs">Carregando treinos...</span>
                        </div>
                      ) : activeTab.ficha ? (
                        <div className="flex-1 overflow-y-auto p-6 space-y-4">
                          <div className="font-extrabold text-sm text-blue-600 border-b border-slate-100 pb-2 flex justify-between items-center">
                            <span>🎯 {activeTab.ficha.objetivo_ficha || 'Treino'}</span>
                            {activeTab.ficha.data_criacao && (
                              <span className="text-xs text-slate-400 font-normal">Criado em: {new Date(activeTab.ficha.data_criacao).toLocaleDateString('pt-BR')}</span>
                            )}
                          </div>
                          
                          {activeTab.ficha.treinos_dia && activeTab.ficha.treinos_dia.length > 0 ? (
                            <div className="space-y-3">
                              {activeTab.ficha.treinos_dia.map((t: any) => (
                                <AlunoTreinoItem 
                                  key={t.id} 
                                  treino={t} 
                                  eventDayOfWeek={detailsModal.eventDayOfWeek} 
                                  onUpdate={(updatedTreino) => {
                                    setOpenTabs(prev => prev.map(tab => {
                                      if (tab.id === activeTab.id) {
                                        return {
                                          ...tab,
                                          ficha: {
                                            ...tab.ficha,
                                            treinos_dia: tab.ficha.treinos_dia.map((td: any) => 
                                              td.id === updatedTreino.id ? updatedTreino : td
                                            )
                                          }
                                        }
                                      }
                                      return tab
                                    }))
                                  }}
                                />
                              ))}
                            </div>
                          ) : (
                            <p className="text-slate-500 italic text-xs">Nenhum treino cadastrado na ficha ativa.</p>
                          )}
                        </div>
                      ) : (
                        <div className="flex-1 p-6 text-center text-slate-400 italic text-xs flex items-center justify-center">
                          Nenhuma ficha de treino ativa encontrada para este aluno.
                        </div>
                      )
                    ) : (
                      <div className="flex-1 p-6 text-center text-slate-400 italic text-xs flex items-center justify-center">
                        Selecione um aluno na lista à esquerda para ver seus treinos.
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-6 overflow-y-auto">
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      🥊 Detalhes do Treino
                    </h3>
                    <button onClick={handleCloseDetails} className="text-slate-400 hover:text-slate-600 text-xl"><i className="bi bi-x"></i></button>
                  </div>

                  <div className="flex flex-col gap-4">
                    <div>
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Modalidade</span>
                      <span className="text-base font-extrabold text-blue-600 uppercase mt-0.5 block">{detailsModal.modalidade}</span>
                    </div>

                    {detailsModal.startTime && (
                      <div>
                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Horário</span>
                        <span className="text-base font-extrabold text-blue-600 uppercase mt-0.5 block">
                          {detailsModal.startTime}{detailsModal.endTime ? ` às ${detailsModal.endTime}` : ''}
                        </span>
                      </div>
                    )}

                    {detailsModal.isCustom && detailsModal.telefone && (
                      <div>
                        <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Contato do Aluno</span>
                        <a 
                          href={`https://wa.me/55${detailsModal.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${detailsModal.title.split(' - ')[1] || 'aluno(a)'}, passando para lembrar que você tem treino de ${detailsModal.modalidade} hoje às ${detailsModal.startTime}! Nos vemos lá! 💪`)}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-sm font-bold text-emerald-600 flex items-center gap-1.5 mt-1 hover:underline"
                        >
                          <i className="bi bi-whatsapp"></i> {detailsModal.telefone}
                        </a>
                      </div>
                    )}

                    <div>
                      <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Alunos Matriculados ({detailsModal.alunos.length})</span>
                      {detailsModal.alunos.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">Nenhum aluno cadastrado para este horário.</p>
                      ) : (
                        <div className="flex flex-col gap-2 max-h-72 overflow-y-auto pr-1">
                          {(detailsModal.alunos as any[]).map((a: any, i: number) => {
                            return (
                              <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200/60">
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    if (a.id) handleOpenStudentTab(a.id, a.nome);
                                  }}
                                  className="text-left font-extrabold text-xs text-slate-800 hover:text-blue-600 transition-colors flex-1 truncate mr-1"
                                >
                                  <i className="bi bi-chevron-right text-slate-400 text-[10px] mr-1"></i>
                                  {a.nome}
                                </button>
                                
                                {a.telefone && (
                                  <a 
                                    href={`https://wa.me/55${a.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${a.nome.split(' ')[0]}, passando para lembrar que você tem treino de ${detailsModal.modalidade} hoje às ${detailsModal.startTime}! Nos vemos lá! 💪`)}`} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="w-6 h-6 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-250 hover:bg-emerald-100 transition-colors"
                                    title="Enviar lembrete por WhatsApp"
                                  >
                                    <i className="bi bi-whatsapp text-[10px]"></i>
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={handleCloseDetails}
                      className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors text-sm mt-2"
                    >
                      Fechar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <style jsx global>{`
        .fc {
          font-family: inherit;
          --fc-border-color: #f1f5f9;
          --fc-button-bg-color: #ffffff;
          --fc-button-border-color: #e2e8f0;
          --fc-button-text-color: #475569;
          --fc-button-hover-bg-color: #f8fafc;
          --fc-button-hover-border-color: #cbd5e1;
          --fc-button-active-bg-color: #eff6ff;
          --fc-button-active-border-color: #2563eb;
          --fc-today-bg-color: #f0fdf4;
        }
        .fc-theme-standard td, .fc-theme-standard th {
          border-color: var(--fc-border-color);
        }
        .fc-col-header-cell-cushion {
          color: #1e293b;
          font-weight: 800;
          text-transform: uppercase;
          font-size: 0.75rem;
          padding: 10px 4px !important;
          text-decoration: none !important;
          letter-spacing: 0.05em;
        }
        .fc-timegrid-slot-label-cushion {
          color: #64748b;
          font-weight: 700;
          font-size: 0.75rem;
        }
        .fc-event {
          border-radius: 12px;
          border: none;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03);
          overflow: hidden;
        }
        .fc-button {
          font-weight: 700 !important;
          text-transform: uppercase !important;
          font-size: 0.7rem !important;
          letter-spacing: 0.05em !important;
          border-radius: 12px !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05) !important;
          padding: 8px 14px !important;
          transition: all 0.2s ease !important;
        }
        .fc-button-primary:not(:disabled).fc-button-active, .fc-button-primary:not(:disabled):active {
          background-color: #2563eb !important;
          border-color: #2563eb !important;
          color: #ffffff !important;
          box-shadow: inset 0 2px 4px rgba(0,0,0,0.05) !important;
        }
        .fc-button-primary {
          color: var(--fc-button-text-color) !important;
          background-color: var(--fc-button-bg-color) !important;
          border-color: var(--fc-button-border-color) !important;
        }
        .fc-button-primary:hover {
          background-color: var(--fc-button-hover-bg-color) !important;
          border-color: var(--fc-button-hover-border-color) !important;
          color: #0f172a !important;
        }
        .fc .fc-toolbar-title {
          font-size: 1.5rem;
          font-weight: 900;
          color: #1e293b;
          letter-spacing: -0.025em;
          text-transform: capitalize;
        }
        .fc-timegrid-now-indicator-line {
          border-color: #ef4444;
          border-width: 2px;
        }
        .fc-timegrid-now-indicator-arrow {
          border-color: #ef4444;
          border-width: 6px;
        }
        .fc-event-main {
          height: 100%;
        }
      `}</style>
    </div>
  )
}
