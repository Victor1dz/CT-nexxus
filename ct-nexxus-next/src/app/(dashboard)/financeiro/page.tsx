import { getFinanceiroData } from '@/app/actions'

export const dynamic = "force-dynamic"

export default async function FinanceiroPage(props: { searchParams: Promise<{ mes?: string, tab?: string }> }) {
  const searchParams = await props.searchParams
  const data = await getFinanceiroData(searchParams.mes)
  const currentTab = searchParams.tab === 'despesas' ? 'despesas' : 'receitas'

  return (
    <div className="w-full text-slate-800 font-sans">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#2c3e50] flex items-center gap-3">
          <i className="bi bi-wallet2 text-blue-600"></i> Financeiro
        </h1>
        
        <div className="flex items-center gap-3">
          <form className="flex items-center">
            <input 
              type="month" 
              name="mes" 
              defaultValue={data.mesString}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            <button type="submit" className="ml-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl font-medium transition-colors border border-slate-200 shadow-sm">
              Filtrar
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-emerald-500 border border-emerald-600 text-white rounded-2xl p-6 shadow-md flex flex-col gap-1 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-emerald-400/30 text-8xl group-hover:scale-110 transition-transform duration-500">
            <i className="bi bi-arrow-down-circle-fill"></i>
          </div>
          <h3 className="text-emerald-100 font-semibold uppercase tracking-wider text-sm mb-1 z-10 flex items-center gap-2"><i className="bi bi-arrow-down-circle"></i> Receitas (Pago)</h3>
          <p className="text-4xl font-bold z-10">R$ {data.totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        
        <div className="bg-rose-500 border border-rose-600 text-white rounded-2xl p-6 shadow-md flex flex-col gap-1 relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 text-rose-400/30 text-8xl group-hover:scale-110 transition-transform duration-500">
            <i className="bi bi-arrow-up-circle-fill"></i>
          </div>
          <h3 className="text-rose-100 font-semibold uppercase tracking-wider text-sm mb-1 z-10 flex items-center gap-2"><i className="bi bi-arrow-up-circle"></i> Despesas (Pago)</h3>
          <p className="text-4xl font-bold z-10">R$ {data.totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className={`border text-white rounded-2xl p-6 shadow-md flex flex-col gap-1 relative overflow-hidden group ${data.saldo >= 0 ? 'bg-blue-600 border-blue-700' : 'bg-amber-500 border-amber-600 text-slate-900'}`}>
          <div className="absolute -right-6 -top-6 text-white/10 text-8xl group-hover:scale-110 transition-transform duration-500">
            <i className="bi bi-piggy-bank-fill"></i>
          </div>
          <h3 className={`font-semibold uppercase tracking-wider text-sm mb-1 z-10 flex items-center gap-2 ${data.saldo >= 0 ? 'text-blue-200' : 'text-amber-900'}`}><i className="bi bi-piggy-bank"></i> Saldo Líquido</h3>
          <p className="text-4xl font-bold z-10">R$ {data.saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mt-6">
        <div className="border-b border-slate-200 bg-slate-50 p-0 flex">
          <Link href={`/financeiro?mes=${data.mesString}&tab=receitas`} className={`px-6 py-4 font-bold transition-colors border-b-2 ${currentTab === 'receitas' ? 'text-blue-600 border-blue-600' : 'text-slate-500 hover:text-slate-700 border-transparent'}`}>
            Receitas (Mensalidades)
          </Link>
          <Link href={`/financeiro?mes=${data.mesString}&tab=despesas`} className={`px-6 py-4 font-bold transition-colors border-b-2 ${currentTab === 'despesas' ? 'text-blue-600 border-blue-600' : 'text-slate-500 hover:text-slate-700 border-transparent'}`}>
            Despesas
          </Link>
        </div>
        
        <div className="p-4 flex justify-between items-center border-b border-slate-100 bg-white">
          <h2 className="text-lg font-bold text-[#2c3e50]">Lançamentos do Mês</h2>
          <button className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2">
            <i className="bi bi-plus-circle"></i> Nova Despesa
          </button>
        </div>

        <div className="overflow-x-auto">
          {currentTab === 'receitas' ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-sm">
                  <th className="py-4 px-6 font-semibold">Aluno</th>
                  <th className="py-4 px-4 font-semibold">Competência</th>
                  <th className="py-4 px-4 font-semibold">Vencimento</th>
                  <th className="py-4 px-4 font-semibold">Pagamento</th>
                  <th className="py-4 px-4 font-semibold">Valor</th>
                  <th className="py-4 px-4 font-semibold">Status</th>
                  <th className="py-4 px-6 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.mensalidades.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <p>Nenhuma receita encontrada para este mês.</p>
                    </td>
                  </tr>
                ) : (
                  data.mensalidades.map((m: any) => {
                    const v = m.vencimento ? new Date(m.vencimento) : null;
                    const isAtrasado = m.status === 'PENDENTE' && v && v < new Date();
                    const pgto = m.data_pagamento ? new Date(m.data_pagamento) : null;
                    
                    return (
                      <tr key={`rec-${m.id}`} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-6 font-semibold text-slate-800">{m.alunos?.nome || '-'}</td>
                        <td className="py-4 px-4 text-slate-600">{m.competencia}</td>
                        <td className="py-4 px-4 text-slate-600">{v ? v.toLocaleDateString('pt-BR') : '-'}</td>
                        <td className="py-4 px-4 text-slate-600">
                          {pgto ? (
                            <div className="flex flex-col">
                              <span>{pgto.toLocaleDateString('pt-BR')}</span>
                              <span className="text-xs text-slate-400 font-medium uppercase">{m.forma_pagamento || '-'}</span>
                            </div>
                          ) : '-'}
                        </td>
                        <td className="py-4 px-4 font-bold text-emerald-600">R$ {Number(m.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-4 px-4">
                          {m.status === 'PAGO' ? (
                            <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md border border-emerald-100">PAGO</span>
                          ) : isAtrasado ? (
                            <span className="inline-block px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-md border border-red-100">ATRASADO</span>
                          ) : (
                            <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-md border border-amber-100">PENDENTE</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {m.alunos?.telefone && (
                              <a href={`https://wa.me/55${m.alunos.telefone.replace(/\D/g, '')}?text=Olá ${m.alunos.nome}, sua mensalidade de R$ ${Number(m.valor).toLocaleString('pt-BR')} vence em ${v ? v.toLocaleDateString('pt-BR') : ''}.`} target="_blank" rel="noreferrer" className="w-8 h-8 flex items-center justify-center rounded bg-emerald-100 text-emerald-600 hover:bg-emerald-200 border border-emerald-200 transition-colors" title="Cobrar no WhatsApp">
                                <i className="bi bi-whatsapp"></i>
                              </a>
                            )}
                            {m.status === 'PENDENTE' && (
                              <form action="/financeiro/pagar" method="post" className="flex items-center gap-2">
                                <input type="hidden" name="id" value={m.id} />
                                <select name="forma" required className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-sm text-slate-700 outline-none w-24">
                                  <option value="">Forma...</option>
                                  <option value="PIX">PIX</option>
                                  <option value="CARTAO">Cartão</option>
                                  <option value="DINHEIRO">Dinheiro</option>
                                </select>
                                <button type="submit" className="w-8 h-8 flex items-center justify-center rounded bg-emerald-500 text-white hover:bg-emerald-600 transition-colors" title="Confirmar Pagamento">
                                  <i className="bi bi-check-lg"></i>
                                </button>
                              </form>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-sm">
                  <th className="py-4 px-6 font-semibold">Descrição</th>
                  <th className="py-4 px-4 font-semibold">Categoria</th>
                  <th className="py-4 px-4 font-semibold">Vencimento</th>
                  <th className="py-4 px-4 font-semibold">Pagamento</th>
                  <th className="py-4 px-4 font-semibold">Valor</th>
                  <th className="py-4 px-4 font-semibold">Status</th>
                  <th className="py-4 px-6 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.despesas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <p>Nenhuma despesa encontrada para este mês.</p>
                    </td>
                  </tr>
                ) : (
                  data.despesas.map((d: any) => {
                    const v = d.data_vencimento ? new Date(d.data_vencimento) : null;
                    const pgto = d.data_pagamento ? new Date(d.data_pagamento) : null;
                    return (
                      <tr key={`des-${d.id}`} className="hover:bg-slate-50 transition-colors bg-rose-50/20">
                        <td className="py-4 px-6 font-semibold text-slate-800">{d.descricao}</td>
                        <td className="py-4 px-4 text-slate-600"><span className="px-2 py-1 bg-slate-100 rounded text-xs border">{d.categoria}</span></td>
                        <td className="py-4 px-4 text-slate-600">{v ? v.toLocaleDateString('pt-BR') : '-'}</td>
                        <td className="py-4 px-4 text-slate-600">{pgto ? pgto.toLocaleDateString('pt-BR') : '-'}</td>
                        <td className="py-4 px-4 font-bold text-rose-600">R$ {Number(d.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="py-4 px-4">
                          {d.status === 'PAGO' ? (
                            <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-md border border-emerald-100">PAGO</span>
                          ) : (
                            <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-md border border-amber-100">PENDENTE</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button className="w-8 h-8 flex items-center justify-center rounded bg-amber-50 text-amber-600 hover:bg-amber-100 border border-amber-200 transition-colors" title="Editar">
                              <i className="bi bi-pencil"></i>
                            </button>
                            {d.status === 'PENDENTE' && (
                              <form action="/financeiro/despesa/pagar" method="post">
                                <input type="hidden" name="id" value={d.id} />
                                <button type="submit" className="w-8 h-8 flex items-center justify-center rounded bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition-colors" title="Marcar como Pago">
                                  <i className="bi bi-check-lg"></i>
                                </button>
                              </form>
                            )}
                            <form action="/financeiro/despesa/excluir" method="post">
                              <input type="hidden" name="id" value={d.id} />
                              <button type="submit" className="w-8 h-8 flex items-center justify-center rounded bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors" title="Excluir">
                                <i className="bi bi-trash"></i>
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
