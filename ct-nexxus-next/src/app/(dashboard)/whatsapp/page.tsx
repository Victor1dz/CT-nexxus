"use client"

import { useEffect, useState } from 'react'
import {
  getWhatsAppStatus,
  getWhatsAppTemplates,
  saveWhatsAppTemplates,
  disconnectWhatsApp,
  triggerWhatsAppChecks
} from '@/app/actions'

interface MessageTemplates {
  aulaHoje: string
  lembreteVencimento: string
  mensalidadeAtrasada: string
  confirmacaoPagamento: string
}

export default function WhatsAppPage() {
  const [status, setStatus] = useState<'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'LOADING'>('LOADING')
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [connectedNumber, setConnectedNumber] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState<boolean>(false)
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  
  // State para os templates de mensagem
  const [templates, setTemplates] = useState<MessageTemplates>({
    aulaHoje: '',
    lembreteVencimento: '',
    mensalidadeAtrasada: '',
    confirmacaoPagamento: ''
  })
  const [loadingTemplates, setLoadingTemplates] = useState<boolean>(true)
  const [templatesLoaded, setTemplatesLoaded] = useState<boolean>(false)

  // Função para buscar status do servidor WhatsApp
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

  // Função para buscar os templates do servidor
  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const data = await getWhatsAppTemplates()
      if (data) {
        setTemplates(data)
        setTemplatesLoaded(true)
      }
    } catch (error) {
      console.error('Erro ao buscar templates:', error)
    } finally {
      setLoadingTemplates(false)
    }
  }

  // Polling para status do WhatsApp e carregamento dos templates
  useEffect(() => {
    fetchStatus()
    if (!templatesLoaded) {
      fetchTemplates()
    }
    const interval = setInterval(() => {
      fetchStatus()
      if (!templatesLoaded) {
        fetchTemplates()
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [templatesLoaded])

  // Função para forçar desconexão
  const handleDisconnect = async () => {
    if (!confirm('Deseja realmente desconectar este WhatsApp? A automação será interrompida.')) return
    
    setLoadingAction(true)
    setMessage(null)
    try {
      const data = await disconnectWhatsApp()
      if (data.success) {
        setMessage({ text: 'WhatsApp desconectado com sucesso!', type: 'success' })
        fetchStatus()
      } else {
        setMessage({ text: 'Erro ao desconectar WhatsApp.', type: 'error' })
      }
    } catch (err) {
      setMessage({ text: 'Erro de comunicação com o servidor de automação.', type: 'error' })
    } finally {
      setLoadingAction(false)
    }
  }

  // Função para rodar varredura de testes
  const handleTriggerChecks = async () => {
    setLoadingAction(true)
    setMessage(null)
    try {
      const data = await triggerWhatsAppChecks()
      if (data.success) {
        setMessage({ 
          text: 'Varredura de testes executada! Se o seu WhatsApp estiver conectado, o Paulo receberá os avisos de aula e mensalidades vencidas/pendentes.', 
          type: 'success' 
        })
      } else {
        setMessage({ text: 'Erro ao disparar varredura.', type: 'error' })
      }
    } catch (err) {
      setMessage({ text: 'Erro de comunicação com o servidor de automação.', type: 'error' })
    } finally {
      setLoadingAction(false)
    }
  }

  // Salvar alterações nos templates de mensagem
  const handleSaveTemplates = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingAction(true)
    setMessage(null)
    try {
      const data = await saveWhatsAppTemplates(templates)
      if (data.success) {
        setMessage({ text: 'Modelos de mensagem salvos e atualizados com sucesso!', type: 'success' })
      } else {
        setMessage({ text: 'Erro ao salvar os modelos de mensagem.', type: 'error' })
      }
    } catch (err) {
      setMessage({ text: 'Erro de rede ao salvar os templates.', type: 'error' })
    } finally {
      setLoadingAction(false)
    }
  }

  return (
    <div className="w-full text-slate-800 font-sans max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#2c3e50] flex items-center gap-3">
            <i className="bi bi-whatsapp text-emerald-500"></i> Automação do WhatsApp
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Gerencie a conexão do celular do CT e personalize as mensagens automáticas de alertas.
          </p>
        </div>
      </div>

      {/* Alertas e Mensagens de Retorno */}
      {message && (
        <div className={`p-4 mb-6 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : 'bg-rose-50 border-rose-100 text-rose-800'
        } flex items-center gap-3 shadow-sm animate-fadeIn`}>
          <i className={`bi ${message.type === 'success' ? 'bi-check-circle-fill text-emerald-500' : 'bi-exclamation-circle-fill text-rose-500'} text-lg`}></i>
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Coluna da Esquerda: Status do Dispositivo (Lg: 8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Card de Status */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 flex flex-col items-center text-center">
            <h2 className="text-lg font-bold text-slate-800 mb-6 w-full text-left flex items-center gap-2 pb-2 border-b border-slate-100">
              <i className="bi bi-broadcast text-blue-500"></i> Status do Dispositivo
            </h2>

            {status === 'LOADING' && (
              <div className="py-12 flex flex-col items-center gap-3">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 text-sm font-medium">Verificando serviço...</p>
              </div>
            )}

            {status === 'DISCONNECTED' && !qrCode && (
              <div className="py-8 flex flex-col items-center gap-4 animate-fadeIn">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center text-3xl">
                  <i className="bi bi-x-circle-fill"></i>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">Serviço Desconectado</h3>
                  <p className="text-slate-500 text-sm max-w-sm mt-1">
                    O servidor de WhatsApp está inativo ou desligado. Certifique-se de que o servidor está rodando.
                  </p>
                </div>
              </div>
            )}

            {status === 'CONNECTING' && qrCode && (
              <div className="py-4 flex flex-col items-center gap-6 w-full animate-fadeIn">
                <div className="px-4 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-semibold animate-pulse flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                  Aguardando Leitura do QR Code
                </div>
                
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-inner">
                  <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64 select-none" />
                </div>

                <div className="text-left w-full max-w-md bg-slate-50 p-5 rounded-xl border border-slate-200/60">
                  <h4 className="font-bold text-slate-800 text-sm mb-3">Como Conectar:</h4>
                  <ol className="list-decimal list-inside text-xs text-slate-600 space-y-2">
                    <li>Abra o WhatsApp no seu aparelho celular.</li>
                    <li>Vá em <strong className="text-slate-800">Configurações</strong> &gt; <strong className="text-slate-800">Aparelhos Conectados</strong>.</li>
                    <li>Toque em <strong className="text-slate-800">Conectar um Aparelho</strong>.</li>
                    <li>Aponte a câmera do celular para o QR Code acima.</li>
                  </ol>
                </div>
              </div>
            )}

            {status === 'CONNECTED' && (
              <div className="py-8 flex flex-col items-center gap-6 animate-fadeIn">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center text-4xl shadow-inner relative">
                  <i className="bi bi-check-circle-fill"></i>
                  <span className="absolute bottom-1 right-1 flex h-3.5 w-3.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                  </span>
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-xl">WhatsApp Conectado com Sucesso!</h3>
                  {connectedNumber && (
                    <p className="text-emerald-700 bg-emerald-50 border border-emerald-100 font-semibold px-4 py-1.5 rounded-full text-xs mt-2 inline-block">
                      Número: {connectedNumber}
                    </p>
                  )}
                  <p className="text-slate-400 text-xs mt-3 max-w-md">
                    O sistema está ativo e monitorando pagamentos e aulas. Todas as mensagens serão enviadas automaticamente nos horários programados.
                  </p>
                </div>

                <button
                  onClick={handleDisconnect}
                  disabled={loadingAction}
                  className="mt-4 px-6 py-2.5 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 hover:text-rose-800 font-semibold rounded-xl text-sm transition-all flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <i className="bi bi-box-arrow-left"></i> Desconectar WhatsApp
                </button>
              </div>
            )}
          </div>

          {/* Form de Edição de Templates */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 pb-2 border-b border-slate-100">
              <i className="bi bi-chat-left-text text-emerald-500"></i> Modelos de Mensagens
            </h2>
            
            {loadingTemplates && !templatesLoaded ? (
              <div className="py-8 flex justify-center items-center">
                <span className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></span>
                <span className="ml-2.5 text-xs text-slate-500 font-medium">Carregando modelos...</span>
              </div>
            ) : (
              <form onSubmit={handleSaveTemplates} className="space-y-6">
                
                {/* 1. Aula Hoje */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">
                    Aviso de Aula Hoje (Enviado no dia do treino)
                  </label>
                  <textarea
                    rows={3}
                    value={templates.aulaHoje}
                    onChange={(e) => setTemplates({ ...templates, aulaHoje: e.target.value })}
                    className="w-full p-4 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-y leading-relaxed"
                    required
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1 text-[10px] text-slate-400 font-semibold uppercase">
                    Variáveis: 
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{`{nome}`}</span>
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{`{dia}`}</span>
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{`{modalidade}`}</span>
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{`{horario}`}</span>
                  </div>
                </div>

                {/* 2. Lembrete Vencimento */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">
                    Lembrete de Vencimento Próximo (3, 2, 1 dias antes)
                  </label>
                  <textarea
                    rows={3}
                    value={templates.lembreteVencimento}
                    onChange={(e) => setTemplates({ ...templates, lembreteVencimento: e.target.value })}
                    className="w-full p-4 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-y leading-relaxed"
                    required
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1 text-[10px] text-slate-400 font-semibold uppercase">
                    Variáveis: 
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{`{nome}`}</span>
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{`{competencia}`}</span>
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{`{dias}`}</span>
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{`{vencimento}`}</span>
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{`{valor}`}</span>
                  </div>
                </div>

                {/* 3. Mensalidade Atrasada */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">
                    Cobrança de Mensalidade Atrasada (Inadimplente)
                  </label>
                  <textarea
                    rows={3}
                    value={templates.mensalidadeAtrasada}
                    onChange={(e) => setTemplates({ ...templates, mensalidadeAtrasada: e.target.value })}
                    className="w-full p-4 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-y leading-relaxed"
                    required
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1 text-[10px] text-slate-400 font-semibold uppercase">
                    Variáveis: 
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{`{nome}`}</span>
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{`{competencia}`}</span>
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{`{vencimento}`}</span>
                  </div>
                </div>

                {/* 4. Confirmação Pagamento */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-700">
                    Agradecimento de Confirmação de Pagamento (Instantâneo)
                  </label>
                  <textarea
                    rows={3}
                    value={templates.confirmacaoPagamento}
                    onChange={(e) => setTemplates({ ...templates, confirmacaoPagamento: e.target.value })}
                    className="w-full p-4 text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all resize-y leading-relaxed"
                    required
                  />
                  <div className="flex flex-wrap gap-1.5 mt-1 text-[10px] text-slate-400 font-semibold uppercase">
                    Variáveis: 
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{`{nome}`}</span>
                    <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono">{`{competencia}`}</span>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={loadingAction}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-[#27ae60] text-white font-bold rounded-xl text-sm hover:shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    {loadingAction ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-save2-fill"></i> Salvar Modelos
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Coluna da Direita: Painel de Testes e Informações (Lg: 4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card de Testes */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
              <i className="bi bi-bug text-amber-500"></i> Painel de Testes
            </h2>
            <p className="text-slate-500 text-xs leading-relaxed mb-4">
              Clique neste botão para forçar a verificação manual no banco de dados e simular os avisos agora mesmo.
            </p>
            
            <button
              onClick={handleTriggerChecks}
              disabled={loadingAction || status !== 'CONNECTED'}
              className={`w-full py-3 font-semibold rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-sm ${
                status === 'CONNECTED'
                  ? 'bg-gradient-to-r from-blue-600 to-[#2980b9] text-white hover:shadow-md cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              {loadingAction ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Processando...
                </>
              ) : (
                <>
                  <i className="bi bi-play-circle-fill"></i> Disparar Testes Manuais
                </>
              )}
            </button>

            {status !== 'CONNECTED' && (
              <p className="text-amber-600 font-semibold text-[10px] mt-2 text-center bg-amber-50 p-2 rounded-lg border border-amber-100">
                Ligue seu WhatsApp ao lado primeiro para habilitar o botão de testes.
              </p>
            )}
          </div>

          {/* Card de Guia/Instruções de Teste */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 pb-2 border-b border-slate-100">
              <i className="bi bi-info-circle text-blue-500"></i> Como Testar
            </h2>
            <div className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <div className="p-2.5 bg-blue-50 border border-blue-100 text-blue-800 rounded-lg font-medium">
                <strong>Modo de Segurança Ativo:</strong><br />
                Durante os testes, o robô intercepta as mensagens e <strong>só envia mensagens de verdade para o número do Paulo: (15) 997040121</strong>.
              </div>
              <p>
                Os demais alunos registrados não serão notificados pelo WhatsApp, e suas mensagens simuladas apenas aparecerão no painel de logs do servidor.
              </p>
              <h4 className="font-bold text-slate-800 mt-2">Etapas do Teste:</h4>
              <ul className="list-disc list-inside space-y-1.5">
                <li>Escaneie o QR Code com o <strong>seu</strong> celular pessoal.</li>
                <li>Clique em <strong>Disparar Testes Manuais</strong> acima.</li>
                <li>O Paulo receberá os avisos de Aula Hoje e Mensalidade Vencida no celular dele.</li>
                <li>Para testar a confirmação de pagamento, vá em <strong>Financeiro</strong>, busque por <strong>Paulo</strong>, clique em Pagar e confirme. O Paulo receberá a confirmação de recebimento instantânea no WhatsApp dele!</li>
              </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
