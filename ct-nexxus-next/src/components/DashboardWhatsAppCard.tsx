"use client"

import { useEffect, useState } from 'react'
import { getWhatsAppStatus, disconnectWhatsApp } from '@/app/actions'

export function DashboardWhatsAppCard() {
  const [status, setStatus] = useState<'CONNECTED' | 'DISCONNECTED' | 'CONNECTING' | 'LOADING'>('LOADING')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [connectedNumber, setConnectedNumber] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState(false)

  const fetchStatus = async () => {
    try {
      const data = await getWhatsAppStatus()
      setStatus(data.status)
      setQrCode(data.qr)
      setConnectedNumber(data.number)
    } catch (error) {
      setStatus('DISCONNECTED')
      setQrCode(null)
      setConnectedNumber(null)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000) // Poll a cada 5 segundos no dashboard
    return () => clearInterval(interval)
  }, [])

  const handleDisconnect = async () => {
    if (!confirm('Deseja realmente desconectar o WhatsApp? As mensagens automáticas e envios manuais serão desativados.')) return
    setLoadingAction(true)
    try {
      await disconnectWhatsApp()
      await fetchStatus()
    } catch (err) {
      alert('Erro ao desconectar WhatsApp.')
    } finally {
      setLoadingAction(false)
    }
  }

  return (
    <div className="bg-white border border-slate-100 rounded-xl p-6 shadow-sm mb-8 animate-fadeIn">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <i className="bi bi-whatsapp text-emerald-500 text-xl"></i>
          Conexão do WhatsApp (CT Nexxus)
        </h2>
        
        {status === 'CONNECTED' && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full border border-emerald-200">
            <span className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse"></span>
            CONECTADO
          </span>
        )}
        {status === 'CONNECTING' && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-[11px] font-bold rounded-full border border-amber-200">
            <span className="h-2 w-2 bg-amber-500 rounded-full animate-pulse"></span>
            AGUARDANDO LEITURA
          </span>
        )}
        {status === 'DISCONNECTED' && (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-700 text-[11px] font-bold rounded-full border border-rose-200">
            <span className="h-2 w-2 bg-rose-500 rounded-full animate-pulse"></span>
            DESCONECTADO
          </span>
        )}
      </div>

      {status === 'LOADING' && (
        <div className="py-8 flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-400 text-xs font-medium">Verificando status de conexão...</p>
        </div>
      )}

      {status === 'CONNECTED' && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-600 text-2xl">
              <i className="bi bi-shield-check"></i>
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">Celular Vinculado com Sucesso</h3>
              <p className="text-slate-400 text-xs mt-0.5 font-medium">
                Número conectado: <strong className="text-slate-700 font-semibold">{connectedNumber || 'Não Identificado'}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={handleDisconnect}
            disabled={loadingAction}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 text-xs font-bold rounded-lg border border-rose-200 hover:border-rose-300 transition-colors shadow-sm"
          >
            {loadingAction ? 'Desconectando...' : 'Desconectar Celular'}
          </button>
        </div>
      )}

      {status === 'CONNECTING' && qrCode && (
        <div className="flex flex-col md:flex-row items-center gap-6 py-2">
          <div className="flex-1">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <i className="bi bi-qr-code-scan text-blue-500"></i>
              Vincular WhatsApp
            </h3>
            <p className="text-slate-500 text-xs mt-2 leading-relaxed">
              Para ativar o envio manual e automático de mensagens e cobranças, siga as instruções:
            </p>
            <ol className="list-decimal list-inside text-slate-600 text-xs mt-3 space-y-2 leading-relaxed font-semibold">
              <li>Abra o WhatsApp no celular do CT.</li>
              <li>Acesse o menu e selecione <strong className="text-slate-800">Aparelhos Conectados</strong>.</li>
              <li>Toque em <strong className="text-slate-800">Conectar um Aparelho</strong>.</li>
              <li>Aponte a câmera para o QR Code ao lado.</li>
            </ol>
          </div>
          <div className="flex flex-col items-center gap-2 p-4 bg-slate-50 border rounded-2xl shadow-inner shrink-0">
            <img src={qrCode} alt="WhatsApp QR Code" className="w-48 h-48 select-none" />
            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 animate-pulse mt-1">
              <i className="bi bi-clock-history"></i>
              Aguardando leitura do código...
            </span>
          </div>
        </div>
      )}

      {status === 'DISCONNECTED' && !qrCode && (
        <div className="py-6 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-2xl shadow-sm">
            <i className="bi bi-x-circle-fill"></i>
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Servidor Desconectado</h3>
            <p className="text-slate-400 text-xs max-w-sm mt-1 leading-relaxed font-medium">
              O servidor de WhatsApp está iniciando na nuvem ou inativo. Aguarde alguns segundos enquanto a conexão é restabelecida...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
