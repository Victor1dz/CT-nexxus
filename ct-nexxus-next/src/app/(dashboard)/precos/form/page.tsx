import prisma from '@/lib/prisma'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { salvarPreco } from '@/app/actions'

export const dynamic = "force-dynamic"

export default async function PrecoFormPage({ searchParams }: { searchParams: { modalidade?: string, preco?: string } }) {
  const modalidadeId = searchParams.modalidade ? Number(searchParams.modalidade) : null
  const precoId = searchParams.preco ? Number(searchParams.preco) : null

  if (!modalidadeId) {
    redirect('/modalidades')
  }

  const modalidade = await prisma.modalidades.findUnique({ where: { id: modalidadeId } })
  
  let preco = null
  if (precoId) {
    preco = await prisma.precos.findUnique({ where: { id: precoId } })
  }

  async function handleSalvar(formData: FormData) {
    "use server"
    await salvarPreco(formData)
    redirect(`/precos/modalidade/${modalidadeId}`)
  }

  return (
    <div className="w-full text-slate-800 font-sans max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#2c3e50] mb-2">
          {preco ? 'Editar Preço' : 'Cadastro de Preço'}
        </h1>
        <p className="text-slate-500">
          Configurando preço para a modalidade: <strong className="text-blue-600">{modalidade?.nome}</strong>
        </p>
      </div>

      <form action={handleSalvar} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <input type="hidden" name="id" value={preco?.id || ''} />
        <input type="hidden" name="modalidade_id" value={modalidadeId} />

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Frequência Semanal</label>
            <select name="frequencia_semanal" defaultValue={preco?.frequencia_semanal || 1} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" required>
              <option value="1">1x por semana</option>
              <option value="2">2x por semana</option>
              <option value="3">3x por semana</option>
              <option value="4">4x por semana</option>
              <option value="5">5x por semana</option>
              <option value="6">Todos os dias</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Valor (R$)</label>
            <input type="text" name="valor" inputMode="decimal" defaultValue={preco ? Number(preco.valor).toFixed(2) : ''} placeholder="ex: 120.00" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" required />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Descrição (Opcional)</label>
            <input type="text" name="descricao" defaultValue={preco?.descricao || ''} placeholder="ex: Plano Promoção" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-100 p-6 flex justify-end gap-3">
          <Link href={`/precos/modalidade/${modalidadeId}`} className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-100 transition-colors">
            Cancelar
          </Link>
          <button type="submit" className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors">
            Salvar Preço
          </button>
        </div>
      </form>
    </div>
  )
}
