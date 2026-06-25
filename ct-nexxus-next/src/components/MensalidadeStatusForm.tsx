"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { atualizarStatusMensalidade } from '@/app/actions'

interface Props {
  id: number
  status: string
  formaPagamento: string | null
}

export function MensalidadeStatusForm({ id, status: initialStatus, formaPagamento: initialForma }: Props) {
  const [status, setStatus] = useState(initialStatus)
  const [forma, setForma] = useState(initialForma || '')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSave = async (newStatus: string, newForma: string) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('id', String(id))
      formData.append('status', newStatus)
      formData.append('forma', newForma)

      await atualizarStatusMensalidade(formData)
      
      // Forçar atualização do Next.js
      router.refresh()
      
      // Delay pequeno para garantir que a tela atualizou
      setTimeout(() => {
        setLoading(false)
      }, 500)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5">
      {loading ? (
        <div className="w-48 h-7 flex items-center justify-center gap-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
          <svg className="animate-spin h-3.5 w-3.5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Atualizando status...</span>
        </div>
      ) : (
        <>
          <select 
            value={status}
            onChange={(e) => {
              const val = e.target.value
              setStatus(val)
              handleSave(val, forma)
            }}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 outline-none w-24 shadow-sm focus:ring-1 focus:ring-blue-500 cursor-pointer"
            autoComplete="off"
          >
            <option value="PENDENTE">Pendente</option>
            <option value="PAGO">Pago</option>
            <option value="INADIMPLENTE">Inadimplente</option>
          </select>

          <select 
            value={forma}
            onChange={(e) => {
              const val = e.target.value
              setForma(val)
              handleSave(status, val)
            }}
            className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs text-slate-700 outline-none w-20 shadow-sm focus:ring-1 focus:ring-blue-500 cursor-pointer"
            autoComplete="off"
          >
            <option value="">(Forma)</option>
            <option value="PIX">PIX</option>
            <option value="CARTÃO">Cartão</option>
            <option value="DINHEIRO">Dinheiro</option>
            <option value="TRANSFERÊNCIA">Transf.</option>
          </select>
        </>
      )}
    </div>
  )
}
