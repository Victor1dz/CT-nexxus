"use client"

import { useState } from 'react'
import { enviarAlertaMensalidadeManual } from '@/app/actions'

interface Warning {
  id: number
  alunoNome: string
  telefone: string
  valor: number
  vencimento: string | null
  status: string
  modalidade: string
}

export function DashboardFinanceiroList({ warnings }: { warnings: Warning[] }) {
  const [sendingMap, setSendingMap] = useState<Record<number, boolean>>({})
  const [successMap, setSuccessMap] = useState<Record<number, boolean | null>>({})

  const handleSend = async (id: number) => {
    setSendingMap(prev => ({ ...prev, [id]: true }))
    setSuccessMap(prev => ({ ...prev, [id]: null }))
    try {
      const res = await enviarAlertaMensalidadeManual(id)
      if (res.success) {
        setSuccessMap(prev => ({ ...prev, [id]: true }))
        setTimeout(() => setSuccessMap(prev => ({ ...prev, [id]: null })), 3000)
      } else {
        setSuccessMap(prev => ({ ...prev, [id]: false }))
        alert(res.error || 'Erro ao enviar mensagem.')
        setTimeout(() => setSuccessMap(prev => ({ ...prev, [id]: null })), 3000)
      }
    } catch (err) {
      console.error(err)
      setSuccessMap(prev => ({ ...prev, [id]: false }))
      setTimeout(() => setSuccessMap(prev => ({ ...prev, [id]: null })), 3000)
    } finally {
      setSendingMap(prev => ({ ...prev, [id]: false }))
    }
  }

  if (warnings.length === 0) {
    return <div className="text-slate-400 italic text-xs py-4">Nenhuma mensalidade pendente ou atrasada.</div>
  }

  return (
    <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
      {warnings.map((w) => {
        const dateStr = w.vencimento ? new Date(w.vencimento).toLocaleDateString('pt-BR') : '-'
        const valorStr = w.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
        const isAtrasado = w.status === 'INADIMPLENTE'
        
        return (
          <div 
            key={w.id} 
            className={`p-3 rounded-xl border flex items-center justify-between gap-2 transition-all ${
              isAtrasado 
                ? 'bg-rose-50/40 border-rose-200 hover:border-rose-300' 
                : 'bg-amber-50/20 border-amber-100 hover:border-amber-200'
            }`}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="font-bold text-slate-900 text-xs truncate" title={w.alunoNome}>
                  {w.alunoNome}
                </span>
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-extrabold ${
                  isAtrasado ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                }`}>
                  {isAtrasado ? 'ATRASADO' : 'PENDENTE'}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 font-semibold">
                {w.modalidade} • R$ {valorStr} (Venc: {dateStr})
              </div>
            </div>
            
            {w.telefone && (
              <button
                type="button"
                onClick={() => handleSend(w.id)}
                disabled={sendingMap[w.id]}
                className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-all shadow-sm shrink-0 ${
                  successMap[w.id] === true
                    ? 'bg-emerald-500 text-white border-emerald-600'
                    : successMap[w.id] === false
                      ? 'bg-rose-50 text-rose-600 border-rose-200'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                }`}
                title="Cobrar via WhatsApp"
              >
                {sendingMap[w.id] ? (
                  <svg className="animate-spin h-3.5 w-3.5 text-emerald-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : successMap[w.id] === true ? (
                  <i className="bi bi-check-lg text-sm"></i>
                ) : successMap[w.id] === false ? (
                  <i className="bi bi-x-lg text-xs"></i>
                ) : (
                  <i className="bi bi-whatsapp text-[12px]"></i>
                )}
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}
