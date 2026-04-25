import prisma from '@/lib/prisma'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { salvarModalidade } from '@/app/actions'

export const dynamic = "force-dynamic"

export default async function ModalidadesFormPage(props: { searchParams: Promise<{ id?: string }> }) {
  const searchParams = await props.searchParams
  const modalidadeId = searchParams.id ? Number(searchParams.id) : null

  let modalidade = null
  if (modalidadeId) {
    modalidade = await prisma.modalidades.findUnique({ where: { id: modalidadeId } })
  }

  async function handleSalvar(formData: FormData) {
    "use server"
    await salvarModalidade(formData)
    redirect(`/modalidades`)
  }

  return (
    <div className="w-full text-slate-800 font-sans max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#2c3e50] mb-2">
          {modalidadeId ? 'Editar Modalidade' : 'Nova Modalidade'}
        </h1>
        <p className="text-slate-500">
          Gerencie as modalidades de treino oferecidas.
        </p>
      </div>

      <form action={handleSalvar} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {modalidadeId && <input type="hidden" name="id" value={modalidadeId} />}

        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Nome da Modalidade</label>
            <input type="text" name="nome" defaultValue={modalidade?.nome || ''} placeholder="ex: Musculação" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2980b9] focus:outline-none" required />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Descrição (Opcional)</label>
            <textarea name="descricao" defaultValue={modalidade?.descricao || ''} rows={3} placeholder="Breve descrição da modalidade" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2980b9] focus:outline-none"></textarea>
          </div>

          <div className="flex gap-8 border-t border-slate-100 pt-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="ativa" defaultChecked={modalidade ? modalidade.ativa : true} className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500" />
              <span className="font-bold text-slate-700">Modalidade Ativa</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" name="exige_horario" defaultChecked={modalidade?.exige_horario || false} className="w-5 h-5 rounded text-[#2980b9] focus:ring-[#2980b9]" />
              <span className="font-bold text-slate-700">Horário "A Combinar"</span>
            </label>
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-100 p-6 flex justify-end gap-3">
          <Link href="/modalidades" className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-100 transition-colors">
            Cancelar
          </Link>
          <button type="submit" className="px-6 py-2.5 bg-[#2980b9] hover:bg-[#206a99] text-white font-bold rounded-xl shadow-sm transition-colors">
            Salvar Modalidade
          </button>
        </div>
      </form>
    </div>
  )
}
