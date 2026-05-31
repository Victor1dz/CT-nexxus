import prisma from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import FichaClient from './FichaClient'

export const dynamic = "force-dynamic"

export default async function FichaTreinoPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const id = Number(params.id)

  const aluno = await prisma.alunos.findUnique({
    where: { id },
    include: {
      anamneses: true
    }
  })

  if (!aluno) {
    notFound()
  }

  // Get active ficha
  const fichas = await prisma.fichas_treino.findMany({
    where: { aluno_id: id },
    orderBy: { data_criacao: 'desc' },
    include: { treinos_dia: true }
  })

  // We convert to serializable
  const serializableFichas = fichas.map((f: any) => ({
    ...f,
    id: Number(f.id),
    aluno_id: Number(f.aluno_id),
    data_criacao: f.data_criacao ? f.data_criacao.toISOString() : null,
    data_inicio: f.data_inicio ? f.data_inicio.toISOString() : null,
    data_fim: f.data_fim ? f.data_fim.toISOString() : null,
    treinos_dia: f.treinos_dia.map((t: any) => ({
      ...t,
      id: Number(t.id),
      ficha_treino_id: Number(t.ficha_treino_id)
    }))
  }))

  const ultimaAnamnese = aluno.anamneses && aluno.anamneses.length > 0
    ? aluno.anamneses.reduce((prev: any, curr: any) => {
        const prevDate = prev.data_atualizacao ? new Date(prev.data_atualizacao).getTime() : 0;
        const currDate = curr.data_atualizacao ? new Date(curr.data_atualizacao).getTime() : 0;
        return currDate > prevDate ? curr : prev;
      }, aluno.anamneses[0])
    : null;

  const anamnese = ultimaAnamnese ? {
    objetivo_principal: ultimaAnamnese.objetivo_principal,
    sugestao_treino_gerada: ultimaAnamnese.sugestao_treino_gerada,
    frequencia_atividade_fisica: ultimaAnamnese.frequencia_atividade_fisica,
    observacoes_gerais: ultimaAnamnese.observacoes_gerais,
    possui_problema_cardiaco: ultimaAnamnese.possui_problema_cardiaco,
    possui_problema_respiratorio: ultimaAnamnese.possui_problema_respiratorio,
    possui_alergia: ultimaAnamnese.possui_alergia
  } : null

  return (
    <div className="w-full text-slate-800 font-sans">
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-8 gap-4">
        <div>
          <Link href="/alunos" className="text-blue-500 hover:text-blue-600 mb-2 inline-flex items-center gap-1 font-medium transition-colors">
            <i className="bi bi-arrow-left"></i> Voltar para Alunos
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#2c3e50] flex items-center gap-3">
            <i className="bi bi-lightning-charge text-amber-500"></i> Ficha de Treino - {aluno.nome}
          </h1>
          <p className="text-slate-500 mt-1">
            Gerencie as fichas de treino do aluno. Cole facilmente sugestões geradas por IA (GPT).
          </p>
        </div>
        <Link href={`/alunos/${id}/anamnese`} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl shadow-sm border border-slate-200 transition-colors flex items-center gap-2">
          <i className="bi bi-clipboard2-pulse"></i> Ver Anamnese
        </Link>
      </div>

      <FichaClient 
        alunoId={id} 
        fichas={serializableFichas} 
        anamnese={anamnese} 
      />
    </div>
  )
}
