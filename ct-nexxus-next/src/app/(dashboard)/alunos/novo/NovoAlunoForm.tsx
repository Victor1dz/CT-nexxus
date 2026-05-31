"use client"

import { useState } from "react"
import { SubmitButton } from "@/components/SubmitButton"
import { Modalidade, Preco, Horario } from "@/types"

interface Props {
  initialModalidades: Modalidade[]
  initialPrecos: Preco[]
  initialHorarios: Horario[]
  initialAluno?: any
}

interface MatriculaBlockState {
  id: string
  selectedMod: number | ""
  selectedPreco: number | ""
  selectedHorario: number | "custom" | ""
  isCustomHorario: boolean
  customDias: string[]
  customHoraInicio: string
  customHoraFim: string
  matricula_id?: number
  data_inicio?: string
  ativo: boolean
}

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
)

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
)

import { salvarNovoAluno } from "@/app/actions"

export default function NovoAlunoForm({ initialModalidades, initialPrecos, initialHorarios, initialAluno }: Props) {
  const [blocks, setBlocks] = useState<MatriculaBlockState[]>(
    initialAluno?.matriculas?.length ? 
      initialAluno.matriculas.map((m: any, i: number) => ({
        id: String(i + 1),
        selectedMod: m.modalidade_id || "",
        selectedPreco: m.preco_id || "",
        selectedHorario: m.horario_id ? m.horario_id : (m.horario_personalizado ? "custom" : ""),
        isCustomHorario: !!m.horario_personalizado,
        customDias: m.dias_personalizados ? m.dias_personalizados.split(',').map((s: string) => s.trim()) : [],
        customHoraInicio: m.hora_inicio_personalizada ? new Date(m.hora_inicio_personalizada).toISOString().substring(11, 16) : "",
        customHoraFim: m.hora_fim_personalizada ? new Date(m.hora_fim_personalizada).toISOString().substring(11, 16) : "",
        matricula_id: m.id,
        data_inicio: m.data_inicio ? new Date(m.data_inicio).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10),
        ativo: m.ativo
      }))
    : [{ id: "1", selectedMod: "", selectedPreco: "", selectedHorario: "", isCustomHorario: false, customDias: [], customHoraInicio: "", customHoraFim: "", ativo: true, data_inicio: new Date().toISOString().substring(0, 10) }]
  )

  const [address, setAddress] = useState({
    cep: initialAluno?.cep || "",
    logradouro: initialAluno?.logradouro || "",
    numero: initialAluno?.numero || "",
    bairro: initialAluno?.bairro || "",
    cidade: initialAluno?.cidade || "",
    uf: initialAluno?.uf || "",
    telefone: initialAluno?.telefone || "",
    cpf: initialAluno?.cpf || "",
    ativo: initialAluno?.ativo ?? true
  })

  const fetchCep = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '')
    if (cleanCep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`)
        const data = await res.json()
        if (!data.erro) {
          setAddress(prev => ({
            ...prev,
            logradouro: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            uf: data.uf
          }))
        }
      } catch (e) {
        console.error(e)
      }
    }
  }

  const addBlock = () => {
    setBlocks([...blocks, { id: Math.random().toString(), selectedMod: "", selectedPreco: "", selectedHorario: "", isCustomHorario: false, customDias: [], customHoraInicio: "", customHoraFim: "", ativo: true, data_inicio: new Date().toISOString().substring(0, 10) }])
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
    <form action={async (formData) => { await salvarNovoAluno(formData) }} className="w-full text-slate-800 font-sans">
      {initialAluno && <input type="hidden" name="aluno_id" value={initialAluno.id} />}
      <input type="hidden" name="ativo" value={address.ativo ? 'on' : 'off'} />
      <input type="hidden" name="blocks_json" value={JSON.stringify(blocks)} />
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#2c3e50]">
            {initialAluno ? 'Editar Matrícula' : 'Nova Matrícula'}
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            {initialAluno ? 'Atualize os dados e planos do aluno.' : 'Cadastre um novo aluno e gerencie seus planos.'}
          </p>
          {initialAluno?.data_cadastro && (
            <p className="text-xs font-bold text-slate-400 mt-3 inline-flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-full">
              <i className="bi bi-calendar-check"></i> Aluno desde: {new Date(initialAluno.data_cadastro).toLocaleDateString('pt-BR')}
            </p>
          )}
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
              <input type="text" name="nome" defaultValue={initialAluno?.nome || ''} required placeholder="Ex: João da Silva" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Telefone <span className="text-red-500">*</span></label>
              <input type="text" name="telefone" defaultValue={initialAluno?.telefone || ''} onChange={e => setAddress(prev => ({...prev, telefone: e.target.value}))} required placeholder="(00) 00000-0000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">CPF</label>
              <input type="text" name="cpf" defaultValue={initialAluno?.cpf || ''} onChange={e => setAddress(prev => ({...prev, cpf: e.target.value}))} placeholder="000.000.000-00" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">CEP</label>
              <input type="text" name="cep" placeholder="00000-000" 
                value={address.cep}
                onChange={e => {
                  setAddress(prev => ({...prev, cep: e.target.value}))
                  fetchCep(e.target.value)
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-600">Endereço Completo</label>
              <div className="flex flex-col md:flex-row gap-2">
                <input type="text" name="logradouro" value={address.logradouro} onChange={e => setAddress(prev => ({...prev, logradouro: e.target.value}))} placeholder="Rua / Avenida" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner" />
                <input type="text" name="numero" placeholder="Nº" className="w-full md:w-24 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner" />
                <input type="text" name="bairro" value={address.bairro} onChange={e => setAddress(prev => ({...prev, bairro: e.target.value}))} placeholder="Bairro" className="w-full md:w-1/4 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner" />
              </div>
              <div className="flex gap-2 mt-2">
                <input type="text" name="cidade" value={address.cidade} onChange={e => setAddress(prev => ({...prev, cidade: e.target.value}))} placeholder="Cidade" className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner" />
                <input type="text" name="uf" value={address.uf} onChange={e => setAddress(prev => ({...prev, uf: e.target.value}))} placeholder="UF" maxLength={2} className="w-20 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner" />
              </div>
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <label className="flex items-center gap-3 cursor-pointer w-fit">
              <input type="checkbox" checked={address.ativo} onChange={e => setAddress(prev => ({...prev, ativo: e.target.checked}))} className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500" />
              <span className="font-bold text-slate-700">Aluno Ativo no Sistema</span>
            </label>
            {initialAluno && (
              <button 
                type="button" 
                onClick={async () => {
                  if (confirm("Tem certeza que deseja excluir permanentemente este aluno e todas as suas fichas, presenças e matrículas?")) {
                    const form = new FormData()
                    form.append('id', String(initialAluno.id))
                    import('@/app/actions').then(m => m.excluirAluno(initialAluno.id))
                  }
                }}
                className="px-4 py-2 text-rose-600 bg-rose-50 hover:bg-rose-100 font-bold rounded-lg transition-colors text-sm flex items-center gap-2"
              >
                <i className="bi bi-trash3-fill"></i> Excluir Aluno
              </button>
            )}
          </div>
        </div>

        {/* Matriculas Blocks */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#2c3e50] flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">2</span>
              Planos e Modalidades
            </h2>
            <button type="button" onClick={addBlock} className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-600 font-medium transition-all hover:scale-105 active:scale-95 shadow-sm">
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
              <div key={block.id} className={`relative border rounded-2xl p-6 md:p-8 shadow-sm group transition-all duration-300 ${block.ativo ? 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md' : 'bg-slate-50 border-slate-200 opacity-60 grayscale'}`}>
                
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 pb-4 border-b border-slate-100 gap-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <i className="bi bi-bookmark-star text-blue-500"></i>
                    {block.matricula_id ? 'Plano Ativo do Aluno' : 'Novo Plano / Modalidade'}
                  </span>
                  
                  <div className="flex items-center gap-4">
                    {block.matricula_id && (
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <span className={`text-xs font-bold ${block.ativo ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {block.ativo ? 'Ativo' : 'Encerrado'}
                        </span>
                        <div className={`relative w-10 h-5 transition-colors rounded-full ${block.ativo ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                          <input type="checkbox" className="sr-only" checked={block.ativo} onChange={(e) => {
                            if (!e.target.checked) {
                              if (confirm("Tem certeza que deseja encerrar este plano? O aluno não será mais cobrado por ele.")) {
                                updateBlock(block.id, "ativo", false)
                              }
                            } else {
                              updateBlock(block.id, "ativo", true)
                            }
                          }} />
                          <div className={`absolute left-1 top-1 bg-white w-3 h-3 rounded-full transition-transform ${block.ativo ? 'translate-x-5' : 'translate-x-0'}`}></div>
                        </div>
                      </label>
                    )}
                    <button type="button" onClick={() => {
                      if (block.matricula_id) {
                        if (confirm("Tem certeza que deseja EXCLUIR este plano do histórico? (Isso não pode ser desfeito. Se preferir manter o histórico, apenas Encerre o plano no botão ao lado).")) {
                          removeBlock(block.id)
                        }
                      } else {
                        removeBlock(block.id)
                      }
                    }} className="text-slate-400 hover:text-red-500 transition-colors p-2 bg-slate-50 rounded-lg hover:bg-red-50 border border-transparent hover:border-red-100 flex items-center gap-1 text-xs font-bold" title="Excluir Plano">
                      <TrashIcon /> <span className="hidden md:inline">Excluir</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                      <div className="w-full bg-blue-50 border border-blue-200 rounded-xl p-4 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex justify-between items-center">
                          <span className="text-blue-700 font-bold text-sm flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Horário Personalizado / A Combinar
                          </span>
                          {!exigeHorario && (
                            <button onClick={() => { updateBlock(block.id, "isCustomHorario", false); updateBlock(block.id, "selectedHorario", "") }} className="text-blue-400 hover:text-blue-700 transition-colors">
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                          )}
                        </div>
                        
                        <div>
                          <label className="text-xs font-bold text-blue-800 mb-2 block uppercase tracking-wider">Dias da Semana</label>
                          <div className="flex flex-wrap gap-2">
                            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
                              <button 
                                key={dia}
                                type="button"
                                onClick={() => {
                                  const dias = block.customDias.includes(dia) 
                                    ? block.customDias.filter(d => d !== dia)
                                    : [...block.customDias, dia]
                                  updateBlock(block.id, "customDias", dias)
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${block.customDias.includes(dia) ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-blue-600 border border-blue-200 hover:bg-blue-100'}`}
                              >
                                {dia.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <div className="flex-1">
                            <label className="text-xs font-bold text-blue-800 mb-1 block uppercase tracking-wider">Hora Início</label>
                            <input type="time" value={block.customHoraInicio} onChange={e => updateBlock(block.id, "customHoraInicio", e.target.value)} className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                          <div className="flex-1">
                            <label className="text-xs font-bold text-blue-800 mb-1 block uppercase tracking-wider">Hora Fim</label>
                            <input type="time" value={block.customHoraFim} onChange={e => updateBlock(block.id, "customHoraFim", e.target.value)} className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-sm text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                          </div>
                        </div>
                        
                        <p className="text-xs text-blue-600/80 font-medium italic mt-1">Se os horários ficarem vazios, será considerado "Livre / A Combinar".</p>
                      </div>
                    )}
                  </div>

                  {/* Data de Início */}
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-slate-600">Data de Início</label>
                    <input 
                      type="date" 
                      required
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner"
                      value={block.data_inicio || ""}
                      onChange={e => updateBlock(block.id, "data_inicio", e.target.value)}
                    />
                  </div>

                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end pt-4">
          <SubmitButton text="Salvar Matrícula" className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-[#2980b9] hover:from-blue-700 hover:to-blue-800 text-white font-bold text-lg shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-1 active:translate-y-0" />
        </div>

      </div>
    </form>
  )
}
