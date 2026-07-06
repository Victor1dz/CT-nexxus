"use client"

import { useState } from 'react'
import Link from 'next/link'
import { salvarHorario } from '@/app/actions'
import { SubmitButton } from '@/components/SubmitButton'

interface Props {
  horario: any
  modalidades: any[]
}

export default function HorariosFormClient({ horario, modalidades }: Props) {
  const horarioId = horario?.id || null

  const getHStr = (d: any) => {
    if (!d) return ''
    if (d.includes('T')) {
      return d.substring(11, 16)
    }
    return d
  }

  const [dias, setDias] = useState<string[]>(() => {
    if (horario?.dias_semana) {
      return horario.dias_semana.split(', ').map((s: string) => s.trim())
    }
    return []
  })

  const [semHorariosFixos, setSemHorariosFixos] = useState(() => {
    if (horarioId && !horario.hora_inicio && !horario.hora_fim) {
      return true
    }
    return false
  })

  const [horaInicio, setHoraInicio] = useState(() => getHStr(horario?.hora_inicio))
  const [horaFim, setHoraFim] = useState(() => getHStr(horario?.hora_fim))

  const handleDayToggle = (dia: string) => {
    if (dias.includes(dia)) {
      setDias(dias.filter(d => d !== dia))
    } else {
      setDias([...dias, dia])
    }
  }

  return (
    <div className="w-full text-slate-800 font-sans max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#2c3e50] mb-2 flex items-center gap-2">
          <i className="bi bi-clock text-blue-600"></i> {horarioId ? 'Editar Horário' : 'Cadastro de Horário'}
        </h1>
        <p className="text-slate-500">
          Determine a modalidade, dias da semana e a janela de tempo.
        </p>
      </div>

      <form 
        action={async (formData) => {
          // Adiciona os dias selecionados
          dias.forEach(d => {
            formData.append('dias_semana', d)
          })
          if (semHorariosFixos) {
            formData.set('hora_inicio', '')
            formData.set('hora_fim', '')
          } else {
            formData.set('hora_inicio', horaInicio)
            formData.set('hora_fim', horaFim)
          }
          await salvarHorario(formData)
          window.location.href = '/horarios'
        }} 
        className="bg-white border border-slate-200 rounded-3xl shadow-xl shadow-slate-100/50 overflow-hidden"
      >
        {horarioId && <input type="hidden" name="id" value={horarioId} />}
        
        <div className="p-6 md:p-8 space-y-6">
          <div>
            <label className="block text-xs font-extrabold text-slate-650 uppercase tracking-wider mb-2">Modalidade (Opcional - Deixe vazio para usar como Bloqueio)</label>
            <select name="modalidade_id" defaultValue={horario?.modalidade_id?.toString() || ''} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2980b9] focus:outline-none text-sm font-semibold shadow-inner">
              <option value="">-- Apenas Bloqueio de Horário --</option>
              {modalidades.map((m: any) => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-650 uppercase tracking-wider mb-3">Dias da Semana</label>
            <div className="flex flex-wrap gap-2">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => {
                const isSelected = dias.includes(dia)
                return (
                  <button
                    key={dia}
                    type="button"
                    onClick={() => handleDayToggle(dia)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm scale-105' 
                        : 'bg-white hover:bg-slate-50 text-slate-650 border-slate-200'
                    }`}
                  >
                    {dia.toUpperCase()}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-slate-650 uppercase tracking-wider mb-2">Tipo de Horário</label>
            <div className="flex items-center h-12">
              <label className="flex items-center gap-3 cursor-pointer bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-100/60 transition-colors w-full">
                <input 
                  type="checkbox" 
                  checked={semHorariosFixos}
                  onChange={(e) => setSemHorariosFixos(e.target.checked)}
                  className="w-5 h-5 rounded text-[#2980b9] focus:ring-[#2980b9] border-slate-350 cursor-pointer" 
                />
                <span className="font-semibold text-slate-700 text-sm">Sem horários fixos (Livre / A Combinar)</span>
              </label>
            </div>
          </div>

          {!semHorariosFixos && (
            <div className="grid grid-cols-2 gap-6 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-extrabold text-slate-650 uppercase tracking-wider mb-2">Hora Inicial</label>
                <input 
                  type="time" 
                  value={horaInicio} 
                  onChange={e => setHoraInicio(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2980b9] focus:outline-none text-sm font-semibold shadow-inner" 
                  required={!semHorariosFixos} 
                />
              </div>
              <div>
                <label className="block text-xs font-extrabold text-slate-650 uppercase tracking-wider mb-2">Hora Final</label>
                <input 
                  type="time" 
                  value={horaFim} 
                  onChange={e => setHoraFim(e.target.value)} 
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#2980b9] focus:outline-none text-sm font-semibold shadow-inner" 
                  required={!semHorariosFixos} 
                />
              </div>
            </div>
          )}
          
          <div>
            <label className="flex items-center gap-3 cursor-pointer bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl hover:bg-slate-100/60 transition-colors w-fit select-none">
              <input type="checkbox" name="ativo" defaultChecked={horario ? horario.ativo : true} className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-350" />
              <span className="font-semibold text-slate-700 text-sm">Horário Ativo</span>
            </label>
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-100 p-6 flex justify-end gap-3">
          <Link href="/horarios" className="px-6 py-3 bg-white border border-slate-250 text-slate-700 font-extrabold rounded-xl shadow-sm hover:bg-slate-100 transition-colors text-sm">
            Cancelar
          </Link>
          <SubmitButton text="Salvar Horário" className="px-8 py-3 bg-gradient-to-r from-blue-600 to-[#2980b9] hover:from-blue-700 hover:to-[#2471a3] text-white font-extrabold rounded-xl shadow-md transition-all hover:-translate-y-0.5 active:scale-95 text-sm" />
        </div>
      </form>
    </div>
  )
}
