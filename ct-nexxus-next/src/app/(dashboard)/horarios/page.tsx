import { getHorariosAgrupados } from '@/app/actions'

export const dynamic = "force-dynamic"

export default async function HorariosPage() {
  const agrupados = await getHorariosAgrupados()
  const diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <div className="w-full text-slate-800 font-sans">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#2c3e50] flex items-center gap-3">
          <i className="bi bi-clock text-blue-600"></i> Grade de Horários
        </h1>
        
        <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 w-fit">
          <i className="bi bi-plus-lg"></i> Novo Horário
        </button>
      </div>

      <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm flex items-start gap-4 mb-8">
        <div className="bg-emerald-100 text-emerald-600 p-3 rounded-xl">
          <i className="bi bi-calendar-range text-2xl"></i>
        </div>
        <div>
          <h3 className="text-lg font-bold text-emerald-800">Disponibilidade de Vagas (Calculado)</h3>
          <p className="text-slate-600 text-sm mt-1">
            O sistema calcula automaticamente os intervalos livres subtraindo todas as aulas fixas e particulares agendadas.
            <br />
            Horário de Funcionamento: <strong>06:00 às 22:00</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {diasSemana.map(dia => {
          const items = agrupados[dia] || []
          return (
            <div key={dia} className="flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden h-full">
              <div className="bg-emerald-600 text-white font-bold text-center py-3">
                {dia.toUpperCase()}
              </div>
              <div className="p-3 flex-1 flex flex-col gap-3">
                {items.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-sm">Nenhum horário cadastrado</div>
                ) : (
                  items.map((h: any) => (
                    <div key={h.id} className="flex justify-between items-center px-3 py-2 border border-emerald-200 rounded-xl bg-white hover:bg-emerald-50 transition-colors shadow-sm group">
                      <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                        <i className="bi bi-clock text-emerald-400"></i>
                        <span>{h.hora_inicio} às {h.hora_fim}</span>
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="text-amber-500 hover:text-amber-600 p-1" title="Editar"><i className="bi bi-pencil-fill text-xs"></i></button>
                        <button className="text-rose-500 hover:text-rose-600 p-1" title="Excluir"><i className="bi bi-trash-fill text-xs"></i></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="bg-slate-50 py-2 text-center border-t border-slate-100 text-xs text-slate-500 font-medium">
                Total: {items.length} janelas
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
