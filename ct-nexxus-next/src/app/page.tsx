export default function Dashboard() {
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
          <h3 className="text-slate-500 font-semibold">Total de Alunos</h3>
          <p className="text-4xl font-bold text-blue-600">--</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col gap-2">
          <h3 className="text-slate-500 font-semibold">Mensalidades (Mês)</h3>
          <p className="text-4xl font-bold text-emerald-600">R$ --</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col gap-2">
          <h3 className="text-slate-500 font-semibold">Presenças Hoje</h3>
          <p className="text-4xl font-bold text-amber-500">--</p>
        </div>
      </div>
      
      <div className="mt-8 bg-white border border-slate-100 rounded-2xl p-8 shadow-sm text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="bi bi-tools text-2xl"></i>
        </div>
        <h2 className="text-xl font-bold text-slate-800">Em construção...</h2>
        <p className="text-slate-500 max-w-md mx-auto mt-2">
          Estamos migrando o dashboard do sistema antigo para a nova plataforma Next.js.
        </p>
      </div>
    </div>
  )
}
