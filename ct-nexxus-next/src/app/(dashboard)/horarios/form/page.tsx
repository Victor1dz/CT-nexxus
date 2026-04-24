import prisma from '@/lib/prisma'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { salvarHorario } from '@/app/actions'

export const dynamic = "force-dynamic"

export default async function HorariosFormPage({ searchParams }: { searchParams: { id?: string, inicio?: string, fim?: string, dia?: string } }) {
  const horarioId = searchParams.id ? Number(searchParams.id) : null
  const inicioLivre = searchParams.inicio
  const fimLivre = searchParams.fim
  const diaLivre = searchParams.dia

  let horario = null
  if (horarioId) {
    horario = await prisma.horarios.findUnique({ where: { id: horarioId } })
  } else if (inicioLivre && fimLivre && diaLivre) {
    horario = {
      hora_inicio: new Date(`1970-01-01T${inicioLivre}:00.000Z`),
      hora_fim: new Date(`1970-01-01T${fimLivre}:00.000Z`),
      dias_semana: diaLivre,
      ativo: true
    }
  }

  const modalidades = await prisma.modalidades.findMany({
    orderBy: { nome: 'asc' }
  })

  async function handleSalvar(formData: FormData) {
    "use server"
    await salvarHorario(formData)
    redirect(`/horarios`)
  }

  const getHStr = (d: any) => d ? new Date(d).toISOString().substring(11, 16) : ''

  return (
    <div className="w-full text-slate-800 font-sans max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#2c3e50] mb-2">
          {horarioId ? 'Editar Horário' : (inicioLivre ? 'Modificar Vaga Livre (Criar Bloqueio)' : 'Cadastro de Horário')}
        </h1>
        <p className="text-slate-500">
          Determine a modalidade, dias da semana e a janela de tempo.
        </p>
      </div>

      <form action={handleSalvar} className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        {horarioId && <input type="hidden" name="id" value={horarioId} />}
        
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Modalidade (Opcional - Deixe vazio para usar como Bloqueio)</label>
            <select name="modalidade_id" defaultValue={horario?.modalidade_id?.toString() || ''} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2980b9] focus:outline-none">
              <option value="">-- Apenas Bloqueio de Horário --</option>
              {modalidades.map((m: any) => (
                <option key={m.id} value={m.id}>{m.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-3">Dias da Semana</label>
            <div className="flex flex-wrap gap-4">
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => {
                const isChecked = horario?.dias_semana?.includes(dia) || false
                return (
                  <label key={dia} className="flex items-center gap-2 cursor-pointer bg-slate-50 border border-slate-200 px-3 py-2 rounded hover:bg-slate-100 transition-colors">
                    <input type="checkbox" name="dias_semana" value={dia} defaultChecked={isChecked} className="w-4 h-4 text-[#2980b9] rounded border-slate-300 focus:ring-[#2980b9]" />
                    <span className="font-medium text-slate-700">{dia}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Hora Inicial</label>
              <input type="time" name="hora_inicio" defaultValue={getHStr(horario?.hora_inicio)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2980b9] focus:outline-none" required />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Hora Final</label>
              <input type="time" name="hora_fim" defaultValue={getHStr(horario?.hora_fim)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2980b9] focus:outline-none" required />
            </div>
          </div>
          
          <div>
            <label className="flex items-center gap-3 mt-4 cursor-pointer">
              <input type="checkbox" name="ativo" defaultChecked={horario ? horario.ativo : true} className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500" />
              <span className="font-bold text-slate-700">Horário Ativo</span>
            </label>
          </div>
        </div>

        <div className="bg-slate-50 border-t border-slate-100 p-6 flex justify-end gap-3">
          <Link href={`/horarios`} className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl shadow-sm hover:bg-slate-100 transition-colors">
            Cancelar
          </Link>
          <button type="submit" className="px-6 py-2.5 bg-[#2980b9] hover:bg-[#206a99] text-white font-bold rounded-xl shadow-sm transition-colors">
            Salvar Horário
          </button>
        </div>
      </form>
    </div>
  )
}
