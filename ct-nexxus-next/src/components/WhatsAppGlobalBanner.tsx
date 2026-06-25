"use client"

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { getWhatsAppStatus } from '@/app/actions'
import Link from 'next/link'

export function WhatsAppGlobalBanner() {
  const [status, setStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'LOADING'>('LOADING')
  const pathname = usePathname()

  const fetchStatus = async () => {
    try {
      const data = await getWhatsAppStatus()
      setStatus(data.status)
    } catch (error) {
      setStatus('DISCONNECTED')
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 15000) // Poll every 15s to keep Render awake and check connection
    return () => clearInterval(interval)
  }, [])

  const isWhatsAppPage = pathname === '/whatsapp'

  return (
    <div className="w-full mb-6">
      {/* Indicador de Status Discreto no topo superior direito */}
      <div className="flex justify-end mb-2">
        <div className="flex items-center gap-1.5 px-3 py-1 bg-white border border-slate-100 rounded-full shadow-sm text-xs font-semibold select-none">
          {status === 'CONNECTED' && (
            <>
              <span className="h-2.5 w-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
              <span className="text-emerald-700">WhatsApp Conectado</span>
            </>
          )}
          {status === 'CONNECTING' && (
            <>
              <span className="h-2.5 w-2.5 bg-amber-500 rounded-full animate-pulse"></span>
              <span className="text-amber-700">WhatsApp Conectando...</span>
            </>
          )}
          {status === 'DISCONNECTED' && (
            <>
              <span className="h-2.5 w-2.5 bg-rose-500 rounded-full animate-pulse"></span>
              <span className="text-rose-700 font-bold">WhatsApp Desconectado</span>
            </>
          )}
          {status === 'LOADING' && (
            <>
              <span className="h-2.5 w-2.5 bg-slate-400 rounded-full animate-pulse"></span>
              <span className="text-slate-500">Verificando WhatsApp...</span>
            </>
          )}
        </div>
      </div>

      {/* Banner de Aviso de Desconexão (Oculto se já estiver na página do WhatsApp) */}
      {!isWhatsAppPage && status === 'DISCONNECTED' && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fadeIn">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center text-lg shrink-0">
              <i className="bi bi-exclamation-triangle-fill"></i>
            </div>
            <div>
              <h4 className="font-bold text-rose-950 text-sm">Automação de Mensagens Inativa</h4>
              <p className="text-rose-700 text-xs mt-0.5 font-medium">
                Seu celular não está vinculado ao sistema. Os avisos de mensalidades e lembretes de aula não serão enviados.
              </p>
            </div>
          </div>
          <Link 
            href="/whatsapp"
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm text-center whitespace-nowrap"
          >
            Vincular WhatsApp
          </Link>
        </div>
      )}
    </div>
  )
}
