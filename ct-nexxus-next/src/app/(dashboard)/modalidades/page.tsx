import Link from 'next/link'
import { getModalidades } from '@/app/actions'

export const dynamic = "force-dynamic"

export default async function ModalidadesPage() {
  const modalidades = await getModalidades()

  return (
    <div className="w-full text-slate-800 font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#2c3e50]">Modalidades</h1>
        <Link 
          href="/modalidades/form" 
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-[#2980b9] text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
        >
          <i className="bi bi-plus-lg"></i> Nova Modalidade
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-sm">
                <th className="py-4 px-6 font-semibold">Nome</th>
                <th className="py-4 px-6 font-semibold">Descrição</th>
                <th className="py-4 px-6 font-semibold">Status</th>
                <th className="py-4 px-6 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {modalidades.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-16 text-center text-slate-500">
                    <i className="bi bi-gem text-5xl text-slate-300 mb-3 block"></i>
                    <p className="text-lg">Nenhuma modalidade cadastrada ainda.</p>
                  </td>
                </tr>
              ) : (
                modalidades.map((m: any) => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-800">{m.nome}</td>
                    <td className="py-4 px-6 text-slate-500">{m.descricao || '-'}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-2">
                        {m.ativa ? (
                          <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-md border border-emerald-100">Ativa</span>
                        ) : (
                          <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-md border border-slate-200">Inativa</span>
                        )}
                        {m.exige_horario && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-md border border-amber-100">
                            <i className="bi bi-clock"></i> A Combinar
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/precos/modalidade/${m.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-700 bg-cyan-50 border border-cyan-100 rounded-md hover:bg-cyan-100 transition-colors" title="Gerenciar Preços">
                          <i className="bi bi-currency-dollar"></i> Preços
                        </Link>
                        <Link href={`/modalidades/form?id=${m.id}`} className="w-8 h-8 flex items-center justify-center rounded bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors" title="Editar">
                          <i className="bi bi-pencil"></i>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
