"use client"

import { useState } from "react"
import { togglePresenca } from "@/app/actions"

export default function DiarioClient({ agrupados, mapaPresencas: initialMapa, dataAtual, diaTermo }: any) {
  const [mapaPresencas, setMapaPresencas] = useState(initialMapa)
  const isVazio = Object.keys(agrupados).length === 0

  const handleToggle = async (matriculaId: number, presente: boolean) => {
    // Optimistic update
    setMapaPresencas({ ...mapaPresencas, [matriculaId]: presente })
    const res = await togglePresenca(matriculaId, dataAtual, presente)
    if (!res.success) {
      // Revert on error
      setMapaPresencas({ ...mapaPresencas, [matriculaId]: !presente })
      alert("Erro ao salvar presença.")
    }
  }

  if (isVazio) {
    return (
      <div className="p-12 text-center mt-4 bg-white rounded-2xl shadow-sm border border-slate-200">
        <i className="bi bi-calendar-x text-6xl text-slate-300 mb-4 block"></i>
        <h5 className="text-xl text-slate-500 font-medium">Nenhum aluno com horário agendado para este dia.</h5>
        {!diaTermo && (
          <div className="text-amber-500 text-sm mt-3">
            (As datas inseridas precisam existir nos horários criados. Ex: Seg, Ter, Qua...)
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {Object.entries(agrupados).map(([modNome, alunos]: [string, any]) => (
        <div key={modNome} className="mb-8">
          <h5 className="text-xl font-bold text-blue-600 mb-4">{modNome}</h5>
          
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-sm">
                    <th className="py-4 px-6 font-semibold text-center w-32">Presença</th>
                    <th className="py-4 px-6 font-semibold">Horário</th>
                    <th className="py-4 px-6 font-semibold">Aluno</th>
                    <th className="py-4 px-6 text-right font-semibold">Opções</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {alunos.map((m: any) => {
                    const isPresente = mapaPresencas[m.id] === true
                    const isAusente = mapaPresencas[m.id] === false
                    
                    let horarioDisplay = "A Combinar"
                    if (m.horarios?.hora_inicio) {
                      horarioDisplay = m.horarios.hora_inicio
                    } else if (m.horario_personalizado) {
                      horarioDisplay = m.horario_personalizado.split('|')[1] || m.horario_personalizado
                    }

                    return (
                      <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6 text-center">
                          <div className="inline-flex rounded-lg shadow-sm" role="group">
                            <button 
                              onClick={() => handleToggle(m.id, true)}
                              className={`px-3 py-1.5 text-sm font-medium rounded-l-lg border ${isPresente ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-emerald-50'}`}
                            >
                              Presente
                            </button>
                            <button 
                              onClick={() => handleToggle(m.id, false)}
                              className={`px-3 py-1.5 text-sm font-medium rounded-r-lg border border-l-0 ${isAusente ? 'bg-rose-500 text-white border-rose-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-rose-50'}`}
                            >
                              Ausente
                            </button>
                          </div>
                        </td>
                        <td className="py-4 px-6 font-bold text-blue-600">
                          {horarioDisplay === "A Combinar" ? (
                            <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-medium border border-slate-200">{horarioDisplay}</span>
                          ) : horarioDisplay}
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold mr-3">
                              {m.alunos?.nome?.charAt(0) || '?'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-800">{m.alunos?.nome}</div>
                              <div className="text-sm text-slate-500">{m.alunos?.telefone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button className="px-3 py-1.5 text-xs font-bold rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors flex items-center gap-1">
                              <i className="bi bi-card-checklist"></i> Ficha
                            </button>
                            <button className="px-3 py-1.5 text-xs font-bold rounded-lg border border-indigo-200 text-indigo-600 hover:bg-indigo-50 transition-colors flex items-center gap-1">
                              <i className="bi bi-clock-history"></i> Histórico
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ))}
    </>
  )
}
