"use client"

import { useState } from "react"
import { SubmitButton } from "@/components/SubmitButton"
import { salvarFichaTreino, excluirFichaTreino } from "@/app/actions"

export default function FichaClient({ alunoId, fichas, anamnese }: any) {
  const [activeFicha, setActiveFicha] = useState<any>(fichas[0] || null)
  const [isCreating, setIsCreating] = useState(fichas.length === 0)

  // State for a new/editing ficha
  const [treinos, setTreinos] = useState<any[]>(activeFicha?.treinos_dia || [
    { dia_semana: "Treino A", foco_do_dia: "", descricao_exercicios: "" }
  ])

  const handleAddTreino = () => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const nextLetter = letters[treinos.length] || String(treinos.length + 1)
    setTreinos([...treinos, { dia_semana: `Treino ${nextLetter}`, foco_do_dia: "", descricao_exercicios: "" }])
  }

  const handleRemoveTreino = (index: number) => {
    setTreinos(treinos.filter((_, i) => i !== index))
  }

  const handleTreinoChange = (index: number, field: string, value: string) => {
    const updated = [...treinos]
    updated[index][field] = value
    setTreinos(updated)
  }

  const resetForm = (ficha: any = null) => {
    if (ficha) {
      setTreinos(ficha.treinos_dia || [])
      setActiveFicha(ficha)
      setIsCreating(false)
    } else {
      setTreinos([{ dia_semana: "Treino A", foco_do_dia: "", descricao_exercicios: "" }])
      setActiveFicha(null)
      setIsCreating(true)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Sidebar - Fichas History */}
      <div className="lg:col-span-1 space-y-4">
        <button 
          onClick={() => resetForm()}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2"
        >
          <i className="bi bi-plus-circle"></i> Criar Nova Ficha
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 font-bold text-slate-700">
            Histórico de Fichas
          </div>
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {fichas.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-sm">
                Nenhuma ficha criada ainda.
              </div>
            ) : (
              fichas.map((f: any) => (
                <button
                  key={f.id}
                  onClick={() => resetForm(f)}
                  className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${activeFicha?.id === f.id && !isCreating ? 'bg-blue-50/50 border-l-4 border-blue-500' : 'border-l-4 border-transparent'}`}
                >
                  <div className="font-bold text-slate-800">
                    {f.objetivo_ficha || "Ficha sem objetivo"}
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex justify-between">
                    <span>{new Date(f.data_criacao).toLocaleDateString('pt-BR')}</span>
                    {f.ativa ? (
                      <span className="text-emerald-600 font-medium">Ativa</span>
                    ) : (
                      <span className="text-slate-400">Inativa</span>
                    )}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {anamnese && (
          <div className="bg-amber-50 rounded-2xl shadow-sm border border-amber-200 p-5 mt-4">
            <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
              <i className="bi bi-exclamation-triangle"></i> Alertas do Aluno
            </h3>
            <ul className="text-sm text-amber-700 space-y-2">
              {anamnese.possui_problema_cardiaco && <li>• Problema Cardíaco</li>}
              {anamnese.possui_problema_respiratorio && <li>• Problema Respiratório</li>}
              {anamnese.possui_alergia && <li>• Possui Alergias</li>}
              {anamnese.observacoes_gerais && <li><strong>Obs:</strong> {anamnese.observacoes_gerais}</li>}
              {!anamnese.possui_problema_cardiaco && !anamnese.possui_problema_respiratorio && !anamnese.possui_alergia && !anamnese.observacoes_gerais && (
                <li className="text-emerald-700">Nenhuma restrição grave informada.</li>
              )}
            </ul>
          </div>
        )}
      </div>

      {/* Main Content - Editor */}
      <div className="lg:col-span-3">
        <form key={activeFicha?.id || 'nova'} action={async (formData) => { await salvarFichaTreino(formData) }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <input type="hidden" name="aluno_id" value={alunoId} />
          {activeFicha && !isCreating && <input type="hidden" name="ficha_id" value={activeFicha.id} />}
          <input type="hidden" name="treinos_json" value={JSON.stringify(treinos)} />

          <div className="p-6 md:p-8 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h2 className="text-2xl font-bold text-[#2c3e50]">
                {isCreating ? 'Elaborando Nova Ficha' : `Editando: ${activeFicha?.objetivo_ficha || 'Ficha'}`}
              </h2>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-sm font-semibold text-slate-600">Ficha Ativa</span>
                  <input type="checkbox" name="ativa" defaultChecked={isCreating ? true : activeFicha?.ativa} className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500" />
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Objetivo da Ficha</label>
                <input type="text" name="objetivo_ficha" defaultValue={isCreating ? '' : activeFicha?.objetivo_ficha} placeholder="Ex: Hipertrofia, Adaptação, Perda de Peso..." required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Observações Extras (Opcional)</label>
                <input type="text" name="observacoesia" defaultValue={isCreating ? '' : activeFicha?.observacoesia} placeholder="Ex: Cuidado com o joelho direito" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-600">Data de Criação</label>
                <input 
                  type="date" 
                  name="data_criacao" 
                  defaultValue={
                    isCreating 
                      ? new Date().toISOString().split('T')[0] 
                      : activeFicha?.data_criacao 
                        ? new Date(activeFicha.data_criacao).toISOString().split('T')[0] 
                        : new Date().toISOString().split('T')[0]
                  } 
                  required 
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner" 
                />
              </div>
            </div>

            <div className="pt-4 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <i className="bi bi-card-list text-blue-500"></i> Estrutura dos Treinos
                </h3>
                <button type="button" onClick={handleAddTreino} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-blue-700 font-bold rounded-xl transition-colors flex items-center gap-2 text-sm">
                  <i className="bi bi-plus-lg"></i> Adicionar Treino
                </button>
              </div>

              {treinos.map((treino, index) => (
                <div key={index} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50">
                  <div className="bg-slate-100/50 px-5 py-3 border-b border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-4 flex-1">
                      <input 
                        type="text" 
                        value={treino.dia_semana} 
                        onChange={(e) => handleTreinoChange(index, 'dia_semana', e.target.value)}
                        className="font-bold text-slate-800 bg-transparent border-b border-dashed border-slate-400 focus:border-blue-500 focus:outline-none px-1 py-0.5 w-32"
                        placeholder="Treino A"
                      />
                      <input 
                        type="text" 
                        value={treino.foco_do_dia} 
                        onChange={(e) => handleTreinoChange(index, 'foco_do_dia', e.target.value)}
                        className="text-slate-600 bg-transparent border-b border-dashed border-slate-400 focus:border-blue-500 focus:outline-none px-1 py-0.5 flex-1"
                        placeholder="Foco do Treino (Ex: Peito e Tríceps)"
                      />
                    </div>
                    {treinos.length > 1 && (
                      <button type="button" onClick={() => handleRemoveTreino(index)} className="text-rose-500 hover:text-rose-700 p-2 ml-4">
                        <i className="bi bi-trash3-fill"></i>
                      </button>
                    )}
                  </div>
                  <div className="p-5">
                    <textarea 
                      value={treino.descricao_exercicios}
                      onChange={(e) => handleTreinoChange(index, 'descricao_exercicios', e.target.value)}
                      placeholder="Cole aqui o treino gerado pelo GPT ou digite os exercícios. Você pode quebrar linhas livremente."
                      className="w-full min-h-[200px] bg-white border border-slate-200 rounded-xl p-4 text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner font-mono text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-slate-50 p-6 border-t border-slate-200 flex justify-between items-center">
            <div>
              {!isCreating && activeFicha && (
                <button 
                  type="button"
                  onClick={async () => {
                    if (activeFicha.ativa) {
                      alert("Você só pode excluir uma ficha inativa. Por favor, desmarque a opção 'Ficha Ativa' e salve as alterações antes de excluir.");
                      return;
                    }
                    if (confirm("Tem certeza que deseja excluir esta ficha permanentemente?")) {
                      const fd = new FormData();
                      fd.append('ficha_id', activeFicha.id);
                      await excluirFichaTreino(fd);
                      window.location.reload();
                    }
                  }}
                  className="px-5 py-2.5 bg-rose-100 text-rose-700 hover:bg-rose-200 font-bold rounded-xl transition-colors flex items-center gap-2"
                >
                  <i className="bi bi-trash3"></i> Excluir Ficha
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <SubmitButton text={isCreating ? "Criar Ficha de Treino" : "Salvar Alterações"} className="px-8 py-3 bg-gradient-to-r from-blue-600 to-[#2980b9] hover:from-blue-700 hover:to-[#2471a3] text-white font-extrabold rounded-xl shadow-md transition-all hover:-translate-y-0.5" />
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
