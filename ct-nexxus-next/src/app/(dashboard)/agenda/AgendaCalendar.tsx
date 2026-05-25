"use client"

import { useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { salvarLembrete, excluirLembrete } from '@/app/actions'

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

export function AgendaCalendar({ initialEvents, initialLembretes }: Props) {
  const [lembretes, setLembretes] = useState<Lembrete[]>(initialLembretes)
  const [modalOpen, setModalOpen] = useState(false)
  const [activeLembrete, setActiveLembrete] = useState<Partial<Lembrete> | null>(null)
  const [detailsModal, setDetailsModal] = useState<any | null>(null)

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
      // Show details modal for training/classes
      setDetailsModal({
        title,
        modalidade: extendedProps.modalidade || 'Treino',
        alunos: extendedProps.alunosList || [],
        isCustom: extendedProps.isCustom,
        telefone: extendedProps.telefone,
        startTime: extendedProps.startTime || '',
        endTime: extendedProps.endTime || ''
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
            
            // Lembretes Styling
            if (extendedProps?.isLembrete) {
              return (
                <div className="p-2 overflow-hidden rounded-lg flex items-center gap-1.5 h-full cursor-pointer hover:brightness-95 transition-all text-xs font-bold leading-tight shadow-sm border border-black/5">
                  <span>📌</span>
                  <span className="truncate">{title.replace('📝 ', '')}</span>
                </div>
              )
            }

            // Horário Livre Styling
            if (extendedProps?.isBloqueio) {
              return (
                <div className="p-2 overflow-hidden rounded-xl flex flex-col justify-center items-center h-full border border-dashed border-slate-300 bg-slate-50 text-[10px] font-bold text-slate-500 hover:bg-slate-100 transition-colors">
                  <span className="uppercase tracking-wider">🔓 Vaga Livre</span>
                </div>
              )
            }

            // Training Classes Styling
            return (
              <div 
                className="p-3 overflow-hidden flex flex-col h-full cursor-pointer hover:scale-[1.01] transition-transform rounded-xl border text-white shadow-md"
                style={{ 
                  background: getGradient(title),
                  borderColor: getBorderColor(title)
                }}
              >
                <div className="font-extrabold text-sm uppercase tracking-wide leading-snug line-clamp-1">
                  {title.split(' (')[0]}
                </div>
                
                {extendedProps?.isCustom && extendedProps?.telefone && (
                  <div className="text-[10px] font-semibold opacity-90 mt-1 bg-white/20 px-2 py-0.5 rounded-full w-fit">
                    📱 {extendedProps.telefone}
                  </div>
                )}

                {extendedProps?.alunosList && extendedProps.alunosList.length > 0 && (
                  <div className="mt-2 flex-1 overflow-hidden flex flex-col gap-1">
                    <div className="text-[9px] font-bold uppercase tracking-wider opacity-75 border-b border-white/20 pb-0.5 mb-1">
                      Alunos ({extendedProps.alunosList.length}):
                    </div>
                    <div className="flex flex-wrap gap-1 max-h-[45px] overflow-hidden">
                      {extendedProps.alunosList.map((aluno: any, i: number) => (
                        <span key={i} className="text-[9px] font-bold bg-white/20 px-1.5 py-0.5 rounded-md truncate max-w-[80px]">
                          {aluno.nome.split(' ')[0]}
                        </span>
                      ))}
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
                
                return (
                  <div 
                    key={l.id} 
                    onClick={() => {
                      setActiveLembrete(l)
                      setModalOpen(true)
                    }}
                    className={`p-3.5 rounded-2xl border ${c} cursor-pointer hover:scale-[1.02] transition-transform shadow-sm relative group`}
                  >
                    <div className="text-[10px] font-bold opacity-75 uppercase tracking-wider">
                      📅 {dia}/{mes}/{ano}
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
      {detailsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                🥊 Detalhes do Treino
              </h3>
              <button onClick={() => setDetailsModal(null)} className="text-slate-400 hover:text-slate-600 text-xl"><i className="bi bi-x"></i></button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Modalidade</span>
                <span className="text-base font-extrabold text-blue-600 uppercase mt-0.5 block">{detailsModal.modalidade}</span>
              </div>

              {/* Horário da Aula (Sincronizado com o calendário) */}
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
                  <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
                    {detailsModal.alunos.map((a: any, i: number) => (
                      <div key={i} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-2xl border border-slate-200/60">
                        <span className="text-sm font-bold text-slate-800">{a.nome}</span>
                        {a.telefone && (
                          <a 
                            href={`https://wa.me/55${a.telefone.replace(/\D/g, '')}?text=${encodeURIComponent(`Olá ${a.nome.split(' ')[0]}, passando para lembrar que você tem treino de ${detailsModal.modalidade} hoje às ${detailsModal.startTime}! Nos vemos lá! 💪`)}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                            title="Enviar lembrete por WhatsApp"
                          >
                            <i className="bi bi-whatsapp text-sm"></i>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button 
                onClick={() => setDetailsModal(null)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-colors text-sm mt-2"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

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
