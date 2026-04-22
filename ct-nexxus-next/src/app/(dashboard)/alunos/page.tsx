import Link from 'next/link'
import { getAlunos } from '@/app/actions'

export const dynamic = "force-dynamic"

export default async function AlunosPage() {
  const alunos = await getAlunos()

  return (
    <div className="w-full text-slate-800 font-sans">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#2c3e50]">Gerenciar Alunos</h1>
        <Link 
          href="/alunos/novo" 
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-[#2980b9] text-white font-medium rounded-xl shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
        >
          <i className="bi bi-person-plus-fill"></i> Novo Aluno
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold text-sm">
                <th className="py-4 px-6 font-semibold">Nome</th>
                <th className="py-4 px-4 font-semibold">Modalidades</th>
                <th className="py-4 px-4 font-semibold">Contato</th>
                <th className="py-4 px-4 font-semibold">Anamnese</th>
                <th className="py-4 px-4 font-semibold">Status</th>
                <th className="py-4 px-6 text-right font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alunos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <i className="bi bi-people text-5xl text-slate-300 mb-3 block"></i>
                    <p className="text-lg">Nenhum aluno cadastrado ainda.</p>
                    <Link href="/alunos/novo" className="text-blue-500 font-medium hover:underline mt-2 inline-block">
                      Cadastrar Primeiro Aluno
                    </Link>
                  </td>
                </tr>
              ) : (
                alunos.map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg shrink-0">
                          {a.nome ? a.nome.charAt(0).toUpperCase() : '?'}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800">{a.nome}</div>
                          <div className="text-xs text-slate-400">
                            {a.dataCadastro ? new Date(a.dataCadastro).toLocaleDateString('pt-BR') : '-'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {a.matriculas && a.matriculas.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {a.matriculas.map((m: any) => (
                            <span key={m.id} className="inline-block px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-md border border-blue-100">
                              {m.modalidades?.nome}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 text-sm">-</span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-600 text-sm">
                      {a.telefone || '-'}
                    </td>
                    <td className="py-4 px-4">
                      <Link href={`/anamneses/aluno/${a.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-700 bg-cyan-50 border border-cyan-100 rounded-md hover:bg-cyan-100 transition-colors">
                        <i className="bi bi-clipboard2-pulse"></i> Ficha
                      </Link>
                    </td>
                    <td className="py-4 px-4">
                      {a.ativo ? (
                        <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-md border border-emerald-100">Ativo</span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-md border border-red-100">Inativo</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/fichas/aluno/${a.id}`} className="w-8 h-8 flex items-center justify-center rounded bg-amber-500 text-white hover:bg-amber-600 transition-colors" title="Treinos Inteligentes">
                          <i className="bi bi-lightning-charge-fill"></i>
                        </Link>
                        <Link href={`/alunos/editar/${a.id}`} className="w-8 h-8 flex items-center justify-center rounded bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200 transition-colors" title="Editar">
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
