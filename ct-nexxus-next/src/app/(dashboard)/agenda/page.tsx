import Link from 'next/link'

export const dynamic = "force-dynamic"

export default function AgendaPage() {
  return (
    <div className="w-full text-slate-800 font-sans">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#2c3e50] flex items-center gap-3">
          <i className="bi bi-calendar-week text-blue-600"></i> Agenda Geral
        </h1>
        <button className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2">
          <i className="bi bi-plus-lg"></i> Novo Agendamento
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-12 text-center">
        <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
          <i className="bi bi-tools"></i>
        </div>
        <h2 className="text-2xl font-bold text-slate-700 mb-2">Módulo em Construção</h2>
        <p className="text-slate-500 max-w-lg mx-auto">
          A interface visual do calendário dinâmico (FullCalendar) está sendo migrada para a nova plataforma.
          Em breve você poderá visualizar e arrastar seus agendamentos diretamente por aqui.
        </p>
      </div>
    </div>
  )
}
