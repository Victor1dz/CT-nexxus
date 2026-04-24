import prisma from '@/lib/prisma'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { salvarAnamnese } from '@/app/actions'

export const dynamic = "force-dynamic"

export default async function AnamnesePage({ params }: { params: { id: string } }) {
  const alunoId = Number(params.id)
  if (!alunoId) notFound()

  const aluno = await prisma.alunos.findUnique({
    where: { id: alunoId },
    include: { anamneses: true }
  })

  if (!aluno) notFound()

  const anamnese = aluno.anamneses || {}

  async function handleSubmit(formData: FormData) {
    "use server"
    await salvarAnamnese(formData)
    redirect(`/alunos/${alunoId}/anamnese?saved=true`)
  }

  return (
    <div className="w-full text-slate-800 font-sans max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#2c3e50] flex items-center gap-3">
            <i className="bi bi-file-medical text-blue-600"></i> Ficha de Anamnese
          </h1>
          <p className="text-slate-500 mt-2">Aluno(a): <strong className="text-blue-600">{aluno.nome}</strong></p>
        </div>
        <div className="flex gap-2">
          <Link href="/alunos" className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl shadow-sm transition-colors">
            Voltar
          </Link>
          <Link href={`/fichas/aluno/${alunoId}`} className="px-5 py-2.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2">
            <i className="bi bi-card-checklist"></i> Prescrever Treino
          </Link>
        </div>
      </div>

      <form action={handleSubmit} className="space-y-6">
        <input type="hidden" name="aluno_id" value={alunoId} />
        
        {/* Métricas Corporais */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50 p-4">
            <h5 className="font-bold text-[#2c3e50] flex items-center gap-2"><i className="bi bi-speedometer text-blue-500"></i> Métricas Corporais</h5>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Peso (kg)</label>
              <input type="number" step="0.1" name="peso" defaultValue={anamnese.peso || ''} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ex: 80.5" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Altura (m)</label>
              <input type="number" step="0.01" name="altura" defaultValue={anamnese.altura || ''} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" placeholder="Ex: 1.75" />
            </div>
          </div>
        </div>

        {/* Saúde Geral */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50 p-4">
            <h5 className="font-bold text-rose-600 flex items-center gap-2"><i className="bi bi-heart-pulse"></i> Saúde Geral</h5>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="flex items-center gap-3 mb-2 cursor-pointer">
                <input type="checkbox" name="possui_problema_cardiaco" defaultChecked={anamnese.possui_problema_cardiaco} className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500" />
                <span className="font-bold text-slate-700">Possui problema cardíaco?</span>
              </label>
              <input type="text" name="detalhe_problema_cardiaco" defaultValue={anamnese.detalhe_problema_cardiaco || ''} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-sm" placeholder="Qual?" />
            </div>
            
            <div>
              <label className="flex items-center gap-3 mb-2 cursor-pointer">
                <input type="checkbox" name="possui_problema_respiratorio" defaultChecked={anamnese.possui_problema_respiratorio} className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500" />
                <span className="font-bold text-slate-700">Possui problema respiratório?</span>
              </label>
              <input type="text" name="detalhe_problema_respiratorio" defaultValue={anamnese.detalhe_problema_respiratorio || ''} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-sm" placeholder="Qual?" />
            </div>

            <div>
              <label className="flex items-center gap-3 mb-2 cursor-pointer">
                <input type="checkbox" name="toma_medicamento_continuo" defaultChecked={anamnese.toma_medicamento_continuo} className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500" />
                <span className="font-bold text-slate-700">Toma medicamento contínuo?</span>
              </label>
              <input type="text" name="quais_medicamentos" defaultValue={anamnese.quais_medicamentos || ''} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-sm" placeholder="Quais?" />
            </div>

            <div>
              <label className="flex items-center gap-3 mb-2 cursor-pointer">
                <input type="checkbox" name="possui_alergia" defaultChecked={anamnese.possui_alergia} className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500" />
                <span className="font-bold text-slate-700">Possui alguma alergia?</span>
              </label>
              <input type="text" name="quais_alergias" defaultValue={anamnese.quais_alergias || ''} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-sm" placeholder="A que?" />
            </div>
            
            <div className="md:col-span-2 border-t pt-4 border-slate-100">
              <label className="flex items-center gap-3 mb-2 cursor-pointer">
                <input type="checkbox" name="fez_cirurgia_recente" defaultChecked={anamnese.fez_cirurgia_recente} className="w-5 h-5 rounded text-rose-600 focus:ring-rose-500" />
                <span className="font-bold text-slate-700">Fez cirurgia recentemente?</span>
              </label>
              <input type="text" name="quais_cirurgias" defaultValue={anamnese.quais_cirurgias || ''} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:outline-none text-sm" placeholder="Qual e quando?" />
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
              <select name="objetivo_principal" defaultValue={anamnese.objetivo_principal || 'Emagrecimento'} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                <option value="Emagrecimento">Emagrecimento</option>
                <option value="Hipertrofia">Ganho de Massa Muscular (Hipertrofia)</option>
                <option value="Condicionamento">Condicionamento Físico</option>
                <option value="Saude">Melhoria de Saúde Geral</option>
                <option value="Competicao">Preparação para Competição</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Nível de Atividade Física Atual</label>
              <select name="frequencia_atividade_fisica" defaultValue={anamnese.frequencia_atividade_fisica || 'Sedentario'} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                <option value="Sedentario">Sedentário (Não pratica exercícios)</option>
                <option value="Leve">Leve (1-2x na semana)</option>
                <option value="Moderado">Moderado (3-4x na semana)</option>
                <option value="Intenso">Intenso (5x ou mais na semana)</option>
              </select>
            </div>

            <div className="flex items-center gap-8 mt-2 md:mt-8">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="fuma" defaultChecked={anamnese.fuma} className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500" />
                <span className="font-medium text-slate-700">Fumante</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="bebe_alcool" defaultChecked={anamnese.bebe_alcool} className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500" />
                <span className="font-medium text-slate-700">Consome Álcool</span>
              </label>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-slate-700 mb-2">Observações Gerais do Treinador</label>
              <textarea name="observacoes_gerais" defaultValue={anamnese.observacoes_gerais || ''} rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"></textarea>
            </div>
          </div>
        </div>
        
        {anamnese.sugestao_treino_gerada && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
            <h5 className="font-bold text-indigo-700 mb-4 flex items-center gap-2">
              <i className="bi bi-robot text-xl"></i> IA: Sugestão de Treino Gerada
            </h5>
            <div className="text-slate-700 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: anamnese.sugestao_treino_gerada }}></div>
          </div>
        )}

        <div className="text-right">
          <button type="submit" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-colors inline-flex items-center gap-2">
            <i className="bi bi-save"></i> Salvar Anamnese & Gerar Sugestão IA
          </button>
        </div>
      </form>
    </div>
  )
}
