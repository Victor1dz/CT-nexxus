import { getDashboardStats } from '@/app/actions'

export const dynamic = "force-dynamic"

export default async function Dashboard() {
  const stats = await getDashboardStats()

  return (
    <div className="w-full text-slate-800 font-sans">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#2c3e50]">
          Dashboard
        </h1>
        <p className="text-slate-500 mt-2 text-lg">Visão geral do sistema CT Nexxus.</p>
      </header>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col gap-2">
          <h3 className="text-slate-500 font-semibold">Alunos Ativos</h3>
          <p className="text-4xl font-bold text-blue-600">{stats.totalAlunos}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col gap-2">
          <h3 className="text-slate-500 font-semibold">Receitas (Mês)</h3>
          <p className="text-4xl font-bold text-emerald-600">R$ {stats.receitaMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col gap-2">
          <h3 className="text-slate-500 font-semibold">Inadimplentes</h3>
          <p className="text-4xl font-bold text-red-500">{stats.totalInadimplentes}</p>
        </div>
      </div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-100 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><i className="bi bi-bell text-amber-500"></i> Avisos Importantes</h2>
          {stats.totalInadimplentes > 0 ? (
            <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-start gap-3">
              <i className="bi bi-exclamation-triangle-fill mt-1"></i>
              <div>
                <p className="font-bold">Atenção Financeira</p>
                <p className="text-sm">Você possui {stats.totalInadimplentes} mensalidade(s) em atraso. Vá até a tela Financeiro para cobrar.</p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100 flex items-start gap-3">
              <i className="bi bi-check-circle-fill mt-1"></i>
              <div>
                <p className="font-bold">Tudo em dia!</p>
                <p className="text-sm">Nenhum aluno inadimplente no momento.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
