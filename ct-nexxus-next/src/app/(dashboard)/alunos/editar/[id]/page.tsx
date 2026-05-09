import prisma from '@/lib/prisma'
import { redirect, notFound } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import Link from 'next/link'
import { SubmitButton } from '@/components/SubmitButton'

export const dynamic = "force-dynamic"

export default async function EditarAlunoPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params
  const id = Number(params.id)

  const aluno = await prisma.alunos.findUnique({
    where: { id }
  })

  if (!aluno) {
    notFound()
  }

  async function atualizarAluno(formData: FormData) {
    "use server"
    const nome = formData.get('nome') as string
    const telefone = formData.get('telefone') as string
    const cpf = formData.get('cpf') as string
    const cep = formData.get('cep') as string
    const logradouro = formData.get('logradouro') as string
    const numero = formData.get('numero') as string
    const bairro = formData.get('bairro') as string
    const cidade = formData.get('cidade') as string
    const uf = formData.get('uf') as string
    const ativo = formData.get('ativo') === 'on'

    await prisma.alunos.update({
      where: { id },
      data: { nome, telefone, cpf, cep, logradouro, numero, bairro, cidade, uf, ativo }
    })

    revalidatePath('/alunos')
    redirect('/alunos')
  }

  return (
    <div className="w-full text-slate-800 font-sans max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#2c3e50] mb-2">Editar Aluno</h1>
        <p className="text-slate-500">Atualize os dados básicos do aluno. Para alterar planos, acesse a ficha do aluno.</p>
      </div>

      <form action={atualizarAluno} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Nome Completo</label>
              <input type="text" name="nome" defaultValue={aluno.nome || ''} required className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Telefone</label>
              <input type="text" name="telefone" defaultValue={aluno.telefone || ''} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">CPF</label>
              <input type="text" name="cpf" defaultValue={aluno.cpf || ''} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">CEP</label>
              <input type="text" name="cep" defaultValue={aluno.cep || ''} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-semibold text-slate-600">Logradouro / Endereço</label>
              <input type="text" name="logradouro" defaultValue={aluno.logradouro || ''} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Número</label>
              <input type="text" name="numero" defaultValue={aluno.numero || ''} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Bairro</label>
              <input type="text" name="bairro" defaultValue={aluno.bairro || ''} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">Cidade</label>
              <input type="text" name="cidade" defaultValue={aluno.cidade || ''} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-600">UF</label>
              <input type="text" name="uf" defaultValue={aluno.uf || ''} maxLength={2} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
            </div>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <label className="flex items-center gap-3 cursor-pointer w-fit">
              <input type="checkbox" name="ativo" defaultChecked={aluno.ativo} className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500" />
              <span className="font-bold text-slate-700">Aluno Ativo</span>
            </label>
          </div>
        </div>
        <div className="bg-slate-50 p-6 flex justify-end gap-3 border-t border-slate-200">
          <Link href="/alunos" className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-100 transition-colors">Cancelar</Link>
          <SubmitButton text="Salvar Alterações" className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors" />
        </div>
      </form>
    </div>
  )
}
