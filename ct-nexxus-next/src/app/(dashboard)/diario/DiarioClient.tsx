"use client"

import { useState } from "react"
import Link from "next/link"
import { togglePresenca, getHistoricoPresencaDoAluno } from "@/app/actions"

export default function DiarioClient({ agrupados, mapaPresencas: initialMapa, dataAtual, diaTermo }: any) {
  const [mapaPresencas, setMapaPresencas] = useState(initialMapa)
  const [frequenciaModal, setFrequenciaModal] = useState<{ id: number, nome: string } | null>(null)
  const [loadingHistorico, setLoadingHistorico] = useState(false)
  const [historico, setHistorico] = useState<any[]>([])

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

  const handleShowFrequencia = async (alunoId: number, alunoNome: string) => {
    setFrequenciaModal({ id: alunoId, nome: alunoNome })
    setLoadingHistorico(true)
    setHistorico([])
    try {
      const data = await getHistoricoPresencaDoAluno(alunoId)
      setHistorico(data)
    } catch (e) {
      console.error(e)
    } finally {
      setLoadingHistorico(false)
    }
  }

  const handleCloseFrequencia = () => {
    setFrequenciaModal(null)
    setHistorico([])
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
                              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                {mapaPresencas[m.id] === undefined && (
                                  <i className="bi bi-bell-fill text-amber-500 animate-pulse text-[11px]" title="Registro de presença pendente para hoje"></i>
                                )}
                                {m.alunos?.nome}
                              </div>
                              <div className="text-sm text-slate-500">{m.alunos?.telefone}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button 
                              onClick={() => handleShowFrequencia(m.alunos?.id, m.alunos?.nome)}
                              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors flex items-center gap-1 shadow-sm"
                            >
                              <i className="bi bi-clock-history"></i> Frequência
                            </button>
                            <Link href={`/alunos/${m.alunos?.id}/anamnese`} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-cyan-200 text-cyan-700 hover:bg-cyan-50 transition-colors flex items-center gap-1 shadow-sm">
                              <i className="bi bi-clipboard2-pulse"></i> Anamnese
                            </Link>
                            <Link href={`/alunos/editar/${m.alunos?.id}`} className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-1 shadow-sm">
                              <i className="bi bi-person"></i> Aluno
                            </Link>
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

      {/* Modal Histórico de Presença */}
      {frequenciaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center mb-5 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <i className="bi bi-clock-history text-blue-600"></i> Frequência de {frequenciaModal.nome}
              </h3>
              <button onClick={handleCloseFrequencia} className="text-slate-400 hover:text-slate-600 text-xl">
                <i className="bi bi-x"></i>
              </button>
            </div>

            {loadingHistorico ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
                <i className="bi bi-arrow-repeat animate-spin text-blue-500 text-3xl"></i>
                <span className="font-bold text-sm">Carregando histórico...</span>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-1 space-y-6">
                {/* Métricas do Mês Atual */}
                {(() => {
                  const hoje = new Date()
                  const anoMesAtual = hoje.toISOString().substring(0, 7) // "YYYY-MM"
                  const historicoMes = historico.filter(h => h.data.startsWith(anoMesAtual))
                  
                  const presencasMes = historicoMes.filter(h => h.presente).length
                  const totalMes = historicoMes.length
                  const frequenciaMes = totalMes > 0 ? Math.round((presencasMes / totalMes) * 100) : 0

                  const presencasGeral = historico.filter(h => h.presente).length
                  const totalGeral = historico.length
                  const frequenciaGeral = totalGeral > 0 ? Math.round((presencasGeral / totalGeral) * 100) : 0

                  return (
                    <div className="space-y-4">
                      {/* Grid de Estatísticas */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-center">
                          <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Presença no Mês</span>
                          <span className="text-3xl font-extrabold text-blue-600">{frequenciaMes}%</span>
                          <span className="block text-[10px] font-semibold text-slate-500 mt-1">
                            {presencasMes} presenças / {totalMes} total
                          </span>
                        </div>
                        <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 text-center">
                          <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Aproveitamento Geral</span>
                          <span className="text-3xl font-extrabold text-emerald-600">{frequenciaGeral}%</span>
                          <span className="block text-[10px] font-semibold text-slate-500 mt-1">
                            {presencasGeral} presenças / {totalGeral} aulas
                          </span>
                        </div>
                      </div>

                      {/* Barra de Progresso Visual */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wide">
                          <span>Frequência Mensal</span>
                          <span>{presencasMes} de {totalMes} aulas</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                            style={{ width: `${frequenciaMes}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })()}

                {/* Linha Cronológica de Presenças */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-1.5">
                    Histórico de Aulas
                  </h4>
                  
                  {historico.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm italic">
                      Nenhuma presença ou falta registrada para este aluno.
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                      {historico.map((h) => {
                        const [ano, mes, dia] = h.data.split('-')
                        return (
                          <div key={h.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-200/50">
                            <div>
                              <span className="font-extrabold text-xs text-slate-700">📅 {dia}/{mes}/{ano}</span>
                              <span className="text-[10px] text-slate-500 block mt-0.5 font-medium">{h.modalidade}</span>
                            </div>
                            <div>
                              {h.presente ? (
                                <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100">
                                  Presente
                                </span>
                              ) : (
                                <span className="inline-block px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-100">
                                  Ausente
                                </span>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-slate-100 pt-4 flex justify-end">
              <button 
                onClick={handleCloseFrequencia}
                className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors shadow-sm"
              >
                Fechar Janela
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

