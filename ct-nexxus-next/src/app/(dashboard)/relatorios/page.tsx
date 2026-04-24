import { getRelatoriosData } from '@/app/actions'
import RelatoriosClient from './RelatoriosClient'

export const dynamic = "force-dynamic"

export default async function RelatoriosPage() {
  const data = await getRelatoriosData()

  return (
    <div className="w-full text-slate-800 font-sans">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#2c3e50] flex items-center gap-3">
          <i className="bi bi-graph-up text-blue-600"></i> Relatórios
        </h1>
      </div>

      <RelatoriosClient data={data} />
    </div>
  )
}
