"use client"

import { useState } from 'react'
import { triggerWhatsAppChecks } from '@/app/actions'

export function TriggerWhatsAppButton() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleTrigger = async () => {
    setLoading(true)
    setStatus('idle')
    try {
      const res = await triggerWhatsAppChecks()
      if (res.success) {
        setStatus('success')
        setTimeout(() => setStatus('idle'), 4000)
      } else {
        setStatus('error')
        setTimeout(() => setStatus('idle'), 4000)
      }
    } catch (err) {
      console.error(err)
      setStatus('error')
      setTimeout(() => setStatus('idle'), 4000)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      {status === 'success' && (
        <span className="text-emerald-600 text-xs font-semibold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg animate-fadeIn">
          ✓ Alertas disparados com sucesso!
        </span>
      )}
      {status === 'error' && (
        <span className="text-rose-600 text-xs font-semibold bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-lg animate-fadeIn">
          ⚠ Falha ao disparar alertas.
        </span>
      )}

      <button
        onClick={handleTrigger}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-md shadow-sm transition-all text-sm w-fit ${
          loading ? 'opacity-70 cursor-not-allowed' : ''
        }`}
        title="Disparar avisos de treino de hoje por WhatsApp"
      >
        {loading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Disparando...</span>
          </>
        ) : (
          <>
            <i className="bi bi-whatsapp"></i>
            <span>Disparar Avisos de Treino</span>
          </>
        )}
      </button>
    </div>
  )
}
