import { getDashboardStats } from '@/app/actions'
import { TriggerWhatsAppButton } from '@/components/TriggerWhatsAppButton'
import { DashboardWhatsAppCard } from '@/components/DashboardWhatsAppCard'
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
        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <TriggerWhatsAppButton />
          <Link href="/alunos/novo" className="flex items-center gap-2 px-5 py-2.5 bg-[#2980b9] hover:bg-[#206a99] text-white font-medium rounded-md shadow-sm transition-colors text-sm w-fit">
            <i className="bi bi-person-plus"></i> Novo Aluno
          </Link>
        </div>
      </header>
      
      <DashboardWhatsAppCard />
      
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
          <Link href="/agenda" className="relative border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-blue-300 hover:shadow-md transition-all group">
            {stats.agendaCount > 0 && (
              <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                {stats.agendaCount}
              </span>
            )}
            <i className="bi bi-calendar-event text-4xl text-blue-600 group-hover:scale-110 transition-transform"></i>
            <span className="font-bold text-slate-800 text-sm">Agenda</span>
          </Link>
          
          <Link href="/relatorios" className="relative border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-cyan-300 hover:shadow-md transition-all group">
            <i className="bi bi-graph-up text-4xl text-cyan-500 group-hover:scale-110 transition-transform"></i>
            <span className="font-bold text-slate-800 text-sm">Relatórios</span>
          </Link>
          
          <Link href="/financeiro" className="relative border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-emerald-300 hover:shadow-md transition-all group">
            {stats.financeiroCount > 0 && (
              <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                {stats.financeiroCount}
              </span>
            )}
            <i className="bi bi-cash-coin text-4xl text-emerald-600 group-hover:scale-110 transition-transform"></i>
            <span className="font-bold text-slate-800 text-sm">Financeiro</span>
          </Link>
          
          <Link href="/diario" className="relative border border-slate-200 rounded-xl p-8 flex flex-col items-center justify-center gap-4 hover:border-blue-300 hover:shadow-md transition-all group">
            {stats.diarioCount > 0 && (
              <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm">
                {stats.diarioCount}
              </span>
            )}
            <i className="bi bi-calendar-check text-4xl text-blue-600 group-hover:scale-110 transition-transform"></i>
            <span className="font-bold text-slate-800 text-sm">Quem Vem Hoje</span>
          </Link>
        </div>
      </div>

      {/* Alertas e Notificações Detalhados */}
      <div className="bg-white border border-slate-100 rounded-xl p-8 shadow-sm mt-8">
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
          <i className="bi bi-bell-fill text-amber-500 text-xl"></i> Central de Avisos e Alertas do Dia
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Agenda Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2 pb-2 border-b border-slate-100">
              <i className="bi bi-calendar-event text-blue-600"></i> Agenda
              {stats.agendaCount > 0 && (
                <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {stats.agendaCount}
                </span>
              )}
            </h3>

            <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
              {!stats.agendaWarnings || stats.agendaWarnings.length === 0 ? (
                <div className="text-slate-400 italic text-xs py-4">Nenhum aviso ou agendamento para hoje.</div>
              ) : (
                stats.agendaWarnings.map((w: any) => (
                  <Link 
                    key={w.id} 
                    href={w.link} 
                    className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 hover:border-blue-300 hover:bg-blue-50/20 transition-all flex flex-col gap-1 group"
                  >
                    <span className="font-bold text-slate-800 text-[13px] group-hover:text-blue-700 transition-colors">{w.titulo}</span>
                    <span className="text-slate-500 text-[11px] font-medium leading-relaxed">{w.descricao}</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Financeiro Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2 pb-2 border-b border-slate-100">
              <i className="bi bi-cash-coin text-emerald-600"></i> Financeiro
              {stats.financeiroCount > 0 && (
                <span className="bg-red-100 text-red-800 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                  {stats.financeiroCount}
                </span>
              )}
            </h3>

            <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
              {!stats.financeiroWarnings || stats.financeiroWarnings.length === 0 ? (
                <div className="text-slate-400 italic text-xs py-4">Nenhuma mensalidade pendente ou atrasada.</div>
              ) : (
                stats.financeiroWarnings.map((w: any) => (
                  <Link 
                    key={w.id} 
                    href={w.link} 
                    className="p-3 bg-rose-50/30 rounded-xl border border-rose-200/50 hover:border-red-300 hover:bg-rose-50/60 transition-all flex flex-col gap-1 group"
                  >
                    <span className="font-bold text-rose-950 text-[13px] flex items-center gap-1.5">
                      <i className="bi bi-exclamation-circle-fill text-red-500 text-[11px]"></i>
                      {w.titulo}
                    </span>
                    <span className="text-slate-600 text-[11px] font-medium leading-relaxed">{w.descricao}</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Quem Vem Hoje Column */}
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-2 pb-2 border-b border-slate-100">
              <i className="bi bi-calendar-check text-blue-600"></i> Quem Vem Hoje
              {stats.diarioCount > 0 && (
                <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {stats.diarioCount}
                </span>
              )}
            </h3>

            <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
              {!stats.diarioWarnings || stats.diarioWarnings.length === 0 ? (
                <div className="text-slate-400 italic text-xs py-4">Nenhum aluno agendado para hoje.</div>
              ) : (
                stats.diarioWarnings.map((w: any) => (
                  <Link 
                    key={w.id} 
                    href={w.link} 
                    className={`p-3 rounded-xl border transition-all flex flex-col gap-1 group ${
                      w.pendente 
                        ? 'bg-amber-50/30 border-amber-200/50 hover:border-amber-400 hover:bg-amber-50/60' 
                        : 'bg-slate-50 border-slate-200/60 hover:border-blue-300 hover:bg-blue-50/20'
                    }`}
                  >
                    <span className={`font-bold text-[13px] flex items-center gap-1.5 ${w.pendente ? 'text-amber-900' : 'text-slate-800 group-hover:text-blue-700'}`}>
                      {w.pendente && <i className="bi bi-bell-fill text-amber-500 text-[11px] animate-pulse"></i>}
                      {w.titulo}
                    </span>
                    <span className="text-slate-500 text-[11px] font-medium leading-relaxed">{w.descricao}</span>
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
