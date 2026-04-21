"use client"

import { useState } from "react"
import { Modalidade, Preco, Horario } from "@/types"

interface Props {
  initialModalidades: Modalidade[]
  initialPrecos: Preco[]
  initialHorarios: Horario[]
}

interface MatriculaBlockState {
  id: string
  selectedMod: number | ""
  selectedPreco: number | ""
  selectedHorario: number | "custom" | ""
  isCustomHorario: boolean
}

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
)

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
)

export default function NovoAlunoForm({ initialModalidades, initialPrecos, initialHorarios }: Props) {
  const [blocks, setBlocks] = useState<MatriculaBlockState[]>([
    { id: "1", selectedMod: "", selectedPreco: "", selectedHorario: "", isCustomHorario: false }
  ])

  const addBlock = () => {
    setBlocks([...blocks, { id: Math.random().toString(), selectedMod: "", selectedPreco: "", selectedHorario: "", isCustomHorario: false }])
  }

  const removeBlock = (id: string) => {
    if (blocks.length === 1) return
    setBlocks(blocks.filter(b => b.id !== id))
  }

  const updateBlock = (id: string, field: keyof MatriculaBlockState, value: any) => {
    setBlocks(blocks.map(b => {
      if (b.id !== id) return b
      const newBlock = { ...b, [field]: value }
      if (field === "selectedMod") {
        newBlock.selectedPreco = ""
        newBlock.selectedHorario = ""
        newBlock.isCustomHorario = false
      }
      return newBlock
    }))
  }

  return (
    <div className="w-full text-slate-800 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#2c3e50]">
            Nova Matrícula
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Cadastre um novo aluno e gerencie seus planos.</p>
        </header>

        {/* Global Form Data */}
        <div className="bg-white border border-slate-100 rounded-2xl p-6 md:p-8 shadow-sm">
          <h2 className="text-xl font-bold text-[#2c3e50] mb-6 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">1</span>
            Dados do Aluno
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Nome Completo</label>
              <input type="text" placeholder="Ex: João da Silva" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">CPF</label>
              <input type="text" placeholder="000.000.000-00" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner" />
            </div>
          </div>
        </div>

        {/* Matriculas Blocks */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#2c3e50] flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">2</span>
              Planos e Modalidades
            </h2>
            <button onClick={addBlock} className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-600 font-medium transition-all hover:scale-105 active:scale-95 shadow-sm">
              <PlusIcon /> Adicionar Plano
            </button>
          </div>

          {blocks.map((block, index) => {
            const selectedModObj = initialModalidades.find(m => m.id === Number(block.selectedMod))
            const exigeHorario = selectedModObj?.exigeHorario ?? false
            const precosFiltrados = initialPrecos.filter(p => p.modalidade.id === Number(block.selectedMod))
            const horariosFiltrados = initialHorarios.filter(h => h.modalidade.id === Number(block.selectedMod))
            const currentPreco = initialPrecos.find(p => p.id === Number(block.selectedPreco))
            const displayValor = currentPreco ? `R$ ${currentPreco.valor}` : "R$ 0,00"

            return (
              <div key={block.id} className="relative bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm group hover:border-blue-300 hover:shadow-md transition-all duration-300">
                
                {blocks.length > 1 && (
                  <button onClick={() => removeBlock(block.id)} className="absolute top-6 right-6 text-slate-400 hover:text-red-500 transition-colors p-2 bg-slate-50 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100">
                    <TrashIcon />
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Modalidade */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600">Modalidade</label>
                    <div className="relative">
                      <select 
                        className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner cursor-pointer"
                        value={block.selectedMod}
                        onChange={e => updateBlock(block.id, "selectedMod", e.target.value ? Number(e.target.value) : "")}
                      >
                        <option value="">Selecione...</option>
                        {initialModalidades.map(m => (
                          <option key={m.id} value={m.id}>{m.nome}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </div>

                  {/* Preço */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600">Plano</label>
                    <div className="relative">
                      <select 
                        className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner cursor-pointer"
                        value={block.selectedPreco}
                        onChange={e => updateBlock(block.id, "selectedPreco", e.target.value ? Number(e.target.value) : "")}
                      >
                        {!block.selectedMod ? (
                          <option value="">Selecione a modalidade primeiro...</option>
                        ) : precosFiltrados.length === 0 ? (
                          <option value="">Sem planos cadastrados</option>
                        ) : (
                          <>
                            <option value="">Selecione o Plano...</option>
                            {precosFiltrados.map(p => (
                              <option key={p.id} value={p.id}>{p.descricao}</option>
                            ))}
                          </>
                        )}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                    {currentPreco && (
                      <div className="text-blue-600 text-sm font-bold pt-1 animate-in fade-in slide-in-from-top-2 duration-300">
                        {displayValor} / {currentPreco.frequenciaSemanal}x semana
                      </div>
                    )}
                  </div>

                  {/* Horário */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600">Horário</label>
                    
                    {!block.isCustomHorario && !exigeHorario ? (
                      <div className="relative">
                        <select 
                          className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner cursor-pointer"
                          value={block.selectedHorario}
                          onChange={e => {
                            const val = e.target.value
                            if (val === "custom") {
                              updateBlock(block.id, "isCustomHorario", true)
                            } else {
                              updateBlock(block.id, "selectedHorario", val ? Number(val) : "")
                            }
                          }}
                        >
                          <option value="">Selecione...</option>
                          {horariosFiltrados.map(h => (
                            <option key={h.id} value={h.id}>
                              {h.horaInicio ? `${h.horaInicio} - ` : ''}{h.modalidade.nome} | {h.diasSemana}
                            </option>
                          ))}
                          <option value="custom" className="text-blue-600 font-semibold">✨ A Combinar / Livre</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                      </div>
                    ) : null}

                    {(block.isCustomHorario || exigeHorario) && (
                      <div className="w-full bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700 font-bold text-sm flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Horário Flexível Ativado
                          </span>
                          {!exigeHorario && (
                            <button onClick={() => { updateBlock(block.id, "isCustomHorario", false); updateBlock(block.id, "selectedHorario", "") }} className="text-blue-400 hover:text-blue-700 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-blue-600/80 font-medium">O aluno não terá um horário fixo alocado pelo sistema.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-4">
          <button className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-[#2980b9] hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-1 active:translate-y-0">
            Salvar Matrícula
          </button>
        </div>

      </div>
    </div>
  )
}
