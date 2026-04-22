"use client"

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { salvarModalidade } from '@/app/actions'
import { useState } from 'react'

export default function NovaModalidadePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    const result = await salvarModalidade(formData)
    setLoading(false)

    if (result.success) {
      router.push('/modalidades')
      router.refresh()
    } else {
      alert('Erro ao salvar modalidade.')
    }
  }

  return (
    <div className="w-full text-slate-800 font-sans max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#2c3e50]">Nova Modalidade</h1>
        <Link 
          href="/modalidades" 
          className="px-4 py-2 bg-white border border-slate-200 text-slate-600 font-medium rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
        >
          Voltar
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8">
        <form action={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Nome da Modalidade</label>
            <input 
              name="nome"
              required
              type="text" 
              placeholder="Ex: Muay Thai" 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner" 
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Descrição</label>
            <textarea 
              name="descricao"
              rows={3} 
              placeholder="Ex: Aulas intensas focadas em..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-inner"
            ></textarea>
          </div>

          <div className="space-y-4 pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <div className="relative flex items-center">
                <input type="checkbox" name="ativa" defaultChecked className="peer sr-only" />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </div>
              <span className="font-medium text-slate-700">Modalidade Ativa</span>
            </label>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <label className="flex items-start gap-3 cursor-pointer">
                <div className="relative flex items-center mt-0.5">
                  <input type="checkbox" name="exigeHorario" className="peer sr-only" />
                  <div className="w-5 h-5 bg-white border-2 border-slate-300 rounded peer-checked:bg-amber-500 peer-checked:border-amber-500 flex items-center justify-center transition-colors">
                    <i className="bi bi-check text-white opacity-0 peer-checked:opacity-100 font-bold"></i>
                  </div>
                </div>
                <div>
                  <span className="font-bold text-amber-700 flex items-center gap-2">
                    <i className="bi bi-clock-history"></i> Exige Horário a Combinar (Ex: Personal)
                  </span>
                  <p className="text-sm text-amber-600/80 mt-1">
                    Se marcado, o cadastro do aluno pedirá definição manual de dia e hora.
                  </p>
                </div>
              </label>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex justify-end">
            <button 
              type="submit" 
              disabled={loading}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <span>Salvando...</span>
              ) : (
                <>
                  <i className="bi bi-check-lg"></i> Salvar
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
