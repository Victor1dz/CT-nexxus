import { getFinanceiroData, atualizarStatusMensalidade } from '@/app/actions'
import Link from 'next/link'

export const dynamic = "force-dynamic"

export default async function FinanceiroPage(props: { searchParams: Promise<{ mes?: string, tab?: string, busca?: string }> }) {
  const searchParams = await props.searchParams
  const busca = (searchParams.busca || '').trim().toLowerCase()
  const data = await getFinanceiroData(searchParams.mes)
  const currentTab = searchParams.tab === 'despesas' ? 'despesas' : 'receitas'

  const filteredDespesas = busca
    ? data.despesas.filter((d: any) => d.descricao?.toLowerCase().includes(busca))
    : data.despesas

  return (
    <div className="w-full text-slate-800 font-sans">
      {data.error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-6 mb-6 shadow-sm flex flex-col gap-2">
          <h3 className="font-bold flex items-center gap-2 text-lg">
            <i className="bi bi-exclamation-triangle-fill text-red-600"></i>
            Erro de Carregamento Financeiro
          </h3>
          <p className="text-sm font-mono bg-red-100/50 p-3 rounded-lg border border-red-200/50 text-red-900 overflow-x-auto whitespace-pre-wrap">
            {data.error}
          </p>
        </div>
      )}
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#2c3e50] flex items-center gap-3">
          <i className="bi bi-wallet2 text-blue-600"></i> Financeiro
        </h1>

        <div className="flex items-center gap-3">
          <form className="flex items-center">
            <input type="hidden" name="tab" value={currentTab} />
            <input
              type="month"
              name="mes"
              defaultValue={data.mesString}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            <input
              type="text"
              name="busca"
              defaultValue={searchParams.busca || ''}
              placeholder="Buscar aluno ou despesa..."
              className="ml-2 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
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
          <h2 className="text-lg font-bold text-[#2c3e50]">
            {currentTab === 'receitas' ? 'Recebimentos do Mês' : 'Lançamentos do Mês'}
          </h2>
          {currentTab === 'receitas' && (
            <form action={async () => { "use server"; const { gerarMensalidadesLote } = await import('@/app/actions'); await gerarMensalidadesLote(data.mesString) }}>
              <button type="submit" className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2">
                <i className="bi bi-arrow-clockwise"></i> Gerar Cobranças Faltantes
              </button>
            </form>
          )}
          {currentTab === 'despesas' && (
            <Link href="/financeiro/despesa/nova" className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg transition-colors flex items-center gap-2">
              <i className="bi bi-plus-circle"></i> Nova Despesa
            </Link>
          )}
        </div>

        <div className="overflow-x-auto">
          {currentTab === 'receitas' ? (
            (() => {
              const groupedByAluno: Record<string, {
                aluno: any;
                mensalidades: any[];
              }> = {};

              data.mensalidades.forEach((m: any) => {
                const alunoId = String(m.aluno_id || 'unknown');
                if (!groupedByAluno[alunoId]) {
                  groupedByAluno[alunoId] = {
                    aluno: m.alunos,
                    mensalidades: []
                  };
                }
                groupedByAluno[alunoId].mensalidades.push(m);
              });

              const groupedList = Object.values(groupedByAluno);
              const filteredGroupedList = busca
                ? groupedList.filter((g: any) => g.aluno?.nome?.toLowerCase().includes(busca))
                : groupedList;

              return (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-sm">
                      <th className="py-4 px-6 font-semibold w-1/4">Aluno</th>
                      <th className="py-4 px-6 font-semibold w-1/2">Planos / Modalidades do Mês</th>
                      <th className="py-4 px-6 font-semibold text-right w-1/4">Ações Rápidas</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredGroupedList.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-12 text-center text-slate-500">
                          <p>Nenhuma receita encontrada para este mês.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredGroupedList.map((g: any) => {
                        const tel = g.aluno?.telefone || '';
                        
                        let totalVal = 0;
                        const msgLines = g.mensalidades.map((m: any) => {
                          totalVal += Number(m.valor || 0);
                          const v = m.vencimento ? new Date(m.vencimento) : null;
                          const statusStr = m.status === 'PAGO' ? 'PAGO' : (m.status === 'INADIMPLENTE' ? 'ATRASADO' : 'PENDENTE');
                          const vStr = v ? v.toLocaleDateString('pt-BR') : '-';
                          return `- *${m.matriculas?.modalidades?.nome || 'Plano'}*: R$ ${Number(m.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (Vencimento: ${vStr} - *${statusStr}*)`;
                        }).join('\n');

                        // Verificar a situação geral do aluno para definir a severidade do texto
                        const temAtrasado = g.mensalidades.some((m: any) => m.status === 'INADIMPLENTE');
                        const temPendente = g.mensalidades.some((m: any) => m.status === 'PENDENTE' || m.status === 'PENDENTE_MANUAL');
                        const todasPagas = g.mensalidades.every((m: any) => m.status === 'PAGO');

                        let saudacao = "";
                        if (todasPagas) {
                          saudacao = `Confirmamos o recebimento do seu pagamento das mensalidades do CT Nexxus:\n\n${msgLines}\n\nTudo pago e regularizado! Muito obrigado e excelentes treinos! 💪🥋`;
                        } else if (temAtrasado) {
                          saudacao = `Identificamos que o pagamento da sua mensalidade no CT Nexxus está pendente e já passou da data de vencimento:\n\n${msgLines}\n\nPedimos a gentileza de realizar o pagamento o quanto antes para regularizar sua situação e evitar bloqueios. Agradecemos a compreensão.`;
                        } else {
                          saudacao = `Passando para lembrar que a sua mensalidade do CT Nexxus está em aberto:\n\n${msgLines}\n\nSe puder, realize o pagamento para manter tudo em dia. Muito obrigado! 💪🥋`;
                        }

                        const formasPgto = `\n\n*Formas de Pagamento:*\n• Pix: ctnexxus@gmail.com 🔑\n• Dinheiro 💵\n• Cartão 💳`;
                        const waText = encodeURIComponent(`Olá, *${g.aluno?.nome || ''}*!\n\n${saudacao}${formasPgto}`);
                        
                        return (
                          <tr key={`aluno-row-${g.aluno?.id || 'unk'}`} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-6 font-semibold text-slate-800 align-top">
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 text-[15px]">{g.aluno?.nome || '-'}</span>
                                {tel && <span className="text-xs text-slate-400 font-medium">{tel}</span>}
                                <span className="mt-2 text-xs font-bold text-slate-600 bg-slate-100 w-fit px-2 py-0.5 rounded border border-slate-200">
                                  Total: R$ {totalVal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </td>
                            <td className="py-4 px-6 align-top">
                              <div className="flex flex-col gap-2.5">
                                {g.mensalidades.map((m: any) => {
                                  const v = m.vencimento ? new Date(m.vencimento) : null;
                                  const pgto = m.data_pagamento ? new Date(m.data_pagamento) : null;
                                  
                                  const isVencido = m.status === 'INADIMPLENTE';
                                  const isVenceHoje = m.status === 'PENDENTE' && (() => {
                                    if (!v) return false;
                                    const today = new Date();
                                    return v.getUTCDate() === today.getDate() &&
                                           v.getUTCMonth() === today.getMonth() &&
                                           v.getUTCFullYear() === today.getFullYear();
                                  })();
                                  const temAviso = isVencido || isVenceHoje;

                                  return (
                                    <div key={`m-${m.id}`} className="flex flex-wrap items-center gap-2 p-2 bg-slate-50 border border-slate-200/80 rounded-xl shadow-sm">
                                      <div className="flex items-center gap-2 min-w-[200px]">
                                        <span className="font-extrabold text-xs text-blue-800 bg-blue-50 border border-blue-200 px-2 py-1 rounded-lg flex items-center gap-1.5">
                                          {temAviso && <i className="bi bi-bell-fill text-red-500 animate-pulse text-[10px]" title="Aviso pendente/atrasado"></i>}
                                          {m.matriculas?.modalidades?.nome || 'Plano'}
                                        </span>
                                        <span className="font-bold text-xs text-emerald-600">
                                          R$ {Number(m.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </span>
                                      </div>

                                      <div className="text-[11px] text-slate-500">
                                        Venc: <strong className="text-slate-700">{v ? v.toLocaleDateString('pt-BR') : '-'}</strong>
                                      </div>

                                      {pgto && (
                                        <div className="text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1 font-semibold">
                                          <i className="bi bi-calendar-check"></i>
                                          {pgto.toLocaleDateString('pt-BR')} ({m.forma_pagamento || 'N/I'})
                                        </div>
                                      )}

                                      <div className="ms-auto flex items-center gap-2">
                                        {m.status === 'PAGO' ? (
                                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100">PAGO</span>
                                        ) : m.status === 'INADIMPLENTE' ? (
                                          <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-100">ATRASADO</span>
                                        ) : (
                                          <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100">PENDENTE</span>
                                        )}

                                        <form action={async (formData) => { "use server"; await atualizarStatusMensalidade(formData) }} className="flex items-center gap-1.5">
                                          <input type="hidden" name="id" value={m.id} />
                                          
                                          <select 
                                            key={`status-select-${m.id}-${m.status}`}
                                            name="status" 
                                            defaultValue={m.status === 'PAGO' ? 'PAGO' : (m.status === 'INADIMPLENTE' ? 'INADIMPLENTE' : 'PENDENTE')} 
                                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 outline-none w-24 shadow-sm focus:ring-1 focus:ring-blue-500"
                                          >
                                            <option value="PENDENTE">Pendente</option>
                                            <option value="PAGO">Pago</option>
                                            <option value="INADIMPLENTE">Inadimplente</option>
                                          </select>

                                          <select 
                                            key={`forma-select-${m.id}-${m.forma_pagamento || 'empty'}`}
                                            name="forma" 
                                            defaultValue={m.forma_pagamento || ''} 
                                            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 outline-none w-20 shadow-sm focus:ring-1 focus:ring-blue-500"
                                          >
                                            <option value="">(Forma)</option>
                                            <option value="PIX">PIX</option>
                                            <option value="CARTÃO">Cartão</option>
                                            <option value="DINHEIRO">Dinheiro</option>
                                            <option value="TRANSFERÊNCIA">Transf.</option>
                                          </select>

                                          <button type="submit" className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors shadow-sm" title="Salvar">
                                            <i className="bi bi-arrow-repeat text-[12px]"></i>
                                          </button>
                                        </form>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="py-4 px-6 text-right align-top">
                              {tel && (
                                <a 
                                  href={`https://wa.me/55${tel.replace(/\D/g, '')}?text=${waText}`} 
                                  target="_blank" 
                                  rel="noreferrer" 
                                  className="inline-flex items-center justify-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-colors shadow-md shadow-emerald-500/20" 
                                  title="Cobrar todas no WhatsApp"
                                >
                                  <i className="bi bi-whatsapp"></i> Cobrar WhatsApp
                                </a>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              );
            })()
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
                {filteredDespesas.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <p>Nenhuma despesa encontrada para este mês.</p>
                    </td>
                  </tr>
                ) : (
                  filteredDespesas.map((d: any) => {
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
                          ) : (d.status === 'PENDENTE' && v && v < new Date() ? (
                            <span className="inline-block px-2.5 py-1 bg-red-50 text-red-700 text-xs font-bold rounded-md border border-red-100">ATRASADO</span>
                          ) : (
                            <span className="inline-block px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-md border border-amber-100">PENDENTE</span>
                          ))}
                        </td>
                        <td className="py-4 px-6 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link href={`/financeiro/despesa/nova?id=${d.id}`} className="w-8 h-8 flex items-center justify-center rounded bg-amber-50 text-amber-655 hover:bg-amber-105 border border-amber-200 transition-colors shadow-sm" title="Editar">
                              <i className="bi bi-pencil"></i>
                            </Link>

                            <form action={async (formData) => { "use server"; const { atualizarStatusDespesa } = await import('@/app/actions'); await atualizarStatusDespesa(formData) }} className="flex flex-wrap items-center gap-2 justify-end">
                              <input type="hidden" name="id" value={d.id} />

                              <select name="status" defaultValue={d.status === 'PAGO' ? 'PAGO' : 'PENDENTE'} className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-700 outline-none w-28 shadow-sm focus:ring-2 focus:ring-blue-500">
                                <option value="PENDENTE">Pendente</option>
                                <option value="PAGO">Pago</option>
                              </select>

                              <button type="submit" className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors shadow-sm" title="Atualizar Status">
                                <i className="bi bi-arrow-repeat"></i>
                              </button>
                            </form>

                            <form action={async (formData) => { "use server"; const { excluirDespesa } = await import('@/app/actions'); await excluirDespesa(formData) }}>
                              <input type="hidden" name="id" value={d.id} />
                              <button type="submit" className="w-8 h-8 flex items-center justify-center rounded bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors shadow-sm" title="Excluir">
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
