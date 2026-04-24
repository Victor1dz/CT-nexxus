import Link from 'next/link'
import { getPrecosPorModalidade } from '@/app/actions'
import { notFound } from 'next/navigation'

export const dynamic = "force-dynamic"

export default async function PrecosModalidadePage({ params }: { params: { id: string } }) {
  const data = await getPrecosPorModalidade(Number(params.id))

  if (!data) {
    notFound()
  }

  return (
    <div className="w-full text-slate-800 font-sans">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#2c3e50] flex items-center gap-3">
            Tabela de Preços
          </h1>
          <p className="text-slate-500 mt-2">Gerenciando preços para: <strong className="text-blue-600">{data.modalidade.nome}</strong></p>
        </div>
        
        <button className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-[#2980b9] text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5 w-fit">
          <i className="bi bi-plus-lg"></i> Novo Preço
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-sm">
                <th className="py-4 px-6 font-semibold">Frequência</th>
                <th className="py-4 px-6 font-semibold">Valor</th>
                <th className="py-4 px-6 font-semibold">Descrição</th>
                <th className="py-4 px-6 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.precos.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-slate-500">
                    <p>Nenhum preço cadastrado para esta modalidade.</p>
                  </td>
                </tr>
              ) : (
                data.precos.map((p: any) => {
                  let freqText = ""
                  switch(p.frequencia_semanal) {
                    case 1: freqText = "1x na semana"; break;
                    case 2: freqText = "2x na semana"; break;
                    case 3: freqText = "3x na semana"; break;
                    case 4: freqText = "4x na semana"; break;
                    case 5: freqText = "5x na semana"; break;
                    case 6: freqText = "Todos os dias"; break;
                    default: freqText = "Outros"; break;
                  }

                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-4 px-6 text-slate-700 font-medium">
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-100">{freqText}</span>
                      </td>
                      <td className="py-4 px-6 font-bold text-emerald-600">R$ {Number(p.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="py-4 px-6 text-slate-600">{p.descricao}</td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="w-8 h-8 flex items-center justify-center rounded bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors" title="Editar">
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="w-8 h-8 flex items-center justify-center rounded bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors" title="Excluir">
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="mt-6">
        <Link href="/modalidades" className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 font-medium rounded-xl shadow-sm hover:bg-slate-50 transition-colors inline-flex items-center gap-2">
          <i className="bi bi-arrow-left"></i> Voltar para Modalidades
        </Link>
      </div>
    </div>
  )
}
