"use client"

import { useState } from 'react'
import Link from 'next/link'
import { salvarModalidade } from '@/app/actions'
import { SubmitButton } from '@/components/SubmitButton'

interface HorarioItem {
  id?: number | null
  dias: string[]
  hora_inicio: string
  hora_fim: string
}

interface Props {
  modalidade: any
  initialHorarios: any[]
}

export default function ModalidadesFormClient({ modalidade, initialHorarios }: Props) {
  const modalidadeId = modalidade?.id || null

  // Pre-process initial horarios to ensure clean fields
  const getHStr = (d: any) => {
    if (!d) return '08:00'
    if (d.includes('T')) {
      return d.substring(11, 16)
    }
    return d
  }

  const [horarios, setHorarios] = useState<HorarioItem[]>(() => {
    if (initialHorarios && initialHorarios.length > 0) {
      return initialHorarios.map((h: any) => {
        const dias = h.dias_semana ? h.dias_semana.split(', ').map((s: string) => s.trim()) : []
        return {
          id: h.id || null,
          dias,
          hora_inicio: getHStr(h.hora_inicio),
          hora_fim: getHStr(h.hora_fim)
        }
      })
    }
    return []
  })

  const [nome, setNome] = useState(modalidade?.nome || '')
  const [descricao, setDescricao] = useState(modalidade?.descricao || '')
  const [exigeHorario, setExigeHorario] = useState(modalidade?.exige_horario || false)

  const handleNomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setNome(val)
    // Mirror Nome to Descricao automatically if description is empty or matches previous name
    if (descricao === "" || descricao === nome || descricao === val.slice(0, -1)) {
      setDescricao(val)
    }
  }

  const handleAddHorario = () => {
    setHorarios([...horarios, { id: null, dias: ['Seg', 'Qua', 'Sex'], hora_inicio: '08:00', hora_fim: '09:00' }])
  }

  const handleRemoveHorario = (index: number) => {
    setHorarios(horarios.filter((_, i) => i !== index))
  }

  const handleDayToggle = (index: number, dia: string) => {
    const updated = [...horarios]
    const currentDias = updated[index].dias || []
    if (currentDias.includes(dia)) {
      updated[index].dias = currentDias.filter((d: string) => d !== dia)
    } else {
      updated[index].dias = [...currentDias, dia]
    }
    setHorarios(updated)
  }

  const handleTimeChange = (index: number, field: 'hora_inicio' | 'hora_fim', value: string) => {
    const updated = [...horarios]
    updated[index][field] = value
    setHorarios(updated)
  }

  return (
    <div className="w-full text-slate-800 font-sans max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#2c3e50] mb-2 flex items-center gap-2">
          <i className="bi bi-tag text-blue-600"></i> {modalidadeId ? 'Editar Modalidade' : 'Nova Modalidade'}
        </h1>
        <p className="text-slate-500">
          Gerencie o nome, descrição, preços e os horários padrão desta modalidade de treino.
        </p>
      </div>

      <form 
        action={async (formData) => {
          // Put the schedules JSON in a hidden field before submit
          formData.append('horarios_json', JSON.stringify(horarios))
          await salvarModalidade(formData)
          window.location.href = '/modalidades'
        }} 
        className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-100/50 overflow-hidden"
      >
        {modalidadeId && <input type="hidden" name="id" value={modalidadeId} />}

        <div className="p-6 md:p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-extrabold text-slate-650 uppercase tracking-wider mb-2">Nome da Modalidade</label>
              <input 
                type="text" 
                name="nome" 
                value={nome}
                onChange={handleNomeChange}
                placeholder="ex: Musculação, Muay Thai" 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2980b9] focus:border-[#2980b9] focus:outline-none transition-all font-medium text-sm shadow-inner" 
                required 
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold text-slate-650 uppercase tracking-wider mb-2">Horário "A Combinar" / Livre</label>
              <div className="flex items-center h-12">
                <label className="flex items-center gap-3 cursor-pointer bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-100/60 transition-colors w-full">
                  <input 
                    type="checkbox" 
                    name="exige_horario" 
                    checked={exigeHorario}
                    onChange={(e) => setExigeHorario(e.target.checked)}
                    className="w-5 h-5 rounded text-[#2980b9] focus:ring-[#2980b9] border-slate-350 cursor-pointer" 
                  />
                  <span className="font-semibold text-slate-700 text-sm">Sem horários fixos (Livre)</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-650 uppercase tracking-wider mb-2">Descrição (Opcional)</label>
            <textarea 
              name="descricao" 
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3} 
              placeholder="Breve descrição da modalidade para exibição" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2980b9] focus:border-[#2980b9] focus:outline-none transition-all font-medium text-sm shadow-inner"
            />
          </div>

          <div className="flex gap-4 border-t border-slate-100 pt-6">
            <label className="flex items-center gap-3 cursor-pointer bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-100/60 transition-colors">
              <input type="checkbox" name="ativa" defaultChecked={modalidade ? modalidade.ativa : true} className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-350" />
              <span className="font-semibold text-slate-700 text-sm">Modalidade Ativa</span>
            </label>
          </div>

          {/* Horarios Section */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <i className="bi bi-clock-history text-[#2980b9]"></i> Grade de Horários Padrão
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Cadastre os horários fixos oferecidos para esta modalidade.</p>
              </div>
              
              {!exigeHorario && (
                <button 
                  type="button" 
                  onClick={handleAddHorario} 
                  className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-[#2980b9] font-bold rounded-xl transition-colors flex items-center gap-1.5 text-xs border border-blue-100/50 shadow-sm"
                >
                  <i className="bi bi-plus-lg"></i> Adicionar Horário
                </button>
              )}
            </div>

            {exigeHorario ? (
              <div className="bg-amber-50/50 border border-dashed border-amber-200 text-amber-800 rounded-2xl p-5 text-sm flex gap-3 items-start leading-relaxed animate-in fade-in duration-200">
                <i className="bi bi-exclamation-triangle text-lg text-amber-600 shrink-0"></i>
                <div>
                  <span className="font-bold">Modalidade com Horário Livre ("A Combinar"):</span> Como a opção "Livre / A Combinar" está ativa, não é necessário cadastrar horários fixos de turmas. Os treinos serão agendados livremente de acordo com a disponibilidade de vagas gerais do CT.
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {horarios.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 text-slate-400 text-sm">
                    <i className="bi bi-calendar-x text-3xl block mb-2 text-slate-300"></i>
                    Nenhum horário cadastrado. Os alunos não poderão escolher turmas fixas para esta modalidade.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-slate-50/30 overflow-hidden shadow-inner">
                    {horarios.map((h, index) => (
                      <div key={index} className="p-5 flex flex-col md:flex-row gap-5 items-start md:items-center justify-between hover:bg-slate-50/40 transition-colors">
                        {h.id && <input type="hidden" name={`horario_id_${index}`} value={h.id} />}
                        
                        {/* Day Badges Container */}
                        <div className="flex-1 space-y-1">
                          <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Dias da Semana</label>
                          <div className="flex flex-wrap gap-1.5">
                            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => {
                              const isSelected = h.dias.includes(dia)
                              return (
                                <button
                                  key={dia}
                                  type="button"
                                  onClick={() => handleDayToggle(index, dia)}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all select-none ${
                                    isSelected 
                                      ? 'bg-blue-600 border-blue-600 text-white shadow-sm scale-105' 
                                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300'
                                  }`}
                                >
                                  {dia}
                                </button>
                              )
                            })}
                          </div>
                        </div>

                        {/* Times Container */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Início</label>
                            <input 
                              type="time" 
                              value={h.hora_inicio} 
                              onChange={(e) => handleTimeChange(index, 'hora_inicio', e.target.value)}
                              className="px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2980b9] focus:outline-none text-xs font-bold text-slate-700 shadow-sm"
                              required 
                            />
                          </div>
                          <span className="text-slate-400 text-xs font-semibold mt-4">às</span>
                          <div>
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-1">Fim</label>
                            <input 
                              type="time" 
                              value={h.hora_fim} 
                              onChange={(e) => handleTimeChange(index, 'hora_fim', e.target.value)}
                              className="px-3 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2980b9] focus:outline-none text-xs font-bold text-slate-700 shadow-sm"
                              required 
                            />
                          </div>

                          <button 
                            type="button" 
                            onClick={() => handleRemoveHorario(index)} 
                            className="p-2 text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 rounded-xl transition-all border border-rose-100/50 mt-4"
                            title="Remover horário"
                          >
                            <i className="bi bi-trash text-sm"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-100 p-6 flex justify-end gap-3">
          <Link href="/modalidades" className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-extrabold rounded-xl shadow-sm hover:bg-slate-100 transition-colors text-sm">
            Cancelar
          </Link>
          <SubmitButton 
            text="Salvar Modalidade" 
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-[#2980b9] hover:from-blue-700 hover:to-[#2471a3] text-white font-extrabold rounded-xl shadow-md transition-all hover:-translate-y-0.5 active:scale-95 text-sm" 
          />
        </div>
      </form>
    </div>
  )
}
