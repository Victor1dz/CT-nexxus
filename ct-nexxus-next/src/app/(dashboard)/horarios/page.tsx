import { getHorariosEDisponibilidade, bloquearVagaLivre } from '@/app/actions'
import Link from 'next/link'

export const dynamic = "force-dynamic"

export default async function HorariosPage() {
  const { horarios, mapaLivres } = await getHorariosEDisponibilidade()
  const diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <div className="w-full text-slate-800 font-sans">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#2c3e50] flex items-center gap-3">
          Grade de Horários
        </h1>
        
        <Link href="/horarios/form" className="flex items-center gap-2 px-5 py-2.5 bg-[#2980b9] hover:bg-[#206a99] text-white font-medium rounded-md shadow-sm transition-colors text-sm w-fit">
          <i className="bi bi-clock"></i> Novo Horário
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        <button className="px-4 py-2 bg-white border border-slate-300 text-slate-600 rounded-md text-sm hover:bg-slate-50">
          <i className="bi bi-sort-alpha-down"></i> A-Z
        </button>
        <button className="px-4 py-2 bg-white border border-slate-300 text-slate-600 rounded-md text-sm hover:bg-slate-50">
          <i className="bi bi-sort-alpha-up"></i> Z-A
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mb-12">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold text-sm">
                <th className="py-4 px-6">Modalidade</th>
                <th className="py-4 px-6">Dias</th>
                <th className="py-4 px-6">Horário</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {horarios.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">Nenhum horário cadastrado.</td>
                </tr>
              ) : (
                horarios.map((h: any) => {
                  const hasHorario = h.hora_inicio && h.hora_fim
                  let horarioDisplay = "A combinar"
                  if (hasHorario) {
                    const hI = new Date(h.hora_inicio).toISOString().substring(11, 16)
                    const hF = new Date(h.hora_fim).toISOString().substring(11, 16)
                    horarioDisplay = `${hI} - ${hF}`
                  }

                  return (
                    <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6 font-bold text-[#2980b9]">{h.modalidades?.nome || '-'}</td>
                      <td className="py-4 px-6 text-slate-700">{h.dias_semana || '-'}</td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-slate-200 rounded-full text-slate-700 text-xs font-medium">
                          <i className="bi bi-alarm"></i> {horarioDisplay}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-bold">
                          {h.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <Link href={`/horarios/form?id=${h.id}`} className="w-8 h-8 flex items-center justify-center rounded border border-slate-300 text-slate-500 hover:bg-slate-100 transition-colors" title="Editar">
                          <i className="bi bi-pencil"></i>
                        </Link>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-start gap-4 mb-8">
        <div className="bg-[#198754] text-white p-3 rounded-lg shadow-sm">
          <i className="bi bi-calendar-range text-3xl"></i>
        </div>
        <div>
          <h3 className="text-xl font-bold text-[#198754]">Disponibilidade de Vagas (Calculado)</h3>
          <p className="text-slate-600 text-sm mt-1">
            O sistema calcula automaticamente os intervalos livres subtraindo todas as aulas fixas e particulares agendadas.
            <br />
            Horário de Funcionamento: <strong>06:00 às 22:00</strong>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {diasSemana.map(dia => {
          const items = mapaLivres[dia] || []
          return (
            <div key={dia} className="flex flex-col bg-slate-50 border border-slate-200 rounded-lg shadow-sm overflow-hidden h-full hover:shadow-md transition-shadow">
              <div className="bg-[#198754] text-white font-bold text-center py-2 text-sm tracking-widest uppercase">
                {dia}
              </div>
              <div className="p-4 flex-1 flex flex-col gap-3 justify-center">
                {items.length === 0 ? (
                  <div className="text-center py-6">
                    <i className="bi bi-slash-circle text-2xl text-rose-500 block mb-2"></i>
                    <span className="text-slate-600 font-bold text-sm">Sem horários livres</span>
                  </div>
                ) : (
                  items.map((h: any, i: number) => (
                    <div key={i} className="flex justify-between items-center px-4 py-2 border border-[#198754] rounded-full bg-white hover:bg-emerald-50 transition-colors shadow-sm group">
                      <div className="flex items-center gap-2 text-[#198754] font-bold text-sm">
                        <i className="bi bi-clock-history"></i>
                        <span>{h.inicio} às {h.fim}</span>
                      </div>
                      <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Link href={`/horarios/form?inicio=${h.inicio}&fim=${h.fim}&dia=${dia}`} className="text-amber-500 hover:text-amber-600" title="Editar"><i className="bi bi-pencil-fill text-xs"></i></Link>
                        <form action={bloquearVagaLivre}>
                          <input type="hidden" name="diaAbrev" value={dia} />
                          <input type="hidden" name="inicio" value={h.inicio} />
                          <input type="hidden" name="fim" value={h.fim} />
                          <button type="submit" className="text-rose-500 hover:text-rose-600" title="Excluir (Bloquear Vaga)"><i className="bi bi-trash-fill text-xs"></i></button>
                        </form>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="py-2 text-center text-xs text-slate-500 font-medium">
                Total: {items.length} janelas
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
