import prisma from '@/lib/prisma'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { salvarAnamnese } from '@/app/actions'
import ExcluirAnamneseButton from '@/components/ExcluirAnamneseButton'

export const dynamic = "force-dynamic"

interface AnamneseData {
  id: number
  aluno_id: number | null
  data_atualizacao: Date | null
  altura: number | null
  peso: number | null
  massa_muscular: number | null
  massa_gorda: number | null
  dobra_biceps: number | null
  dobra_triceps: number | null
  dobra_subescapular: number | null
  dobra_suprailiaca: number | null
  dobra_peitoral: number | null
  dobra_abdominal: number | null
  dobra_coxa: number | null
  possui_problema_cardiaco: boolean
  detalhe_problema_cardiaco: string | null
  possui_problema_respiratorio: boolean
  detalhe_problema_respiratorio: string | null
  toma_medicamento_continuo: boolean
  quais_medicamentos: string | null
  possui_alergia: boolean
  quais_alergias: string | null
  fez_cirurgia_recente: boolean
  quais_cirurgias: string | null
  objetivo_principal: string | null
  frequencia_atividade_fisica: string | null
  fuma: boolean
  bebe_alcool: boolean
  observacoes_gerais: string | null
  sugestao_treino_gerada: string | null
}

export default async function AnamnesePage(props: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ avaliacao_id?: string, saved?: string, nova?: string, deleted?: string }> 
}) {
  const params = await props.params
  const searchParams = await props.searchParams
  const alunoId = Number(params.id)
  if (!alunoId) notFound()

  const aluno = await prisma.alunos.findUnique({
    where: { id: alunoId },
    include: { anamneses: true }
  })

  if (!aluno) notFound()

  // 1. Organizar avaliações históricas por data decrescente
  const avaliacoes: AnamneseData[] = (aluno.anamneses as any[] || []).map((a: any) => ({
    ...a,
    id: Number(a.id),
    aluno_id: a.aluno_id ? Number(a.aluno_id) : null
  })).sort((a, b) => {
    const dateA = a.data_atualizacao ? new Date(a.data_atualizacao).getTime() : 0;
    const dateB = b.data_atualizacao ? new Date(b.data_atualizacao).getTime() : 0;
    return dateB - dateA;
  })

  // 2. Determinar qual avaliação física carregar no formulário
  let avaliacaoAtiva: Partial<AnamneseData> = {}
  let isNova = searchParams.nova === 'true' || avaliacoes.length === 0

  if (!isNova) {
    if (searchParams.avaliacao_id) {
      const encontrada = avaliacoes.find(a => String(a.id) === searchParams.avaliacao_id)
      if (encontrada) {
        avaliacaoAtiva = encontrada
      } else {
        avaliacaoAtiva = avaliacoes[0] // Default mais recente
      }
    } else {
      avaliacaoAtiva = avaliacoes[0] // Default mais recente
    }
  } else {
    // Se for uma nova avaliação e tivermos dados anteriores, podemos pré-preencher
    // para facilitar a digitação do treinador
    if (avaliacoes.length > 0) {
      const ultima = avaliacoes[0]
      avaliacaoAtiva = {
        altura: ultima.altura,
        possui_problema_cardiaco: ultima.possui_problema_cardiaco,
        detalhe_problema_cardiaco: ultima.detalhe_problema_cardiaco,
        possui_problema_respiratorio: ultima.possui_problema_respiratorio,
        detalhe_problema_respiratorio: ultima.detalhe_problema_respiratorio,
        toma_medicamento_continuo: ultima.toma_medicamento_continuo,
        quais_medicamentos: ultima.quais_medicamentos,
        possui_alergia: ultima.possui_alergia,
        quais_alergias: ultima.quais_alergias,
        fez_cirurgia_recente: ultima.fez_cirurgia_recente,
        quais_cirurgias: ultima.quais_cirurgias,
        objetivo_principal: ultima.objetivo_principal,
        frequencia_atividade_fisica: ultima.frequencia_atividade_fisica,
        fuma: ultima.fuma,
        bebe_alcool: ultima.bebe_alcool,
        observacoes_gerais: ultima.observacoes_gerais
      }
    }
  }

  // 3. Montar a lista cronológica ordenada do mais antigo para o mais recente para calcular evolução
  const listEvolucao = [...avaliacoes].reverse()
  const evolucaoCalculada = listEvolucao.map((av, index) => {
    let pesoDif = 0
    let massaMuscularDif = 0
    let fatPct = null
    let fatPctDif = null

    if (av.peso && av.massa_gorda) {
      fatPct = (av.massa_gorda / av.peso) * 100
    }

    if (index > 0) {
      const anterior = listEvolucao[index - 1]
      if (av.peso && anterior.peso) {
        pesoDif = av.peso - anterior.peso
      }
      if (av.massa_muscular && anterior.massa_muscular) {
        massaMuscularDif = av.massa_muscular - anterior.massa_muscular
      }
      if (fatPct && anterior.peso && anterior.massa_gorda) {
        const fatPctAnterior = (anterior.massa_gorda / anterior.peso) * 100
        fatPctDif = fatPct - fatPctAnterior
      }
    }

    return {
      ...av,
      pesoDif,
      massaMuscularDif,
      fatPct,
      fatPctDif
    }
  }).reverse() // De volta para decrescente na exibição da tabela

  async function handleSubmit(formData: FormData) {
    "use server"
    await salvarAnamnese(formData)
    redirect(`/alunos/${alunoId}/anamnese?saved=true`)
  }

  return (
    <div className="w-full text-slate-800 font-sans max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <Link href="/alunos" className="text-blue-500 hover:text-blue-600 mb-2 inline-flex items-center gap-1 font-semibold transition-colors">
            <i className="bi bi-arrow-left"></i> Voltar para Alunos
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#2c3e50] flex items-center gap-3">
            <i className="bi bi-file-medical text-blue-600"></i> Ficha de Anamnese & Evolução
          </h1>
          <p className="text-slate-500 mt-2">Aluno(a): <strong className="text-blue-600 text-lg">{aluno.nome}</strong></p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Link href={`/fichas/aluno/${alunoId}`} className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold rounded-xl shadow-sm transition-all active:scale-95 flex items-center gap-2">
            <i className="bi bi-card-checklist"></i> Prescrever Treino
          </Link>
        </div>
      </div>

      {searchParams.saved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl font-medium animate-in fade-in duration-300">
          <i className="bi bi-check-circle-fill"></i> Avaliação salva com sucesso!
        </div>
      )}

      {searchParams.deleted && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl font-medium animate-in fade-in duration-300">
          <i className="bi bi-trash-fill"></i> Avaliação física excluída com sucesso!
        </div>
      )}

      {/* Evolução Física e Comparativo */}
      {avaliacoes.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 overflow-hidden">
          <h2 className="text-xl font-bold text-[#2c3e50] mb-6 flex items-center gap-2 border-b pb-3">
            <i className="bi bi-graph-up-arrow text-emerald-500"></i> Histórico de Evolução Corporal
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-xs uppercase tracking-wider">
                  <th className="py-3.5 px-4">Data da Avaliação</th>
                  <th className="py-3.5 px-4">Peso</th>
                  <th className="py-3.5 px-4">Altura</th>
                  <th className="py-3.5 px-4">IMC</th>
                  <th className="py-3.5 px-4">Massa Muscular</th>
                  <th className="py-3.5 px-4">Massa Gorda</th>
                  <th className="py-3.5 px-4">% Gordura</th>
                  <th className="py-3.5 px-4">Dobras (Soma)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {evolucaoCalculada.map((ev, index) => {
                  const somaDobras = (ev.dobra_biceps || 0) + (ev.dobra_triceps || 0) + (ev.dobra_subescapular || 0) + (ev.dobra_suprailiaca || 0) + (ev.dobra_peitoral || 0) + (ev.dobra_abdominal || 0) + (ev.dobra_coxa || 0);
                  const imc = ev.peso && ev.altura ? ev.peso / (ev.altura * ev.altura) : null;
                  
                  return (
                    <tr key={`ev-${ev.id}`} className={`hover:bg-slate-50/50 transition-colors ${String(ev.id) === String(avaliacaoAtiva.id) ? 'bg-blue-50/30' : ''}`}>
                      <td className="py-4 px-4 font-bold text-slate-700">
                        {ev.data_atualizacao ? new Date(ev.data_atualizacao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-900">{ev.peso ? `${ev.peso.toFixed(1)} kg` : '-'}</span>
                        {ev.pesoDif !== 0 && (
                          <span className={`text-[11px] font-bold ml-1.5 px-1.5 py-0.5 rounded ${ev.pesoDif < 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {ev.pesoDif > 0 ? '+' : ''}{ev.pesoDif.toFixed(1)} kg
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-600">{ev.altura ? `${ev.altura.toFixed(2)} m` : '-'}</td>
                      <td className="py-4 px-4 font-semibold text-slate-700">{imc ? imc.toFixed(1) : '-'}</td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-900">{ev.massa_muscular ? `${ev.massa_muscular.toFixed(1)} kg` : '-'}</span>
                        {ev.massaMuscularDif !== 0 && (
                          <span className={`text-[11px] font-bold ml-1.5 px-1.5 py-0.5 rounded ${ev.massaMuscularDif > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                            {ev.massaMuscularDif > 0 ? '+' : ''}{ev.massaMuscularDif.toFixed(1)} kg
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-600">{ev.massa_gorda ? `${ev.massa_gorda.toFixed(1)} kg` : '-'}</td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-900">{ev.fatPct ? `${ev.fatPct.toFixed(1)}%` : '-'}</span>
                        {ev.fatPctDif !== null && ev.fatPctDif !== 0 && (
                          <span className={`text-[11px] font-bold ml-1.5 px-1.5 py-0.5 rounded ${ev.fatPctDif < 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                            {ev.fatPctDif > 0 ? '+' : ''}{ev.fatPctDif.toFixed(1)}%
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {somaDobras > 0 ? (
                          <span className="px-2 py-0.5 bg-slate-100 border rounded-lg text-slate-700 font-medium text-xs">
                            {somaDobras.toFixed(1)} mm ({Number(somaDobras / 10).toFixed(1)} cm)
                          </span>
                        ) : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Navegador de Avaliações / Ações */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-bold text-slate-500 uppercase tracking-wider mr-2">Avaliações:</span>
          {avaliacoes.map((av, index) => {
            const dataStr = av.data_atualizacao ? new Date(av.data_atualizacao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '-';
            const isActive = String(av.id) === String(avaliacaoAtiva.id) && !isNova;
            
            return (
              <Link 
                key={`sel-${av.id}`} 
                href={`/alunos/${alunoId}/anamnese?avaliacao_id=${av.id}`} 
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-105 active:scale-95 ${isActive ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'}`}
              >
                {index === 0 ? `Atual (${dataStr})` : `Avaliação ${dataStr}`}
              </Link>
            )
          })}
        </div>
        
        <Link 
          href={`/alunos/${alunoId}/anamnese?nova=true`} 
          className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 ${isNova ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'}`}
        >
          <i className="bi bi-plus-lg"></i> Nova Avaliação
        </Link>
      </div>

      {/* Formulário Principal */}
      <form action={handleSubmit} className="space-y-6">
        <input type="hidden" name="aluno_id" value={alunoId} />
        <input type="hidden" name="anamnese_id" value={isNova ? 'novo' : String(avaliacaoAtiva.id || '')} />
        
        <div className="bg-slate-100/50 border border-slate-200/80 p-4 rounded-xl text-xs font-bold text-slate-500 flex items-center justify-between gap-4">
          <span>
            {isNova ? (
              <span className="text-emerald-700 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                PREENCHENDO NOVA AVALIAÇÃO FÍSICA
              </span>
            ) : (
              <span className="text-blue-700">
                EDITANDO AVALIAÇÃO DO DIA: {avaliacaoAtiva.data_atualizacao ? new Date(avaliacaoAtiva.data_atualizacao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
              </span>
            )}
          </span>
          
          {!isNova && avaliacaoAtiva.id && (
            <ExcluirAnamneseButton 
              anamneseId={Number(avaliacaoAtiva.id)} 
              alunoId={alunoId} 
            />
          )}

          {isNova && avaliacoes.length > 0 && (
            <span className="text-[11px] font-normal italic text-slate-400">
              * Dados médicos e hábitos foram copiados da última avaliação para facilitar o preenchimento.
            </span>
          )}
        </div>

        {/* Métricas Corporais */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50 p-4">
            <h5 className="font-bold text-[#2c3e50] flex items-center gap-2"><i className="bi bi-speedometer2 text-blue-500"></i> Composição e Métricas Corporais</h5>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Data da Avaliação</label>
              <input 
                type="datetime-local" 
                name="data_atualizacao" 
                defaultValue={avaliacaoAtiva.data_atualizacao ? new Date(new Date(avaliacaoAtiva.data_atualizacao).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16)} 
                required 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition-all text-sm font-medium" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Peso (kg)</label>
              <input type="number" step="0.1" name="peso" defaultValue={avaliacaoAtiva.peso || ''} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition-all" placeholder="Ex: 80.5" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Altura (m)</label>
              <input type="number" step="0.01" name="altura" defaultValue={avaliacaoAtiva.altura || ''} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition-all" placeholder="Ex: 1.75" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Massa Muscular (kg)</label>
              <input type="number" step="0.1" name="massa_muscular" defaultValue={avaliacaoAtiva.massa_muscular || ''} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition-all" placeholder="Ex: 35.4" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Massa Gorda (kg)</label>
              <input type="number" step="0.1" name="massa_gorda" defaultValue={avaliacaoAtiva.massa_gorda || ''} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition-all" placeholder="Ex: 15.2" />
            </div>
          </div>
        </div>

        {/* Dobras Cutâneas */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50 p-4">
            <h5 className="font-bold text-[#2c3e50] flex items-center gap-2"><i className="bi bi-rulers text-blue-500"></i> Dobras Cutâneas (Protocolo de Acompanhamento)</h5>
          </div>
          <div className="p-6 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex justify-between">
                <span>Bíceps (mm)</span>
                <span id="dobra_biceps_cm" className="text-blue-600 font-semibold lowercase"></span>
              </label>
              <input type="number" step="0.1" name="dobra_biceps" id="input_dobra_biceps" defaultValue={avaliacaoAtiva.dobra_biceps || ''} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition-all" placeholder="Ex: 6.0" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex justify-between">
                <span>Tríceps (mm)</span>
                <span id="dobra_triceps_cm" className="text-blue-600 font-semibold lowercase"></span>
              </label>
              <input type="number" step="0.1" name="dobra_triceps" id="input_dobra_triceps" defaultValue={avaliacaoAtiva.dobra_triceps || ''} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition-all" placeholder="Ex: 12.0" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex justify-between">
                <span>Subescapular (mm)</span>
                <span id="dobra_subescapular_cm" className="text-blue-600 font-semibold lowercase"></span>
              </label>
              <input type="number" step="0.1" name="dobra_subescapular" id="input_dobra_subescapular" defaultValue={avaliacaoAtiva.dobra_subescapular || ''} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition-all" placeholder="Ex: 14.5" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex justify-between">
                <span>Suprailíaca (mm)</span>
                <span id="dobra_suprailiaca_cm" className="text-blue-600 font-semibold lowercase"></span>
              </label>
              <input type="number" step="0.1" name="dobra_suprailiaca" id="input_dobra_suprailiaca" defaultValue={avaliacaoAtiva.dobra_suprailiaca || ''} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition-all" placeholder="Ex: 18.0" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex justify-between">
                <span>Peitoral (mm)</span>
                <span id="dobra_peitoral_cm" className="text-blue-600 font-semibold lowercase"></span>
              </label>
              <input type="number" step="0.1" name="dobra_peitoral" id="input_dobra_peitoral" defaultValue={avaliacaoAtiva.dobra_peitoral || ''} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition-all" placeholder="Ex: 10.0" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex justify-between">
                <span>Abdominal (mm)</span>
                <span id="dobra_abdominal_cm" className="text-blue-600 font-semibold lowercase"></span>
              </label>
              <input type="number" step="0.1" name="dobra_abdominal" id="input_dobra_abdominal" defaultValue={avaliacaoAtiva.dobra_abdominal || ''} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition-all" placeholder="Ex: 22.0" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex justify-between">
                <span>Coxa (mm)</span>
                <span id="dobra_coxa_cm" className="text-blue-600 font-semibold lowercase"></span>
              </label>
              <input type="number" step="0.1" name="dobra_coxa" id="input_dobra_coxa" defaultValue={avaliacaoAtiva.dobra_coxa || ''} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 focus:outline-none transition-all" placeholder="Ex: 16.5" />
            </div>
          </div>
        </div>

        {/* Saúde Geral */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50 p-4">
            <h5 className="font-bold text-rose-600 flex items-center gap-2"><i className="bi bi-heart-pulse"></i> Histórico de Saúde Geral</h5>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-3 mb-2 cursor-pointer">
                <input type="checkbox" name="possui_problema_cardiaco" defaultChecked={avaliacaoAtiva.possui_problema_cardiaco} className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500" />
                <span className="font-bold text-slate-700">Possui problema cardíaco?</span>
              </label>
              <input type="text" name="detalhe_problema_cardiaco" defaultValue={avaliacaoAtiva.detalhe_problema_cardiaco || ''} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 focus:outline-none text-sm transition-all" placeholder="Qual?" />
            </div>
            
            <div>
              <label className="flex items-center gap-3 mb-2 cursor-pointer">
                <input type="checkbox" name="possui_problema_respiratorio" defaultChecked={avaliacaoAtiva.possui_problema_respiratorio} className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500" />
                <span className="font-bold text-slate-700">Possui problema respiratório?</span>
              </label>
              <input type="text" name="detalhe_problema_respiratorio" defaultValue={avaliacaoAtiva.detalhe_problema_respiratorio || ''} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 focus:outline-none text-sm transition-all" placeholder="Qual?" />
            </div>

            <div>
              <label className="flex items-center gap-3 mb-2 cursor-pointer">
                <input type="checkbox" name="toma_medicamento_continuo" defaultChecked={avaliacaoAtiva.toma_medicamento_continuo} className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500" />
                <span className="font-bold text-slate-700">Toma medicamento contínuo?</span>
              </label>
              <input type="text" name="quais_medicamentos" defaultValue={avaliacaoAtiva.quais_medicamentos || ''} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 focus:outline-none text-sm transition-all" placeholder="Quais?" />
            </div>

            <div>
              <label className="flex items-center gap-3 mb-2 cursor-pointer">
                <input type="checkbox" name="possui_alergia" defaultChecked={avaliacaoAtiva.possui_alergia} className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500" />
                <span className="font-bold text-slate-700">Possui alguma alergia?</span>
              </label>
              <input type="text" name="quais_alergias" defaultValue={avaliacaoAtiva.quais_alergias || ''} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 focus:outline-none text-sm transition-all" placeholder="A que?" />
            </div>
            
            <div className="md:col-span-2 border-t pt-4 border-slate-100">
              <label className="flex items-center gap-3 mb-2 cursor-pointer">
                <input type="checkbox" name="fez_cirurgia_recente" defaultChecked={avaliacaoAtiva.fez_cirurgia_recente} className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500" />
                <span className="font-bold text-slate-700">Fez cirurgia recentemente?</span>
              </label>
              <input type="text" name="quais_cirurgias" defaultValue={avaliacaoAtiva.quais_cirurgias || ''} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500 focus:outline-none text-sm transition-all" placeholder="Qual e quando?" />
            </div>
          </div>
        </div>

        {/* Objetivos e Hábitos */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50 p-4">
            <h5 className="font-bold text-emerald-600 flex items-center gap-2"><i className="bi bi-bullseye"></i> Objetivos e Hábitos</h5>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Objetivo Principal</label>
              <select name="objetivo_principal" defaultValue={avaliacaoAtiva.objetivo_principal || 'Emagrecimento'} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:outline-none transition-all">
                <option value="Emagrecimento">Emagrecimento</option>
                <option value="Hipertrofia">Ganho de Massa Muscular (Hipertrofia)</option>
                <option value="Condicionamento">Condicionamento Físico</option>
                <option value="Saude">Melhoria de Saúde Geral</option>
                <option value="Competicao">Preparação para Competição</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nível de Atividade Física Atual</label>
              <select name="frequencia_atividade_fisica" defaultValue={avaliacaoAtiva.frequencia_atividade_fisica || 'Sedentario'} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:outline-none transition-all">
                <option value="Sedentario">Sedentário (Não pratica exercícios)</option>
                <option value="Leve">Leve (1-2x na semana)</option>
                <option value="Moderado">Moderado (3-4x na semana)</option>
                <option value="Intenso">Intenso (5x ou mais na semana)</option>
              </select>
            </div>

            <div className="flex items-center gap-8 mt-2 md:mt-8">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="fuma" defaultChecked={avaliacaoAtiva.fuma} className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500" />
                <span className="font-bold text-slate-700">Fumante</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="bebe_alcool" defaultChecked={avaliacaoAtiva.bebe_alcool} className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500" />
                <span className="font-bold text-slate-700">Consome Álcool</span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Observações Gerais do Treinador</label>
              <textarea name="observacoes_gerais" defaultValue={avaliacaoAtiva.observacoes_gerais || ''} rows={3} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 focus:outline-none transition-all"></textarea>
            </div>
          </div>
        </div>
        
        {avaliacaoAtiva.sugestao_treino_gerada && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
            <h5 className="font-bold text-indigo-700 mb-4 flex items-center gap-2">
              <i className="bi bi-robot text-xl"></i> IA: Análise & Sugestão de Treino Gerada
            </h5>
            <div className="text-slate-700 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: avaliacaoAtiva.sugestao_treino_gerada }}></div>
          </div>
        )}

        <div className="text-right">
          <button type="submit" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-[#2980b9] hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-lg shadow-blue-500/25 transition-all hover:-translate-y-0.5 active:translate-y-0 inline-flex items-center gap-2">
            <i className="bi bi-save"></i> Salvar Avaliação & Gerar Sugestão IA
          </button>
        </div>
      </form>
      
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          const dobras = ['biceps', 'triceps', 'subescapular', 'suprailiaca', 'peitoral', 'abdominal', 'coxa'];
          dobras.forEach(d => {
            const input = document.getElementById('input_dobra_' + d);
            const span = document.getElementById('dobra_' + d + '_cm');
            if (input && span) {
              const update = () => {
                const val = parseFloat(input.value);
                if (!isNaN(val) && val > 0) {
                  span.innerText = (val / 10).toFixed(1) + ' cm';
                } else {
                  span.innerText = '';
                }
              };
              input.addEventListener('input', update);
              input.addEventListener('change', update);
              // Rodar inicialmente
              update();
            }
          });
        })();
      ` }} />
    </div>
  )
}
