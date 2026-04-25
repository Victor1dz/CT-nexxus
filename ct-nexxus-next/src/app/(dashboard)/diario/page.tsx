import { getDiarioData } from '@/app/actions'
import DiarioClient from './DiarioClient'

export const dynamic = "force-dynamic"

export default async function DiarioPage(props: { searchParams: Promise<{ data?: string, busca?: string }> }) {
  const searchParams = await props.searchParams
  const dataAtual = searchParams.data || new Date().toISOString().split('T')[0]
  const termoBusca = searchParams.busca || ""
  
  const { agrupados, mapaPresencas, diaTermo } = await getDiarioData(dataAtual, termoBusca)

  return (
    <div className="w-full text-slate-800 font-sans">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#2c3e50] flex items-center gap-3">
            <i className="bi bi-calendar-check text-blue-600"></i> Quem Vem Hoje
          </h1>
          <p className="text-slate-500 mt-2">
            Alunos agendados para: <strong className="text-blue-600">{new Date(dataAtual).toLocaleDateString('pt-BR')} ({diaTermo})</strong>
          </p>
        </div>

        <form className="flex flex-col sm:flex-row gap-3 items-center">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-blue-600">
              <i className="bi bi-calendar3"></i>
            </span>
            <input 
              type="date" 
              name="data" 
              defaultValue={dataAtual}
              onChange={(e) => e.target.form?.submit()}
              className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-blue-600 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
          </div>

          <div className="flex bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <input 
              type="text" 
              name="busca" 
              defaultValue={termoBusca}
              placeholder="Buscar aluno no dia..." 
              className="px-4 py-2.5 w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors">
              Buscar
            </button>
          </div>
        </form>
      </div>

      <DiarioClient agrupados={agrupados} mapaPresencas={mapaPresencas} dataAtual={dataAtual} diaTermo={diaTermo} />
      
    </div>
  )
}
