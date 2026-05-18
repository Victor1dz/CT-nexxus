import { salvarDespesa } from '@/app/actions'
import { SubmitButton } from '@/components/SubmitButton'
import Link from 'next/link'
import prisma from '@/lib/prisma'

export default async function NovaDespesaPage(props: { searchParams: Promise<{ id?: string }> }) {
  const searchParams = await props.searchParams
  const id = searchParams.id ? Number(searchParams.id) : null

  let despesa = null
  if (id) {
    despesa = await prisma.despesas.findUnique({ where: { id } })
  }

  const vDate = despesa?.data_vencimento ? new Date(despesa.data_vencimento).toISOString().split('T')[0] : ''

  return (
    <div className="w-full text-slate-800 font-sans max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#2c3e50] mb-2">
          {id ? 'Editar Despesa' : 'Nova Despesa'}
        </h1>
        <p className="text-slate-500">
          Gerencie as saídas e contas fixas/variáveis.
        </p>
      </div>

      <form action={async (formData) => { "use server"; await salvarDespesa(formData) }} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {id && <input type="hidden" name="id" value={id} />}

        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Categoria</label>
              <select name="categoria" defaultValue={despesa?.categoria || 'Aluguel'} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2980b9] focus:outline-none" required>
                <option value="Aluguel">Aluguel</option>
                <option value="Água">Água</option>
                <option value="Luz">Luz</option>
                <option value="Cartão">Cartão</option>
                <option value="Investimento">Investimento</option>
                <option value="Funcionários">Funcionários</option>
                <option value="Manutenção">Manutenção</option>
                <option value="Outros">Outros</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Descrição Curta</label>
              <input type="text" name="descricao" defaultValue={despesa?.descricao || ''} placeholder="Ex: Conta de Luz ref. Maio" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2980b9] focus:outline-none" required />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Vencimento</label>
              <input type="date" name="data_vencimento" defaultValue={vDate} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2980b9] focus:outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Valor (R$)</label>
              <input type="number" step="0.01" name="valor" defaultValue={despesa?.valor ? Number(despesa.valor) : ''} placeholder="Ex: 150.00" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2980b9] focus:outline-none" required />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Status</label>
            <select name="status" defaultValue={despesa?.status || 'PENDENTE'} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2980b9] focus:outline-none" required>
              <option value="PENDENTE">Pendente</option>
              <option value="PAGO">Pago</option>
            </select>
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-100 p-6 flex justify-end gap-3">
          <Link href={`/financeiro?tab=despesas`} className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-100 transition-colors">
            Cancelar
          </Link>
          <SubmitButton text="Salvar Despesa" className="px-8 py-2.5 bg-rose-500 text-white font-bold rounded-xl shadow-sm hover:bg-rose-600 transition-colors" />
        </div>
      </form>
    </div>
  )
}
