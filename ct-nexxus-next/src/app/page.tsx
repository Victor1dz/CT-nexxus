import { getDashboardStats } from '@/app/actions'
import Link from 'next/link'

export const dynamic = "force-dynamic"

export default async function Dashboard() {
  const stats = await getDashboardStats()
  
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  const dataAtual = new Date()
  const nomeMes = meses[dataAtual.getMonth()]
  const ano = dataAtual.getFullYear()

  return (
    <div className="w-full text-slate-800 font-sans">
      <header className="mb-8 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2c3e50]">
            Visão Geral
          </h1>
          <p className="text-slate-400 text-sm mt-1">Resumo de {nomeMes} {ano}</p>
        </div>
        <Link href="/alunos/novo" className="flex items-center gap-2 px-5 py-2.5 bg-[#2980b9] hover:bg-[#206a99] text-white font-medium rounded-md shadow-sm transition-colors text-sm w-fit">
          <i className="bi bi-person-plus"></i> Novo Aluno
        </Link>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex justify-between items-center h-32">
          <div className="flex flex-col gap-1">
            <h3 className="text-slate-400 text-xs font-bold tracking-wider uppercase">Alunos Ativos</h3>
            <p className="text-4xl font-extrabold text-slate-800">{stats.totalAlunos}</p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center text-2xl">
            <i className="bi bi-people"></i>
          </div>
        </div>
        
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex justify-between items-center h-32">
          <div className="flex flex-col gap-1">
            <h3 className="text-slate-400 text-xs font-bold tracking-wider uppercase">Receita Estimada</h3>
            <p className="text-4xl font-extrabold text-emerald-600">R$ {stats.receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center text-2xl">
            <i className="bi bi-cash-stack"></i>
          </div>
        </div>
        
        <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm flex justify-between items-center h-32">
          <div className="flex flex-col gap-1">
            <h3 className="text-slate-400 text-xs font-bold tracking-wider uppercase">Inadimplentes</h3>
            <p className="text-4xl font-extrabold text-red-500">{stats.totalInadimplentes}</p>
          </div>
          <div className="w-14 h-14 rounded-xl bg-red-50 text-red-500 flex items-center justify-center text-2xl">
            <i className="bi bi-exclamation-triangle"></i>
          </div>
        </div>
      </div>
      
      <div className="bg-white border border-slate-100 rounded-xl p-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <i className="bi bi-lightning-fill text-amber-400 text-xl"></i> Ações Rápidas
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/agenda" className="border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-blue-300 hover:shadow-md transition-all group">
            <i className="bi bi-calendar-event text-4xl text-blue-600 group-hover:scale-110 transition-transform"></i>
            <span className="font-bold text-slate-800 text-sm">Agenda</span>
          </Link>
          
          <Link href="/relatorios" className="border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-cyan-300 hover:shadow-md transition-all group">
            <i className="bi bi-graph-up text-4xl text-cyan-500 group-hover:scale-110 transition-transform"></i>
            <span className="font-bold text-slate-800 text-sm">Relatórios</span>
          </Link>
          
          <Link href="/financeiro" className="border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-emerald-300 hover:shadow-md transition-all group">
            <i className="bi bi-cash-coin text-4xl text-emerald-600 group-hover:scale-110 transition-transform"></i>
            <span className="font-bold text-slate-800 text-sm">Financeiro</span>
          </Link>
          
          <Link href="/diario" className="border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-blue-300 hover:shadow-md transition-all group">
            <i className="bi bi-calendar-check text-4xl text-blue-600 group-hover:scale-110 transition-transform"></i>
            <span className="font-bold text-slate-800 text-sm">Quem Vem Hoje</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
