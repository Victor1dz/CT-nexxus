"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { atualizarStatusDespesa } from '@/app/actions'

interface Props {
  id: number
  status: string
}

export function DespesaStatusForm({ id, status: initialStatus }: Props) {
  const [status, setStatus] = useState(initialStatus)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSave = async (newStatus: string) => {
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('id', String(id))
      formData.append('status', newStatus)

      await atualizarStatusDespesa(formData)
      
      router.refresh()
      
      setTimeout(() => {
        setLoading(false)
      }, 500)
    } catch (err) {
      console.error(err)
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-1.5 justify-end">
      {loading ? (
        <div className="w-28 h-8 flex items-center justify-center gap-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg shadow-sm">
          <svg className="animate-spin h-3.5 w-3.5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Salvando...</span>
        </div>
      ) : (
        <select 
          value={status}
          onChange={(e) => {
            const val = e.target.value
            setStatus(val)
            handleSave(val)
          }}
          className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1.5 text-sm text-slate-700 outline-none w-28 shadow-sm focus:ring-2 focus:ring-blue-500 cursor-pointer"
          autoComplete="off"
        >
          <option value="PENDENTE">Pendente</option>
          <option value="PAGO">Pago</option>
        </select>
      )}
    </div>
  )
}
