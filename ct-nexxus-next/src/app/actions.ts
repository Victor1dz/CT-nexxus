"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import prisma from "@/lib/prisma"
import { Modalidade, Preco, Horario } from "@/types"

const WPP_URL = process.env.WHATSAPP_SERVER_URL || 'http://127.0.0.1:3001';

export async function getModalidades() {
  try {
    const mods = await prisma.modalidades.findMany({
      orderBy: { nome: 'asc' }
    })
    return mods.map((m: any) => ({
      id: Number(m.id),
      nome: m.nome,
      descricao: m.descricao,
      ativa: m.ativa,
      exigeHorario: m.exige_horario
    }))
  } catch (e) {
    console.error("Erro getModalidades: ", e)
    return []
  }
}

export async function getPrecos(): Promise<Preco[]> {
  try {
    const precos = await prisma.precos.findMany({
      include: {
        modalidades: true
      }
    })
    return precos.map((p: any) => ({
      id: Number(p.id),
      valor: p.valor?.toString() || "0.00",
      descricao: p.descricao,
      frequenciaSemanal: p.frequencia_semanal,
      modalidade: { id: Number(p.modalidades?.id) }
    }))
  } catch (e) {
    console.error("Erro getPrecos: ", e)
    return []
  }
}

export async function getHorarios(): Promise<Horario[]> {
  try {
    const horarios = await prisma.horarios.findMany({
      include: {
        modalidades: true
      }
    })
    return horarios.map((h: any) => ({
      id: Number(h.id),
      diasSemana: h.dias_semana,
      horaInicio: h.hora_inicio ? new Date(h.hora_inicio).toISOString().substring(11, 16) : "",
      horaFim: h.hora_fim ? new Date(h.hora_fim).toISOString().substring(11, 16) : "",
      modalidade: { 
        id: Number(h.modalidades?.id),
        nome: h.modalidades?.nome || ""
      }
    }))
  } catch(e) {
    return []
  }
}

export async function getAlunos() {
  try {
    const alunos = await prisma.alunos.findMany({
      orderBy: { nome: 'asc' },
      include: {
        matriculas: {
          include: {
            modalidades: true
          }
        }
      }
    })
    return alunos
  } catch (error) {
    console.error('Erro ao buscar alunos:', error)
    return []
  }
}

export async function salvarModalidade(formData: FormData) {
  const id = formData.get('id') ? Number(formData.get('id')) : null
  const nome = formData.get('nome') as string
  const descricao = formData.get('descricao') as string
  const ativa = formData.get('ativa') === 'on'
  const exige_horario = formData.get('exige_horario') === 'on'
  const horarios_json = formData.get('horarios_json') as string

  try {
    const dataObj = { nome, descricao, ativa, exige_horario }
    let modalidadeId = id
    if (id) {
      await prisma.modalidades.update({ where: { id }, data: dataObj })
    } else {
      const nova = await prisma.modalidades.create({ data: dataObj })
      modalidadeId = Number(nova.id)
    }

    if (horarios_json && modalidadeId) {
      const submittedHorarios = JSON.parse(horarios_json)
      const submittedIds = submittedHorarios.map((h: any) => h.id).filter(Boolean).map(Number)

      // 1. Delete/Deactivate old schedules that are not in the submitted list (or all of them if exige_horario is true)
      const existingHorarios = await prisma.horarios.findMany({
        where: { modalidade_id: modalidadeId }
      })

      for (const existing of existingHorarios) {
        if (exige_horario || !submittedIds.includes(Number(existing.id))) {
          // Check if referenced by any active matriculas
          const referenced = await prisma.matriculas.findFirst({
            where: { horario_id: existing.id }
          })
          if (referenced) {
            await prisma.horarios.update({
              where: { id: existing.id },
              data: { ativo: false }
            })
          } else {
            await prisma.horarios.delete({
              where: { id: existing.id }
            })
          }
        }
      }

      // 2. Insert or Update submitted schedules (only if not exige_horario)
      if (!exige_horario) {
        for (const h of submittedHorarios) {
          const hora_inicio = h.hora_inicio ? new Date(`1970-01-01T${h.hora_inicio}:00.000Z`) : null
          const hora_fim = h.hora_fim ? new Date(`1970-01-01T${h.hora_fim}:00.000Z`) : null
          const dias_semana = h.dias.join(', ')

          if (h.id) {
            await prisma.horarios.update({
              where: { id: Number(h.id) },
              data: {
                dias_semana,
                hora_inicio,
                hora_fim,
                ativo: true
              }
            })
          } else {
            await prisma.horarios.create({
              data: {
                modalidade_id: modalidadeId,
                dias_semana,
                hora_inicio,
                hora_fim,
                ativo: true
              }
            })
          }
        }
      }
    }

    revalidatePath('/modalidades')
    revalidatePath('/horarios')
    revalidatePath('/alunos', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Erro salvarModalidade:', error)
    return { success: false }
  }
}

export async function getDashboardStats() {
  try {
    const totalAlunos = await prisma.alunos.count({
      where: { ativo: true }
    })

    const now = new Date()
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

    const recebidoAgregado = await prisma.mensalidades.aggregate({
      _sum: { valor: true },
      where: {
        status: 'PAGO',
        data_pagamento: {
          gte: firstDay,
          lte: lastDay
        }
      }
    })

    // Update PENDENTE to INADIMPLENTE if vencimento is in the past
    const hojeLocal = new Date()
    const hojeInicio = new Date(hojeLocal.getFullYear(), hojeLocal.getMonth(), hojeLocal.getDate(), 0, 0, 0)
    
    const mesAtualStr = String(hojeLocal.getMonth() + 1).padStart(2, '0')
    const anoAtualStr = hojeLocal.getFullYear()
    const competenciaAtual = `${anoAtualStr}-${mesAtualStr}`

    // 1. Cleanup past unpaid monthly payments
    await prisma.mensalidades.deleteMany({
      where: {
        status: { not: 'PAGO' },
        competencia: { lt: competenciaAtual }
      }
    })

    // 2. Mark pending overdue as INADIMPLENTE
    await prisma.mensalidades.updateMany({
      where: {
        status: 'PENDENTE',
        vencimento: { lt: hojeInicio }
      },
      data: {
        status: 'INADIMPLENTE'
      }
    })

    const inadimplentesCount = await prisma.mensalidades.count({
      where: {
        status: 'INADIMPLENTE'
      }
    })

    // 3. Compute badges counts & detailed lists
    // financeiroCount: Mensalidades vencidas (INADIMPLENTE) ou que vencem hoje (PENDENTE)
    const financeiroAlerts = await prisma.mensalidades.findMany({
      where: {
        OR: [
          { status: 'INADIMPLENTE' },
          {
            status: 'PENDENTE',
            vencimento: {
              gte: hojeInicio,
              lte: new Date(hojeLocal.getFullYear(), hojeLocal.getMonth(), hojeLocal.getDate(), 23, 59, 59, 999)
            }
          }
        ]
      },
      include: {
        alunos: true,
        matriculas: {
          include: { modalidades: true }
        }
      },
      orderBy: { vencimento: 'asc' }
    })
    const financeiroCount = financeiroAlerts.length

    const financeiroWarnings = financeiroAlerts.map((m: any) => {
      const alunoNome = m.alunos?.nome || 'Aluno'
      const valorStr = Number(m.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
      const statusStr = m.status === 'INADIMPLENTE' ? 'atrasada' : 'vencendo hoje'
      const modNome = m.matriculas?.modalidades?.nome || 'Plano'
      const vencStr = m.vencimento ? new Date(m.vencimento).toLocaleDateString('pt-BR') : ''
      return {
        id: `fin-${m.id}`,
        alunoNome,
        titulo: `${alunoNome} (${modNome})`,
        descricao: `Mensalidade de R$ ${valorStr} ${statusStr} (Venc: ${vencStr})`,
        link: `/financeiro?busca=${encodeURIComponent(alunoNome)}&tab=receitas`
      }
    })

    // Fetch active matriculas
    const diasMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const diaTermo = diasMap[hojeLocal.getDay()]
    const matriculasAtivas = await prisma.matriculas.findMany({
      where: { ativo: true },
      include: {
        horarios: true,
        alunos: true,
        modalidades: true
      }
    })

    // diarioCount: Total de alunos com treino programado no dia de hoje (filtros de dia da semana correspondente)
    const matriculasDoDia = matriculasAtivas.filter((m: any) => {
      const fixo = m.horarios?.dias_semana?.includes(diaTermo)
      const custom = m.dias_personalizados?.includes(diaTermo)
      const livre = m.horario_personalizado?.toLowerCase().includes('livre')
      return fixo || custom || livre
    })
    const diarioCount = matriculasDoDia.length

    // Get presencas for today
    const presencasHoje = await prisma.presenca.findMany({
      where: {
        data: {
          gte: hojeInicio,
          lte: new Date(hojeLocal.getFullYear(), hojeLocal.getMonth(), hojeLocal.getDate(), 23, 59, 59, 999)
        }
      }
    })
    const presencasHojeMap = new Map<number, boolean>()
    presencasHoje.forEach((p: any) => {
      presencasHojeMap.set(Number(p.matricula_id), p.presente)
    })

    const diarioWarnings = matriculasDoDia.map((m: any) => {
      const alunoNome = m.alunos?.nome || 'Aluno'
      const modNome = m.modalidades?.nome || 'Treino'
      const pres = presencasHojeMap.get(Number(m.id))
      
      let statusStr = 'Presença pendente'
      let isPendente = true
      if (pres === true) {
        statusStr = 'Presença: Confirmado (Presente)'
        isPendente = false
      } else if (pres === false) {
        statusStr = 'Presença: Confirmado (Ausente)'
        isPendente = false
      }

      let horaDisplay = 'Livre'
      if (m.horarios?.hora_inicio) {
        horaDisplay = new Date(m.horarios.hora_inicio).toISOString().substring(11, 16)
      } else if (m.horario_personalizado) {
        horaDisplay = m.horario_personalizado.split('|')[1] || m.horario_personalizado
      }

      return {
        id: `dia-${m.id}`,
        alunoNome,
        titulo: `${alunoNome} - ${modNome}`,
        descricao: `${statusStr} hoje às ${horaDisplay}`,
        link: `/diario?busca=${encodeURIComponent(alunoNome)}`,
        pendente: isPendente
      }
    })

    // Sort diarioWarnings so that pending presences appear first
    diarioWarnings.sort((a: any, b: any) => (a.pendente === b.pendente ? 0 : a.pendente ? -1 : 1))

    // agendaCount: Total de lembretes/avisos marcados para hoje + turmas e aulas particulares agendadas para o dia
    const lembretesHoje = await prisma.lembretes.findMany({
      where: {
        data: {
          gte: hojeInicio,
          lte: new Date(hojeLocal.getFullYear(), hojeLocal.getMonth(), hojeLocal.getDate(), 23, 59, 59, 999)
        }
      }
    })
    const lembretesCount = lembretesHoje.length

    const turmasIds = new Set<number>()
    let aulasParticularesCount = 0
    matriculasAtivas.forEach((m: any) => {
      const fixo = m.horarios?.dias_semana?.includes(diaTermo)
      const custom = m.dias_personalizados?.includes(diaTermo)
      if (m.horario_id && fixo) {
        turmasIds.add(Number(m.horario_id))
      } else if (!m.horario_id && custom) {
        aulasParticularesCount++
      }
    })
    const agendaCount = lembretesCount + turmasIds.size + aulasParticularesCount

    const agendaWarnings: any[] = []
    lembretesHoje.forEach((l: any) => {
      agendaWarnings.push({
        id: `lemb-${l.id}`,
        titulo: `📝 Aviso: Lembrete`,
        descricao: l.texto,
        link: `/agenda`
      })
    })

    const distinctHorarioIds = Array.from(turmasIds)
    for (const hId of distinctHorarioIds) {
      const h = await prisma.horarios.findUnique({
        where: { id: hId },
        include: { modalidades: true }
      })
      if (h) {
        const hInicio = h.hora_inicio ? new Date(h.hora_inicio).toISOString().substring(11, 16) : ''
        const hFim = h.hora_fim ? new Date(h.hora_fim).toISOString().substring(11, 16) : ''
        const modNome = h.modalidades?.nome || 'Aula'
        const count = matriculasAtivas.filter((m: any) => Number(m.horario_id) === hId).length
        agendaWarnings.push({
          id: `turma-${hId}`,
          titulo: `👥 Turma: ${modNome}`,
          descricao: `Aula das ${hInicio} às ${hFim} com ${count} aluno(s) agendado(s)`,
          link: `/agenda`
        })
      }
    }

    matriculasAtivas.forEach((m: any) => {
      const custom = m.dias_personalizados?.includes(diaTermo)
      if (!m.horario_id && custom) {
        const alunoNome = m.alunos?.nome || 'Aluno'
        const modNome = m.modalidades?.nome || 'Treino'
        const hInicio = m.hora_inicio_personalizada ? new Date(m.hora_inicio_personalizada).toISOString().substring(11, 16) : ''
        agendaWarnings.push({
          id: `part-${m.id}`,
          titulo: `👤 Particular: ${alunoNome}`,
          descricao: `Aula de ${modNome} agendada para hoje às ${hInicio}`,
          link: `/agenda`
        })
      }
    })

    return {
      totalAlunos,
      receitaMensal: recebidoAgregado._sum.valor ? Number(recebidoAgregado._sum.valor) : 0,
      totalInadimplentes: inadimplentesCount,
      financeiroCount,
      diarioCount,
      agendaCount,
      financeiroWarnings,
      diarioWarnings,
      agendaWarnings
    }
  } catch (error) {
    console.error('Erro ao buscar stats:', error)
    return { 
      totalAlunos: 0, 
      receitaMensal: 0, 
      totalInadimplentes: 0, 
      financeiroCount: 0, 
      diarioCount: 0, 
      agendaCount: 0,
      financeiroWarnings: [],
      diarioWarnings: [],
      agendaWarnings: []
    }
  }
}

export async function getFinanceiroData(mesString?: string) {
  try {
    const now = new Date()
    let year = now.getFullYear()
    let month = now.getMonth()

    if (mesString) {
      const parts = mesString.split('-')
      if (parts.length === 2) {
        year = parseInt(parts[0], 10)
        month = parseInt(parts[1], 10) - 1
      }
    }

    const firstDay = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0))
    const lastDay = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59, 999))

    const hoje = new Date()
    hoje.setUTCHours(0, 0, 0, 0)

    // Atualiza automaticamente as mensalidades vencidas de PENDENTE para INADIMPLENTE.
    // Mensalidades PENDENTE_MANUAL não são alteradas.
    await prisma.mensalidades.updateMany({
      where: {
        status: 'PENDENTE',
        vencimento: { lt: hoje }
      },
      data: {
        status: 'INADIMPLENTE'
      }
    })

    // Reverte automaticamente as mensalidades futuras de INADIMPLENTE para PENDENTE.
    await prisma.mensalidades.updateMany({
      where: {
        status: 'INADIMPLENTE',
        vencimento: { gte: hoje }
      },
      data: {
        status: 'PENDENTE'
      }
    })

    const mensalidades = await prisma.mensalidades.findMany({
      where: {
        vencimento: {
          gte: firstDay,
          lte: lastDay
        }
      },
      include: {
        alunos: true,
        matriculas: {
          include: {
            modalidades: true
          }
        }
      },
      orderBy: { vencimento: 'asc' }
    })

    let despesas = await prisma.despesas.findMany({
      where: {
        data_vencimento: {
          gte: firstDay,
          lte: lastDay
        }
      },
      orderBy: { data_vencimento: 'asc' }
    })

    const defaultCategories = ["Aluguel", "Água", "Luz", "Cartão", "Investimento"]
    const missing = defaultCategories.filter(cat => !despesas.some((d: any) => d.categoria === cat))

    if (missing.length > 0) {
      for (const cat of missing) {
        await prisma.despesas.create({
          data: {
            categoria: cat,
            descricao: `Fixa: ${cat}`,
            data_vencimento: new Date(Date.UTC(year, month, 10)),
            valor: 0,
            status: 'PENDENTE'
          }
        })
      }
      despesas = await prisma.despesas.findMany({
        where: {
          data_vencimento: {
            gte: firstDay,
            lte: lastDay
          }
        },
        orderBy: { data_vencimento: 'asc' }
      })
    }

    let totalEntradas = 0
    mensalidades.forEach((m: any) => {
      if (m.status === 'PAGO' && m.valor) {
        totalEntradas += Number(m.valor)
      }
    })

    let totalSaidas = 0
    despesas.forEach((d: any) => {
      if (d.status === 'PAGO' && d.valor) {
        totalSaidas += Number(d.valor)
      }
    })

    return {
      mensalidades,
      despesas,
      totalEntradas,
      totalSaidas,
      saldo: totalEntradas - totalSaidas,
      mesString: `${year}-${String(month + 1).padStart(2, '0')}`
    }
  } catch (error: any) {
    console.error('Erro ao buscar dados financeiros:', error)
    return {
      mensalidades: [],
      despesas: [],
      totalEntradas: 0,
      totalSaidas: 0,
      saldo: 0,
      mesString: '',
      error: error instanceof Error ? error.stack || error.message : String(error)
    }
  }
}

export async function getPrecosPorModalidade(modalidadeId: number) {
  try {
    const modalidade = await prisma.modalidades.findUnique({
      where: { id: modalidadeId }
    })
    
    if (!modalidade) return null

    const precos = await prisma.precos.findMany({
      where: { modalidade_id: modalidadeId },
      orderBy: { frequencia_semanal: 'asc' }
    })

    return { modalidade, precos }
  } catch (error) {
    console.error('Erro getPrecosPorModalidade:', error)
    return null
  }
}

export async function getDiarioData(dateStr: string, busca?: string) {
  try {
    const dataObj = new Date(dateStr)
    // Offset timezone if needed or just use UTC day to avoid timezone shifts
    const diaNum = dataObj.getUTCDay()
    const diasMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const diaTermo = diasMap[diaNum]

    const matriculas = await prisma.matriculas.findMany({
      where: { ativo: true },
      include: {
        alunos: true,
        horarios: true,
        modalidades: true
      }
    })

    const doDia = matriculas.filter((m: any) => {
      const fixo = m.horarios?.dias_semana?.includes(diaTermo)
      const custom = m.dias_personalizados?.includes(diaTermo)
      const livre = m.horario_personalizado?.toLowerCase().includes('livre')
      
      const ehDoDia = fixo || custom || livre
      if (!ehDoDia) return false
      
      if (busca) {
        return m.alunos?.nome?.toLowerCase().includes(busca.toLowerCase())
      }
      return true
    })

    const presencas = await prisma.presenca.findMany({
      where: {
        data: dataObj
      }
    })
    
    const mapaPresencas: Record<number, boolean> = {}
    presencas.forEach((p: any) => {
      mapaPresencas[Number(p.matricula_id)] = p.presente
    })

    const agrupados: Record<string, any[]> = {}
    doDia.forEach((m: any) => {
      const modNome = m.modalidades?.nome || 'Outros'
      if (!agrupados[modNome]) agrupados[modNome] = []
      
      const serialized = {
        id: Number(m.id),
        aluno_id: m.aluno_id ? Number(m.aluno_id) : null,
        modalidade_id: m.modalidade_id ? Number(m.modalidade_id) : null,
        preco_id: m.preco_id ? Number(m.preco_id) : null,
        horario_id: m.horario_id ? Number(m.horario_id) : null,
        ativo: m.ativo,
        dia_vencimento: m.dia_vencimento,
        dias_personalizados: m.dias_personalizados,
        horario_personalizado: m.horario_personalizado,
        data_inicio: m.data_inicio ? m.data_inicio.toISOString() : null,
        data_fim: m.data_fim ? m.data_fim.toISOString() : null,
        hora_inicio_personalizada: m.hora_inicio_personalizada ? m.hora_inicio_personalizada.toISOString() : null,
        hora_fim_personalizada: m.hora_fim_personalizada ? m.hora_fim_personalizada.toISOString() : null,
        alunos: m.alunos ? {
          id: Number(m.alunos.id),
          nome: m.alunos.nome,
          telefone: m.alunos.telefone,
          ativo: m.alunos.ativo,
          bairro: m.alunos.bairro,
          cep: m.alunos.cep,
          cidade: m.alunos.cidade,
          cpf: m.alunos.cpf,
          email: m.alunos.email,
          logradouro: m.alunos.logradouro,
          numero: m.alunos.numero,
          uf: m.alunos.uf,
          data_cadastro: m.alunos.data_cadastro ? m.alunos.data_cadastro.toISOString() : null,
          data_nascimento: m.alunos.data_nascimento ? m.alunos.data_nascimento.toISOString() : null,
        } : null,
        horarios: m.horarios ? {
          id: Number(m.horarios.id),
          ativo: m.horarios.ativo,
          dias_semana: m.horarios.dias_semana,
          modalidade_id: m.horarios.modalidade_id ? Number(m.horarios.modalidade_id) : null,
          hora_inicio: m.horarios.hora_inicio ? m.horarios.hora_inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : null,
          hora_fim: m.horarios.hora_fim ? m.horarios.hora_fim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : null,
        } : null,
        modalidades: m.modalidades ? {
          id: Number(m.modalidades.id),
          nome: m.modalidades.nome,
          valor: m.modalidades.valor ? Number(m.modalidades.valor) : null
        } : null
      }
      
      agrupados[modNome].push(serialized)
    })

    return { agrupados, mapaPresencas, diaTermo }
  } catch (error) {
    console.error('Erro getDiarioData:', error)
    return { agrupados: {}, mapaPresencas: {}, diaTermo: '' }
  }
}

export async function togglePresenca(matriculaId: number, dateStr: string, presente: boolean) {
  try {
    const dataDate = new Date(dateStr)
    const existing = await prisma.presenca.findFirst({
      where: {
        matricula_id: matriculaId,
        data: dataDate
      }
    })

    if (existing) {
      await prisma.presenca.update({
        where: { id: existing.id },
        data: { presente }
      })
    } else {
      await prisma.presenca.create({
        data: {
          matricula_id: matriculaId,
          data: dataDate,
          presente
        }
      })
    }
    return { success: true }
  } catch (error) {
    console.error('Erro togglePresenca:', error)
    return { success: false }
  }
}

export async function getHorariosEDisponibilidade() {
  try {
    const horarios = await prisma.horarios.findMany({
      include: {
        modalidades: true
      },
      orderBy: { hora_inicio: 'asc' }
    })

    const matriculas = await prisma.matriculas.findMany({
      where: { ativo: true }
    })

    const diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const agrupados: Record<string, any[]> = {}
    const mapaLivres: Record<string, any[]> = {}
    
    diasSemana.forEach(d => { 
      agrupados[d] = []
      mapaLivres[d] = [{ inicio: "06:00", fim: "22:00" }]
    })

    // Subtrair ocupacoes function
    const subtrairIntervalo = (livres: any[], ocupado: any) => {
      const resultado: any[] = []
      const oInicio = new Date(`1970-01-01T${ocupado.inicio}:00Z`).getTime()
      const oFim = new Date(`1970-01-01T${ocupado.fim}:00Z`).getTime()

      for (const livre of livres) {
        const lInicio = new Date(`1970-01-01T${livre.inicio}:00Z`).getTime()
        const lFim = new Date(`1970-01-01T${livre.fim}:00Z`).getTime()

        if (oFim <= lInicio || oInicio >= lFim) {
          resultado.push(livre)
          continue
        }

        if (oInicio > lInicio) {
          const novoLivreFim = new Date(oInicio).toISOString().substr(11, 5)
          resultado.push({ inicio: livre.inicio, fim: novoLivreFim })
        }

        if (oFim < lFim) {
          const novoLivreInicio = new Date(oFim).toISOString().substr(11, 5)
          resultado.push({ inicio: novoLivreInicio, fim: livre.fim })
        }
      }
      return resultado.sort((a, b) => a.inicio.localeCompare(b.inicio))
    }

    const ocupadosMap: Record<string, any[]> = {}
    diasSemana.forEach(d => { ocupadosMap[d] = [] })

    horarios.forEach((h: any) => {
      const dias = h.dias_semana ? h.dias_semana.split(/[\/,]+/).map((d: string) => d.trim()) : []
      dias.forEach((dia: string) => {
        if (agrupados[dia]) {
          agrupados[dia].push(h)
        }
        if (ocupadosMap[dia] && h.hora_inicio && h.hora_fim) {
          const inicio = new Date(h.hora_inicio).toISOString().substr(11, 5)
          const fim = new Date(h.hora_fim).toISOString().substr(11, 5)
          ocupadosMap[dia].push({ inicio, fim })
        }
      })
    })

    matriculas.forEach((m: any) => {
      if (m.hora_inicio_personalizada && m.hora_fim_personalizada) {
        const dias = m.dias_personalizados ? m.dias_personalizados.split(/[\/,]+/).map((d: string) => d.trim()) : (m.horario_personalizado ? m.horario_personalizado.split(/[\/,]+/).map((d: string) => d.trim()) : [])
        dias.forEach((dia: string) => {
          if (ocupadosMap[dia]) {
            const inicio = new Date(m.hora_inicio_personalizada).toISOString().substr(11, 5)
            const fim = new Date(m.hora_fim_personalizada).toISOString().substr(11, 5)
            ocupadosMap[dia].push({ inicio, fim })
          }
        })
      }
    })

    diasSemana.forEach(dia => {
      const ocupados = ocupadosMap[dia]
      if (ocupados.length > 0) {
        for (const ocupado of ocupados) {
          mapaLivres[dia] = subtrairIntervalo(mapaLivres[dia], ocupado)
        }
      }
    })

    return { horarios, agrupados, mapaLivres }
  } catch (error) {
    console.error('Erro getHorarios:', error)
    return { horarios: [], agrupados: {}, mapaLivres: {} }
  }
}

export async function getRelatoriosData() {
  try {
    const mensalidades = await prisma.mensalidades.findMany({
      where: { status: 'PAGO' },
      include: {
        alunos: {
          include: {
            matriculas: {
              where: { ativo: true },
              include: { modalidades: true }
            }
          }
        }
      }
    })

    const receitaMod: Record<string, number> = {}
    mensalidades.forEach((m: any) => {
      let modName = 'Outros'
      if (m.alunos && m.alunos.matriculas && m.alunos.matriculas.length > 0) {
        modName = m.alunos.matriculas[0].modalidades?.nome || 'Outros'
      }
      if (!receitaMod[modName]) receitaMod[modName] = 0
      receitaMod[modName] += Number(m.valor || 0)
    })

    const matriculas = await prisma.matriculas.findMany({
      where: { ativo: true },
      include: { modalidades: true }
    })

    const alunosMod: Record<string, number> = {}
    matriculas.forEach((m: any) => {
      const modName = m.modalidades?.nome || 'Outros'
      if (!alunosMod[modName]) alunosMod[modName] = 0
      alunosMod[modName]++
    })

    const presencas = await prisma.presenca.findMany({
      where: { presente: true }
    })

    const freqDia: Record<string, number> = { 'Seg': 0, 'Ter': 0, 'Qua': 0, 'Qui': 0, 'Sex': 0, 'Sáb': 0, 'Dom': 0 }
    const diasMap = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    presencas.forEach((p: any) => {
      const date = new Date(p.data)
      const dia = diasMap[date.getUTCDay()]
      freqDia[dia]++
    })

    return {
      receitaLabels: Object.keys(receitaMod),
      receitaData: Object.values(receitaMod),
      alunosLabels: Object.keys(alunosMod),
      alunosData: Object.values(alunosMod),
      diasLabels: Object.keys(freqDia),
      diasData: Object.values(freqDia)
    }
  } catch (error) {
    console.error('Erro getRelatoriosData:', error)
    return {
      receitaLabels: [], receitaData: [],
      alunosLabels: [], alunosData: [],
      diasLabels: [], diasData: []
    }
  }
}

export async function salvarAnamnese(formData: FormData) {
  try {
    const aluno_id = Number(formData.get('aluno_id'))
    const anamnese_id_form = formData.get('anamnese_id')
    const anamnese_id = anamnese_id_form && anamnese_id_form !== 'novo' ? Number(anamnese_id_form) : null

    const peso = formData.get('peso') ? Number(formData.get('peso')) : null
    const altura = formData.get('altura') ? Number(formData.get('altura')) : null
    const massa_muscular = formData.get('massa_muscular') ? Number(formData.get('massa_muscular')) : null
    const massa_gorda = formData.get('massa_gorda') ? Number(formData.get('massa_gorda')) : null

    const dobra_biceps = formData.get('dobra_biceps') ? Number(formData.get('dobra_biceps')) * 10 : null
    const dobra_triceps = formData.get('dobra_triceps') ? Number(formData.get('dobra_triceps')) * 10 : null
    const dobra_subescapular = formData.get('dobra_subescapular') ? Number(formData.get('dobra_subescapular')) * 10 : null
    const dobra_suprailiaca = formData.get('dobra_suprailiaca') ? Number(formData.get('dobra_suprailiaca')) * 10 : null
    const dobra_peitoral = formData.get('dobra_peitoral') ? Number(formData.get('dobra_peitoral')) * 10 : null
    const dobra_abdominal = formData.get('dobra_abdominal') ? Number(formData.get('dobra_abdominal')) * 10 : null
    const dobra_coxa = formData.get('dobra_coxa') ? Number(formData.get('dobra_coxa')) * 10 : null
    
    const possui_problema_cardiaco = formData.get('possui_problema_cardiaco') === 'on'
    const detalhe_problema_cardiaco = formData.get('detalhe_problema_cardiaco') as string
    
    const possui_problema_respiratorio = formData.get('possui_problema_respiratorio') === 'on'
    const detalhe_problema_respiratorio = formData.get('detalhe_problema_respiratorio') as string
    
    const toma_medicamento_continuo = formData.get('toma_medicamento_continuo') === 'on'
    const quais_medicamentos = formData.get('quais_medicamentos') as string
    
    const possui_alergia = formData.get('possui_alergia') === 'on'
    const quais_alergias = formData.get('quais_alergias') as string
    
    const fez_cirurgia_recente = formData.get('fez_cirurgia_recente') === 'on'
    const quais_cirurgias = formData.get('quais_cirurgias') as string
    
    const objetivo_principal = formData.get('objetivo_principal') as string
    const frequencia_atividade_fisica = formData.get('frequencia_atividade_fisica') as string
    
    const fuma = formData.get('fuma') === 'on'
    const bebe_alcool = formData.get('bebe_alcool') === 'on'
    const observacoes_gerais = formData.get('observacoes_gerais') as string

    // Cálculo do IMC e análise corporal completa da anamnese
    let imcDetails = ""
    if (peso && altura && altura > 0) {
      const imc = peso / (altura * altura)
      let classificacao = ""
      if (imc < 18.5) classificacao = "Abaixo do peso ideal"
      else if (imc < 25) classificacao = "Peso ideal/Saudável"
      else if (imc < 30) classificacao = "Sobrepeso"
      else classificacao = "Obesidade"
      
      imcDetails = `• <strong>Composição Corporal:</strong> IMC de <strong>${imc.toFixed(1)}</strong> (${classificacao}). Peso: ${peso} kg | Altura: ${altura} m.<br>`
    } else if (peso || altura) {
      imcDetails = `• <strong>Composição Corporal:</strong> ${peso ? `Peso: ${peso} kg` : ''} ${altura ? `| Altura: ${altura} m` : ''}.<br>`
    }

    // Adicionar Massa Muscular, Massa Gorda e Dobras Cutâneas se preenchidos no resumo de IA
    let composicaoFisicaAdicional = ""
    if (massa_muscular || massa_gorda) {
      composicaoFisicaAdicional += `• <strong>Métricas de Composição:</strong> ${massa_muscular ? `Massa Muscular: ${massa_muscular} kg` : ''} ${massa_gorda ? `| Massa Gorda: ${massa_gorda} kg` : ''}.<br>`
    }
    
    let dobrasList = []
    if (dobra_biceps) dobrasList.push(`Bíceps: ${dobra_biceps}mm`)
    if (dobra_triceps) dobrasList.push(`Tríceps: ${dobra_triceps}mm`)
    if (dobra_subescapular) dobrasList.push(`Subescapular: ${dobra_subescapular}mm`)
    if (dobra_suprailiaca) dobrasList.push(`Suprailíaca: ${dobra_suprailiaca}mm`)
    if (dobra_peitoral) dobrasList.push(`Peitoral: ${dobra_peitoral}mm`)
    if (dobra_abdominal) dobrasList.push(`Abdominal: ${dobra_abdominal}mm`)
    if (dobra_coxa) dobrasList.push(`Coxa: ${dobra_coxa}mm`)
    
    if (dobrasList.length > 0) {
      composicaoFisicaAdicional += `• <strong>Dobras Cutâneas:</strong> ${dobrasList.join(', ')}.<br>`
    }

    // Identificação de fatores de risco à saúde
    let habitosList = []
    if (fuma) habitosList.push("Tabagismo (Fumante)")
    if (bebe_alcool) habitosList.push("Consumo de Álcool")

    // AI Suggestions text construction
    let sugestao = ""
    
    // Header Info
    sugestao += `<div class="mb-4">`
    sugestao += `<strong>Foco Principal:</strong> `
    const obj = objetivo_principal ? objetivo_principal.toLowerCase() : ""
    if (obj.includes("emagrecimento") || obj.includes("perder peso")) {
      sugestao += `Queima Calórica e Condicionamento Cardiovascular.</div>`
    } else if (obj.includes("hipertrofia") || obj.includes("massa") || obj.includes("musculo")) {
      sugestao += `Ganho de Massa Muscular, Força e Hipertrofia.</div>`
    } else if (obj.includes("condicionamento")) {
      sugestao += `Resistência Muscular e Condicionamento Geral.</div>`
    } else if (obj.includes("saude")) {
      sugestao += `Melhoria da Qualidade de Vida, Mobilidade e Bem-estar Geral.</div>`
    } else {
      sugestao += `Preparação Específica e Desempenho.</div>`
    }

    // Overview of student details
    sugestao += `<div class="p-3.5 bg-slate-100/80 rounded-xl mb-4 border border-slate-200/50 text-xs text-slate-700">`
    sugestao += `<strong>🔍 Resumo de Análise Corporal & Hábitos:</strong><br>`
    if (imcDetails) sugestao += imcDetails
    if (composicaoFisicaAdicional) sugestao += composicaoFisicaAdicional
    sugestao += `• <strong>Nível de atividade física:</strong> ${frequencia_atividade_fisica || 'Não informado'}.<br>`
    if (habitosList.length > 0) {
      sugestao += `• <strong>Fatores de Estilo de Vida:</strong> ${habitosList.join(', ')} (requer atenção na hidratação e fadiga).<br>`
    } else {
      sugestao += `• <strong>Estilo de Vida:</strong> Bons hábitos reportados (sem tabagismo/álcool).<br>`
    }
    if (observacoes_gerais) {
      sugestao += `• <strong>Notas do Treinador:</strong> "${observacoes_gerais}".`
    }
    sugestao += `</div>`

    // Suggested Structure
    sugestao += `📋 <strong>Estrutura Sugerida de Treino:</strong><br><ul class="pl-4 list-disc mt-1">`
    
    // Warmup
    sugestao += `<li><strong>Aquecimento (10-15min):</strong> `
    if (possui_problema_respiratorio) {
      sugestao += `Mobilidade articular leve e caminhada progressiva. Evitar esforços súbitos para prevenir broncoespasmos.</li>`
    } else if (possui_problema_cardiaco) {
      sugestao += `Aquecimento longo e gradual. Subida lenta da frequência cardíaca. Alongamento dinâmico.</li>`
    } else if (obj.includes("hipertrofia")) {
      sugestao += `Mobilidade geral e aquecimento específico na primeira série (carga leve).</li>`
    } else {
      sugestao += `Pular corda (ritmo leve), polichinelos ou corrida leve + Mobilidade Articular.</li>`
    }

    // Main block
    sugestao += `<li><strong>Bloco Principal (30-40min):</strong> `
    if (possui_problema_cardiaco) {
      sugestao += `Treino contínuo de intensidade moderada (aeróbico/técnico). Manter pausas ativas controladas.</li>`
    } else if (obj.includes("emagrecimento")) {
      sugestao += `Treino intervalado (HIIT) ou circuito funcional de alta intensidade. Foco em repetições e volume de movimento.</li>`
    } else if (obj.includes("hipertrofia")) {
      sugestao += `Treino de força com sobrecarga progressiva. Séries de 8-12 repetições com foco na fase excêntrica e pausas de 1.5 a 2 min.</li>`
    } else {
      sugestao += `Treino misto de técnica (Boxe/Muay Thai/Jiu Jitsu) associado a exercises funcionais de resistência.</li>`
    }

    // Cool down
    sugestao += `<li><strong>Volta à Calma (5-10min):</strong> Alongamentos estáticos gerais e exercícios de respiração diafragmática para regulação cardíaca.</li></ul>`

    // Special Warnings & Cautions
    let cuidados = []
    if (possui_problema_cardiaco) {
      cuidados.push("Monitorar Frequência Cardíaca constante (manter em zona de segurança, evitar picos).")
      cuidados.push("Não treinar se apresentar tontura, palpitações ou dor no peito.")
    }
    if (possui_problema_respiratorio) {
      cuidados.push("Ter sempre broncodilatador de resgate disponível (se prescrito).")
      cuidados.push("Aumentar o tempo de recuperação entre séries intensas.")
    }
    if (fez_cirurgia_recente) {
      cuidados.push(`Evitar exercícios que tensionem a cicatriz ou região operada (${quais_cirurgias || 'cirurgia recente'}).`)
    }
    if (toma_medicamento_continuo) {
      cuidados.push(`Atenção aos efeitos colaterais dos medicamentos relatados (${quais_medicamentos || 'medicamentos'}).`)
    }
    if (fuma) {
      cuidados.push("Menor capacidade de oxigenação. Cuidar com fadiga precoce e regular a respiração.")
    }

    if (cuidados.length > 0) {
      sugestao += `<div class="p-3 bg-amber-50 text-amber-800 rounded-lg mt-3 border border-amber-200">`
      sugestao += `<strong><i class="bi bi-exclamation-triangle"></i> Atenção / Cuidados Especiais:</strong>`
      sugestao += `<ul class="mb-0 mt-1 pl-4 list-disc text-xs">`
      cuidados.forEach(c => {
        sugestao += `<li>${c}</li>`
      })
      sugestao += `</ul></div>`
    }

    // AI Tips
    let dicas = []
    if (frequencia_atividade_fisica && frequencia_atividade_fisica.toLowerCase().includes("sedent")) {
      dicas.push("Aluno iniciante/sedentário. Iniciar com volume baixo de treino, focando na adaptação anatômica nas primeiras 2 semanas.")
    }
    if (peso && altura && altura > 0) {
      const imc = peso / (altura * altura)
      if (imc >= 30) {
        dicas.push("Foco em exercícios de baixo impacto articular (evitar saltos excessivos iniciais) para proteger joelhos e tornozelos.")
      }
    }
    if (possui_alergia) {
      dicas.push(`Alergia reportada (${quais_alergias || 'alergias'}). Evitar contato com substâncias desencadeantes no espaço de treino.`)
    }

    if (dicas.length > 0) {
      sugestao += `<div class="mt-3 text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs">`
      sugestao += `<strong><i class="bi bi-lightbulb-fill"></i> Dica da IA:</strong>`
      sugestao += `<ul class="mb-0 mt-1 pl-4 list-disc">`
      dicas.forEach(d => {
        sugestao += `<li><em>${d}</em></li>`
      })
      sugestao += `</ul></div>`
    }

    const data_atualizacao_form = formData.get('data_atualizacao') as string
    const data_atualizacao = data_atualizacao_form ? new Date(data_atualizacao_form) : new Date()

    const dataObj = {
      aluno_id,
      peso, altura,
      massa_muscular,
      massa_gorda,
      dobra_biceps,
      dobra_triceps,
      dobra_subescapular,
      dobra_suprailiaca,
      dobra_peitoral,
      dobra_abdominal,
      dobra_coxa,
      possui_problema_cardiaco, detalhe_problema_cardiaco,
      possui_problema_respiratorio, detalhe_problema_respiratorio,
      toma_medicamento_continuo, quais_medicamentos,
      possui_alergia, quais_alergias,
      fez_cirurgia_recente, quais_cirurgias,
      objetivo_principal, frequencia_atividade_fisica,
      fuma, bebe_alcool, observacoes_gerais,
      sugestao_treino_gerada: sugestao,
      data_atualizacao
    }

    if (anamnese_id) {
      await prisma.anamneses.update({ where: { id: anamnese_id }, data: dataObj })
    } else {
      await prisma.anamneses.create({ data: dataObj })
    }

    revalidatePath(`/alunos/${aluno_id}/anamnese`)
    return { success: true }
  } catch (error) {
    console.error('Erro salvarAnamnese:', error)
    return { success: false }
  }
}

export async function salvarPreco(formData: FormData) {
  try {
    const id = formData.get('id') ? Number(formData.get('id')) : null
    const modalidade_id = Number(formData.get('modalidade_id'))
    const frequencia_semanal = Number(formData.get('frequencia_semanal'))
    const valorStr = formData.get('valor') as string
    const valor = parseFloat(valorStr.replace(',', '.'))
    const descricao = formData.get('descricao') as string

    if (id) {
      await prisma.precos.update({
        where: { id },
        data: { modalidade_id, frequencia_semanal, valor, descricao }
      })
    } else {
      await prisma.precos.create({
        data: { modalidade_id, frequencia_semanal, valor, descricao }
      })
    }
    revalidatePath(`/precos/modalidade/${modalidade_id}`)
    revalidatePath('/alunos', 'layout')
    return { success: true, modalidade_id }
  } catch (error) {
    console.error('Erro salvarPreco:', error)
    return { success: false, error }
  }
}

export async function excluirPreco(formData: FormData) {
  try {
    const id = Number(formData.get('id'))
    await prisma.precos.delete({ where: { id } })
    revalidatePath('/precos', 'layout')
    revalidatePath('/alunos', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Erro excluirPreco:', error)
    return { success: false }
  }
}

export async function bloquearVagaLivre(formData: FormData) {
  try {
    const diaAbrev = formData.get('diaAbrev') as string
    const inicioStr = formData.get('inicio') as string
    const fimStr = formData.get('fim') as string

    const dataObj = {
      dias_semana: diaAbrev,
      hora_inicio: new Date(`1970-01-01T${inicioStr}:00.000Z`),
      hora_fim: new Date(`1970-01-01T${fimStr}:00.000Z`),
      ativo: true
    }

    await prisma.horarios.create({ data: dataObj })
    revalidatePath('/horarios')
    revalidatePath('/alunos', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Erro bloquearVagaLivre:', error)
    return { success: false }
  }
}

export async function salvarHorario(formData: FormData) {
  try {
    const id = formData.get('id') ? Number(formData.get('id')) : null
    const modalidade_id = formData.get('modalidade_id') ? Number(formData.get('modalidade_id')) : null
    
    // Pegar checkboxes de dias marcados (pode vir como array dependendo de como o NextFormData lida)
    const diasArray = formData.getAll('dias_semana') as string[]
    const dias_semana = diasArray.join(', ')

    const inicioStr = formData.get('hora_inicio') as string
    const fimStr = formData.get('hora_fim') as string

    const hora_inicio = inicioStr ? new Date(`1970-01-01T${inicioStr}:00.000Z`) : null
    const hora_fim = fimStr ? new Date(`1970-01-01T${fimStr}:00.000Z`) : null
    const ativo = formData.get('ativo') === 'on'

    const dataObj = { modalidade_id, dias_semana, hora_inicio, hora_fim, ativo }

    if (id) {
      await prisma.horarios.update({ where: { id }, data: dataObj })
    } else {
      await prisma.horarios.create({ data: dataObj })
    }
    revalidatePath('/horarios')
    revalidatePath('/alunos', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Erro salvarHorario:', error)
    return { success: false }
  }
}

export async function excluirHorario(formData: FormData) {
  try {
    const id = Number(formData.get('id'))
    await prisma.horarios.delete({ where: { id } })
    revalidatePath('/horarios')
    revalidatePath('/alunos', 'layout')
    return { success: true }
  } catch (error) {
    console.error('Erro excluirHorario:', error)
    return { success: false }
  }
}

export async function atualizarStatusMensalidade(formData: FormData) {
  const fs = require('fs')
  const path = require('path')
  const logFile = path.join(process.cwd(), 'actions-debug.log')
  const log = (msg: string) => {
    console.log(`[atualizarStatusMensalidade] ${msg}`)
    try {
      fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`, 'utf8')
    } catch (e) {}
  }


  log('--- ATUALIZAR STATUS MENSALIDADE INICIADA ---')
  try {
    const id = Number(formData.get('id'))
    const status = formData.get('status') as string
    const forma_pagamento = formData.get('forma') as string
    log(`Parâmetros: id=${id}, status=${status}, forma_pagamento=${forma_pagamento}`)

    if (status === 'PAGO') {
      log('Atualizando para PAGO no banco de dados...')
      const currentMensalidade = await prisma.mensalidades.update({
        where: { id },
        data: {
          status: 'PAGO',
          data_pagamento: new Date(),
          forma_pagamento: forma_pagamento || 'NÃO INFORMADO'
        },
        include: { matriculas: true }
      })
      log(`Banco atualizado com sucesso. aluno_id=${currentMensalidade.aluno_id}, matricula_id=${currentMensalidade.matricula_id}`)

      // Buscar aluno via aluno_id da mensalidade ou via matrícula associada
      const targetAlunoId = currentMensalidade.aluno_id || currentMensalidade.matriculas?.aluno_id
      log(`targetAlunoId resolvido: ${targetAlunoId}`)
      
      if (targetAlunoId) {
        try {
          const templatesPath = path.join(process.cwd(), 'whatsapp-templates.json')
          let templates = {
            confirmacaoPagamento: "Obrigado, {nome}! Confirmamos o recebimento do pagamento da sua mensalidade referente a {competencia}. Bom treino!\n\n💵 *Formas de Pagamento:*\n• Pix: ctnexxus@gmail.com 📱\n• Dinheiro 💵\n• Cartão 💳"
          }

          if (fs.existsSync(templatesPath)) {
            const fileData = fs.readFileSync(templatesPath, 'utf8')
            templates = JSON.parse(fileData)
            log('Templates de WhatsApp carregados do JSON.')
          } else {
            log('Arquivo de templates não encontrado. Usando default.')
          }

          const aluno = await prisma.alunos.findUnique({
            where: { id: targetAlunoId }
          })
          log(`Aluno consultado: ${aluno ? aluno.nome : 'NULO'}, telefone: ${aluno ? aluno.telefone : 'NULO'}`)

          if (aluno && aluno.telefone) {
            const compStr = currentMensalidade.competencia || ''
            const msg = templates.confirmacaoPagamento
              .replace('{nome}', aluno.nome || 'Aluno')
              .replace('{competencia}', compStr)
            
            fetch(`${WPP_URL}/send`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ phone: aluno.telefone, message: msg })
            })
            .then(async (response) => {
              if (response.ok) {
                const data = await response.json();
                log(`Servidor WhatsApp respondeu com sucesso: ${JSON.stringify(data)}`);
              } else {
                log(`Servidor WhatsApp respondeu com erro HTTP ${response.status}: ${response.statusText}`);
              }
            })
            .catch((err) => {
              log(`Erro ao enviar mensagem em background: ${err.message || err}`);
            });
          } else {
            log('Envio cancelado: Aluno ou telefone nulo.')
          }
        } catch (err: any) {
          log(`Erro interno no fluxo do WhatsApp: ${err.message || err}`)
        }
      } else {
        log('Envio cancelado: targetAlunoId é nulo.')
      }

      // Gerar próxima mensalidade se a matrícula e o aluno estiverem ativos
      log('Verificando se precisa gerar próxima mensalidade...')
      const matriculaDb = await prisma.matriculas.findUnique({
        where: { id: currentMensalidade.matricula_id || 0 },
        include: { alunos: true }
      })

      if (matriculaDb?.ativo && matriculaDb?.alunos?.ativo && currentMensalidade.competencia) {
        const [anoStr, mesStr] = currentMensalidade.competencia.split('-')
        if (anoStr && mesStr) {
          let proxMes = parseInt(mesStr) + 1
          let proxAno = parseInt(anoStr)
          if (proxMes > 12) {
            proxMes = 1
            proxAno += 1
          }
          const proxCompetencia = `${proxAno}-${String(proxMes).padStart(2, '0')}`
          
          const existeProx = await prisma.mensalidades.findFirst({
            where: {
              matricula_id: currentMensalidade.matricula_id,
              competencia: proxCompetencia
            }
          })

          if (!existeProx) {
            const diaVenc = matriculaDb.dia_vencimento || (currentMensalidade.vencimento ? new Date(currentMensalidade.vencimento).getUTCDate() : new Date().getDate())
            const proxVenc = new Date(Date.UTC(proxAno, proxMes - 1, diaVenc))
            await prisma.mensalidades.create({
              data: {
                matricula_id: currentMensalidade.matricula_id,
                aluno_id: currentMensalidade.aluno_id,
                competencia: proxCompetencia,
                valor: currentMensalidade.valor,
                vencimento: proxVenc,
                status: 'PENDENTE'
              }
            })
            log(`Próxima mensalidade gerada para competência ${proxCompetencia}`)
          } else {
            log(`Próxima mensalidade para competência ${proxCompetencia} já existe.`)
          }
        }
      }
    } else {
      log('Status diferente de PAGO. Atualizando registro no banco...')
      let finalStatus = status
      if (status === 'PENDENTE') {
        const current = await prisma.mensalidades.findUnique({ where: { id } })
        if (current && current.vencimento) {
          const hoje = new Date()
          hoje.setUTCHours(0, 0, 0, 0)
          
          const venc = new Date(current.vencimento)
          venc.setUTCHours(0, 0, 0, 0)

          if (venc < hoje) {
            finalStatus = 'PENDENTE_MANUAL'
          }
        }
      }

      await prisma.mensalidades.update({
        where: { id },
        data: {
          status: finalStatus,
          data_pagamento: null,
          forma_pagamento: null
        }
      })
      log(`Registro atualizado com status ${finalStatus}`)
    }
    
    log('atualizarStatusMensalidade finalizada com sucesso.')
    revalidatePath('/financeiro')
    return { success: true }
  } catch (error: any) {
    log(`Erro fatal em atualizarStatusMensalidade: ${error.message || error}`)
    console.error('Erro atualizarStatusMensalidade:', error)
    return { success: false }
  }
}

export async function atualizarStatusDespesa(formData: FormData) {
  try {
    const id = Number(formData.get('id'))
    const status = formData.get('status') as string

    if (status === 'PAGO') {
      await prisma.despesas.update({
        where: { id },
        data: {
          status: 'PAGO',
          data_pagamento: new Date()
        }
      })
    } else {
      await prisma.despesas.update({
        where: { id },
        data: {
          status: 'PENDENTE',
          data_pagamento: null
        }
      })
    }
    
    revalidatePath('/financeiro')
    return { success: true }
  } catch (error) {
    console.error('Erro atualizarStatusDespesa:', error)
    return { success: false }
  }
}

export async function excluirDespesa(formData: FormData) {
  try {
    const id = Number(formData.get('id'))
    await prisma.despesas.delete({ where: { id } })
    revalidatePath('/financeiro')
    return { success: true }
  } catch (error) {
    console.error('Erro excluirDespesa:', error)
    return { success: false }
  }
}

export async function gerarMensalidadesLote(mesString?: string) {
  try {
    const matriculasAtivas = await prisma.matriculas.findMany({
      where: { 
        ativo: true,
        alunos: {
          ativo: true
        }
      }
    })
    
    for (const m of matriculasAtivas) {
      await sincronizarMensalidadesDaMatricula(m.id)
    }

    revalidatePath('/financeiro')
    return { success: true }
  } catch (e) {
    console.error(e)
    return { success: false }
  }
}

export async function salvarDespesa(formData: FormData) {
  try {
    const id = formData.get('id') ? Number(formData.get('id')) : null
    const categoria = formData.get('categoria') as string
    const descricao = formData.get('descricao') as string
    const data_vencimento = new Date(formData.get('data_vencimento') as string)
    const valor = Number(formData.get('valor'))
    const status = formData.get('status') as string

    const dataObj = {
      categoria,
      descricao,
      data_vencimento,
      valor,
      status,
      data_pagamento: status === 'PAGO' ? new Date() : null
    }

    if (id) {
      await prisma.despesas.update({ where: { id }, data: dataObj })
    } else {
      await prisma.despesas.create({ data: dataObj })
    }
  } catch (error) {
    console.error('Erro salvarDespesa:', error)
    return { success: false }
  }
  revalidatePath('/financeiro')
  redirect('/financeiro?tab=despesas')
}
export async function salvarNovoAluno(formData: FormData) {
  try {
    const aluno_id_form = formData.get('aluno_id')
    const aluno_id = aluno_id_form ? Number(aluno_id_form) : null
    const nome = (formData.get('nome') as string)?.trim() || null
    const telefone = (formData.get('telefone') as string)?.trim() || null
    const cpf = (formData.get('cpf') as string)?.trim() || null
    const cep = (formData.get('cep') as string)?.trim() || null
    const logradouro = (formData.get('logradouro') as string)?.trim() || null
    const numero = (formData.get('numero') as string)?.trim() || null
    const bairro = (formData.get('bairro') as string)?.trim() || null
    const city = (formData.get('cidade') as string)?.trim() || null
    const uf = (formData.get('uf') as string)?.trim() || null
    const data_cadastro_form = formData.get('data_cadastro') as string
    const data_cadastro = data_cadastro_form ? new Date(data_cadastro_form + 'T12:00:00') : new Date()
    const blocksJson = formData.get('blocks_json') as string
    const ativo = formData.get('ativo') !== 'off'

    // 1. Create or Update Aluno
    let aluno;
    const alunoData = { nome, telefone, cpf, cep, logradouro, numero, bairro, cidade: city, uf, ativo, data_cadastro }
    
    if (aluno_id) {
      aluno = await prisma.alunos.update({
        where: { id: aluno_id },
        data: alunoData
      })
      
      if (!ativo) {
        // Aluno inativado: desativar todas as suas matriculas
        await prisma.matriculas.updateMany({
          where: { aluno_id: aluno.id },
          data: { ativo: false, data_fim: new Date() }
        })
        
        // Limpar mensalidades futuras (competencia > atual) que nao foram pagas
        const hoje = new Date()
        const mesAtualStr = String(hoje.getMonth() + 1).padStart(2, '0')
        const anoAtualStr = hoje.getFullYear()
        const competenciaAtual = `${anoAtualStr}-${mesAtualStr}`

        await prisma.mensalidades.deleteMany({
          where: {
            aluno_id: aluno.id,
            status: { not: 'PAGO' },
            competencia: { gt: competenciaAtual }
          }
        })
      }
    } else {
      aluno = await prisma.alunos.create({
        data: alunoData
      })
    }

    // 2. Process blocks
    if (blocksJson) {
      const blocks = JSON.parse(blocksJson)
      
      const incomingMatriculaIds = blocks.filter((b: any) => b.matricula_id).map((b: any) => Number(b.matricula_id))
      if (aluno_id) {
        const removedMatriculas = await prisma.matriculas.findMany({
          where: {
            aluno_id: aluno.id,
            id: { notIn: incomingMatriculaIds }
          },
          select: { id: true }
        })

        const removedIds = removedMatriculas.map((m: any) => m.id)

        if (removedIds.length > 0) {
          // Excluir as mensalidades vinculadas
          await prisma.mensalidades.deleteMany({
            where: { matricula_id: { in: removedIds } }
          })
          
          // Excluir as presenças vinculadas
          await prisma.presenca.deleteMany({
            where: { matricula_id: { in: removedIds } }
          })

          // Finalmente excluir a matricula
          await prisma.matriculas.deleteMany({
            where: { id: { in: removedIds } }
          })
        }
      }

      for (const block of blocks) {
        if (!block.selectedMod) continue;
        
        let customDiasStr = block.customDias.join(', ')
        let horarioPersonalizado = null
        if (block.isCustomHorario && customDiasStr) {
          const hInicio = block.customHoraInicio || ''
          const hFim = block.customHoraFim || ''
          if (hInicio || hFim) {
            horarioPersonalizado = `${hInicio} - ${hFim}`
          } else {
            horarioPersonalizado = "Livre"
          }
        }

        // Prepare matricula
        const dataInicio = block.data_inicio ? new Date(block.data_inicio + 'T12:00:00') : new Date()
        const dataFim = new Date(dataInicio)
        dataFim.setMonth(dataFim.getMonth() + 1)
        const diaVencimento = dataInicio.getDate()

        const matriculaData: any = {
          aluno_id: aluno.id,
          modalidade_id: Number(block.selectedMod),
          preco_id: block.selectedPreco ? Number(block.selectedPreco) : null,
          ativo: block.ativo ?? true,
          horario_id: null,
          dias_personalizados: null,
          horario_personalizado: null,
          hora_inicio_personalizada: null,
          hora_fim_personalizada: null,
          data_inicio: dataInicio,
          data_fim: block.ativo === false ? new Date() : dataFim,
          dia_vencimento: diaVencimento
        }

        if (block.isCustomHorario) {
          matriculaData.dias_personalizados = customDiasStr
          matriculaData.horario_personalizado = horarioPersonalizado
          if (block.customHoraInicio) matriculaData.hora_inicio_personalizada = new Date(`1970-01-01T${block.customHoraInicio}:00Z`)
          if (block.customHoraFim) matriculaData.hora_fim_personalizada = new Date(`1970-01-01T${block.customHoraFim}:00Z`)
        } else if (block.selectedHorario) {
          matriculaData.horario_id = Number(block.selectedHorario)
        }

        if (block.matricula_id) {
          // Se foi desativado agora, registrar data_fim e apagar mensalidades futuras não pagas
          if (block.ativo === false) {
             matriculaData.data_fim = new Date()
             
             const hoje = new Date()
             const mesAtualStr = String(hoje.getMonth() + 1).padStart(2, '0')
             const anoAtualStr = hoje.getFullYear()
             const competenciaAtual = `${anoAtualStr}-${mesAtualStr}`
             
             await prisma.mensalidades.deleteMany({
               where: {
                 matricula_id: Number(block.matricula_id),
                 status: { not: 'PAGO' },
                 competencia: { gt: competenciaAtual }
               }
             })
          }
          const updatedMatricula = await prisma.matriculas.update({
            where: { id: Number(block.matricula_id) },
            data: matriculaData
          })
          await sincronizarMensalidadesDaMatricula(updatedMatricula.id)
        } else {
          const novaMatricula = await prisma.matriculas.create({
            data: matriculaData
          })
          await sincronizarMensalidadesDaMatricula(novaMatricula.id)
        }
      }
    }
  } catch (error) {
    console.error('Erro salvarNovoAluno:', error)
    return { success: false }
  }
  revalidatePath('/alunos')
  redirect('/alunos')
}

export async function excluirAluno(id: number) {
  try {
    // Apaga dependencias
    await prisma.treinos_dia.deleteMany({
      where: { fichas_treino: { aluno_id: id } }
    })
    await prisma.fichas_treino.deleteMany({ where: { aluno_id: id } })
    await prisma.mensalidades.deleteMany({ where: { aluno_id: id } })
    await prisma.presenca.deleteMany({ where: { matriculas: { aluno_id: id } } })
    await prisma.matriculas.deleteMany({ where: { aluno_id: id } })
    await prisma.anamneses.deleteMany({ where: { aluno_id: id } })
    
    // Apaga o aluno
    await prisma.alunos.delete({ where: { id } })
  } catch (e) {
    console.error(e)
    return { success: false }
  }
  revalidatePath('/alunos')
  redirect('/alunos')
}

export async function salvarFichaTreino(formData: FormData) {
  try {
    const aluno_id = Number(formData.get('aluno_id'))
    const ficha_id = formData.get('ficha_id') ? Number(formData.get('ficha_id')) : null
    const objetivo_ficha_input = formData.get('objetivo_ficha') as string
    const mes_referencia = formData.get('mes_referencia') as string
    const objetivo_ficha = mes_referencia ? `${mes_referencia} - ${objetivo_ficha_input}` : objetivo_ficha_input
    const observacoesia = formData.get('observacoesia') as string
    const ativa = formData.get('ativa') === 'on'
    const treinosJson = formData.get('treinos_json') as string
    const data_criacao_form = formData.get('data_criacao') as string
    const data_criacao = data_criacao_form ? new Date(data_criacao_form + 'T12:00:00') : new Date()

    let fichaIdToUse = ficha_id

    if (fichaIdToUse) {
      await prisma.fichas_treino.update({
        where: { id: fichaIdToUse },
        data: { 
          objetivo_ficha, 
          observacoesia, 
          ativa,
          data_criacao,
          data_inicio: data_criacao
        }
      })
      // Clear old treinos to insert new ones
      await prisma.treinos_dia.deleteMany({
        where: { ficha_treino_id: fichaIdToUse }
      })
    } else {
      const novaFicha = await prisma.fichas_treino.create({
        data: {
          aluno_id,
          objetivo_ficha,
          observacoesia,
          ativa,
          data_criacao: data_criacao,
          data_inicio: data_criacao
        }
      })
      fichaIdToUse = Number(novaFicha.id)
    }

    if (treinosJson && fichaIdToUse) {
      const treinos = JSON.parse(treinosJson)
      for (const t of treinos) {
        await prisma.treinos_dia.create({
          data: {
            ficha_treino_id: fichaIdToUse,
            dia_semana: t.dia_semana,
            foco_do_dia: t.foco_do_dia,
            descricao_exercicios: t.descricao_exercicios
          }
        })
      }
    }
  } catch (error) {
    console.error('Erro salvarFichaTreino:', error)
  }
  revalidatePath('/fichas/aluno/[id]', 'page')
}

export async function excluirFichaTreino(formData: FormData) {
  try {
    const ficha_id = Number(formData.get('ficha_id'))
    await prisma.treinos_dia.deleteMany({ where: { ficha_treino_id: ficha_id } })
    await prisma.fichas_treino.delete({ where: { id: ficha_id } })
  } catch (error) {
    console.error('Erro excluirFichaTreino:', error)
  }
  revalidatePath('/fichas/aluno/[id]', 'page')
}

export async function salvarLembrete(formData: FormData) {
  try {
    const id = formData.get('id') ? Number(formData.get('id')) : null
    const dataStr = formData.get('data') as string
    const texto = formData.get('texto') as string
    const cor = formData.get('cor') as string

    const dataObj = new Date(dataStr + 'T12:00:00') // avoid timezone shift

    if (id) {
      await prisma.lembretes.update({
        where: { id },
        data: {
          data: dataObj,
          texto,
          cor
        }
      })
    } else {
      await prisma.lembretes.create({
        data: {
          data: dataObj,
          texto,
          cor
        }
      })
    }
    revalidatePath('/agenda')
    return { success: true }
  } catch (e) {
    console.error(e)
    return { success: false }
  }
}

export async function excluirLembrete(formData: FormData) {
  try {
    const id = Number(formData.get('id'))
    await prisma.lembretes.delete({ where: { id } })
    revalidatePath('/agenda')
    return { success: true }
  } catch (e) {
    console.error(e)
    return { success: false }
  }
}

export async function excluirAnamnese(id: number) {
  try {
    await prisma.anamneses.delete({
      where: { id }
    })
    return { success: true }
  } catch (error) {
    console.error('Erro ao excluir anamnese:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function getFichaTreinoAtivaDoAluno(alunoId: number) {
  try {
    const ficha = await prisma.fichas_treino.findFirst({
      where: { aluno_id: alunoId, ativa: true },
      include: { treinos_dia: true }
    })
    
    if (!ficha) return null;

    return {
      id: Number(ficha.id),
      aluno_id: Number(ficha.aluno_id),
      ativa: ficha.ativa,
      data_criacao: ficha.data_criacao ? ficha.data_criacao.toISOString() : null,
      objetivo_ficha: ficha.objetivo_ficha,
      observacoesia: ficha.observacoesia,
      treinos_dia: ficha.treinos_dia.map((t: any) => ({
        id: Number(t.id),
        ficha_treino_id: Number(t.ficha_treino_id),
        dia_semana: t.dia_semana,
        foco_do_dia: t.foco_do_dia,
        descricao_exercicios: t.descricao_exercicios
      }))
    }
  } catch (error) {
    console.error('Erro ao buscar ficha ativa do aluno:', error)
    return null
  }
}

export async function salvarDescricaoExercicioDoTreino(treinoId: number, descricao: string) {
  try {
    await prisma.treinos_dia.update({
      where: { id: treinoId },
      data: { descricao_exercicios: descricao }
    })
    return { success: true }
  } catch (error) {
    console.error('Erro salvarDescricaoExercicioDoTreino:', error)
    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

export async function getHistoricoPresencaDoAluno(alunoId: number) {
  try {
    const presencas = await prisma.presenca.findMany({
      where: {
        matriculas: {
          aluno_id: alunoId
        }
      },
      include: {
        matriculas: {
          include: {
            modalidades: true
          }
        }
      },
      orderBy: {
        data: 'desc'
      }
    })

    return presencas.map((p: any) => ({
      id: Number(p.id),
      data: p.data.toISOString().split('T')[0],
      presente: p.presente,
      observacao: p.observacao,
      modalidade: p.matriculas?.modalidades?.nome || 'Treino'
    }))
  } catch (error) {
    console.error('Erro getHistoricoPresencaDoAluno:', error)
    return []
  }
}

export async function sincronizarMensalidadesDaMatricula(matriculaId: number) {
  try {
    const m = await prisma.matriculas.findUnique({
      where: { id: matriculaId },
      include: { precos: true, alunos: true }
    })
    if (!m || !m.ativo || !m.alunos?.ativo || !m.preco_id || !m.precos?.valor) {
      return
    }

    const dataInicio = m.data_inicio || new Date()
    const hoje = new Date()

    const mesAtualStr = String(hoje.getMonth() + 1).padStart(2, '0')
    const anoAtualStr = hoje.getFullYear()
    const competenciaAtual = `${anoAtualStr}-${mesAtualStr}`

    // Cleanup past unpaid monthly payments for this matricula
    await prisma.mensalidades.deleteMany({
      where: {
        matricula_id: m.id,
        status: { not: 'PAGO' },
        competencia: { lt: competenciaAtual }
      }
    })
    
    // Iterar mes a mes a partir de dataInicio ate hoje + 1 mes, mas nunca antes do mes atual
    const primeiroDiaMesAtual = new Date(Date.UTC(hoje.getFullYear(), hoje.getMonth(), 1, 12, 0, 0))
    let iterDate = new Date(Date.UTC(dataInicio.getUTCFullYear(), dataInicio.getUTCMonth(), 1, 12, 0, 0))
    if (iterDate < primeiroDiaMesAtual) {
      iterDate = primeiroDiaMesAtual
    }

    const endDate = new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth() + 1, 1, 12, 0, 0))

    while (iterDate <= endDate) {
      const year = iterDate.getUTCFullYear()
      const month = iterDate.getUTCMonth()
      const competencia = `${year}-${String(month + 1).padStart(2, '0')}`

      const existe = await prisma.mensalidades.findFirst({
        where: {
          matricula_id: m.id,
          competencia: competencia
        }
      })

      if (!existe) {
        let diaVenc = m.dia_vencimento || dataInicio.getUTCDate() || 10
        let vencimento = new Date(Date.UTC(year, month, diaVenc, 12, 0, 0))
        
        const compDate = new Date()
        compDate.setUTCHours(0, 0, 0, 0)
        
        const vencComp = new Date(vencimento)
        vencComp.setUTCHours(0, 0, 0, 0)

        let statusInicial = 'PENDENTE'
        if (vencComp < compDate) {
          statusInicial = 'INADIMPLENTE'
        }

        await prisma.mensalidades.create({
          data: {
            matricula_id: m.id,
            aluno_id: m.aluno_id,
            competencia: competencia,
            valor: m.precos.valor,
            vencimento: vencimento,
            status: statusInicial
          }
        })
      }
      iterDate.setUTCMonth(iterDate.getUTCMonth() + 1)
    }
  } catch (error) {
    console.error('Erro sincronizarMensalidadesDaMatricula:', error)
  }
}

export async function getWhatsAppStatus() {
  try {
    const res = await fetch(`${WPP_URL}/status`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return await res.json()
  } catch (err: any) {
    console.error('Error in getWhatsAppStatus:', err.message || err)
    return { status: 'DISCONNECTED', qr: null, number: null }
  }
}

export async function getWhatsAppTemplates() {
  try {
    const res = await fetch(`${WPP_URL}/templates`, { cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return await res.json()
  } catch (err: any) {
    console.error('Error in getWhatsAppTemplates:', err.message || err)
    return null
  }
}

export async function saveWhatsAppTemplates(templates: any) {
  try {
    const res = await fetch(`${WPP_URL}/templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templates),
      cache: 'no-store'
    })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return await res.json()
  } catch (err: any) {
    console.error('Error in saveWhatsAppTemplates:', err.message || err)
    return { success: false }
  }
}

export async function disconnectWhatsApp() {
  try {
    const res = await fetch(`${WPP_URL}/disconnect`, { method: 'POST', cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return await res.json()
  } catch (err: any) {
    console.error('Error in disconnectWhatsApp:', err.message || err)
    return { success: false }
  }
}

export async function triggerWhatsAppChecks() {
  try {
    const res = await fetch(`${WPP_URL}/trigger-checks`, { method: 'POST', cache: 'no-store' })
    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    return await res.json()
  } catch (err: any) {
    console.error('Error in triggerWhatsAppChecks:', err.message || err)
    return { success: false }
  }
}

export async function enviarAlertaMensalidadeManual(id: number) {
  try {
    const fs = require('fs')
    const path = require('path')

    // 1. Buscar a mensalidade
    const m = await prisma.mensalidades.findUnique({
      where: { id },
      include: {
        alunos: true,
        matriculas: {
          include: { modalidades: true }
        }
      }
    })

    if (!m) return { success: false, error: 'Mensalidade não encontrada.' }
    if (!m.alunos || !m.alunos.telefone) return { success: false, error: 'Aluno ou telefone não cadastrado.' }

    // 2. Carregar templates do banco (Neon) usando Prisma
    // Tentamos buscar templates no banco para ser consistente com o whatsapp-server
    let templates = {
      lembreteVencimento: "Olá, {nome}! Lembramos que sua mensalidade de {competencia} vence daqui a {dias} dia(s) (no dia {vencimento}). Valor: R$ {valor}.\n\n💵 *Formas de Pagamento:*\n• Pix: ctnexxus@gmail.com 📱\n• Dinheiro 💵\n• Cartão 💳",
      mensalidadeAtrasada: "Olá, {nome}! Constatamos que sua mensalidade de {competencia} (vencida em {vencimento}) está em aberto. Se já efetuou o pagamento, favor desconsiderar e nos enviar o comprovante.\n\n💵 *Formas de Pagamento:*\n• Pix: ctnexxus@gmail.com 📱\n• Dinheiro 💵\n• Cartão 💳",
      confirmacaoPagamento: "Obrigado, {nome}! Confirmamos o recebimento do pagamento da sua mensalidade referente a {competencia}. Bom treino!\n\n💵 *Formas de Pagamento:*\n• Pix: ctnexxus@gmail.com 📱\n• Dinheiro 💵\n• Cartão 💳"
    }

    try {
      const record = await prisma.whatsapp_session.findUnique({
        where: { key: 'templates' }
      })
      if (record) {
        templates = { ...templates, ...JSON.parse(record.value) }
      } else {
        // Fallback para arquivo JSON se o banco não tiver
        const templatesPath = path.join(process.cwd(), 'whatsapp-templates.json')
        if (fs.existsSync(templatesPath)) {
          const fileData = fs.readFileSync(templatesPath, 'utf8')
          templates = { ...templates, ...JSON.parse(fileData) }
        }
      }
    } catch (e) {}

    // 3. Montar a mensagem com base no status atual
    let msg = ""
    const formattedDate = m.vencimento ? new Date(m.vencimento).toLocaleDateString('pt-BR') : '-'

    if (m.status === 'PAGO') {
      msg = templates.confirmacaoPagamento
        .replace('{nome}', m.alunos.nome || 'Aluno')
        .replace('{competencia}', m.competencia || '')
    } else if (m.status === 'INADIMPLENTE') {
      msg = templates.mensalidadeAtrasada
        .replace('{nome}', m.alunos.nome || 'Aluno')
        .replace('{competencia}', m.competencia || '')
        .replace('{vencimento}', formattedDate)
    } else {
      // PENDENTE
      const hoje = new Date()
      hoje.setHours(0,0,0,0)
      const venc = m.vencimento ? new Date(m.vencimento) : new Date()
      venc.setHours(0,0,0,0)
      const diffTime = venc.getTime() - hoje.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const diasStr = diffDays > 0 ? String(diffDays) : "0"

      msg = templates.lembreteVencimento
        .replace('{nome}', m.alunos.nome || 'Aluno')
        .replace('{competencia}', m.competencia || '')
        .replace('{dias}', diasStr)
        .replace('{vencimento}', formattedDate)
        .replace('{valor}', Number(m.valor || 0).toFixed(2))
    }

    // 4. Enviar mensagem para o whatsapp-server
    const WPP_URL = process.env.WHATSAPP_SERVER_URL || 'http://127.0.0.1:3001'
    const res = await fetch(`${WPP_URL}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone: m.alunos.telefone, message: msg })
    })

    if (!res.ok) throw new Error(`HTTP error ${res.status}`)
    const resData = await res.json()

    if (resData.success) {
      return { success: true }
    } else {
      return { success: false, error: 'O servidor de WhatsApp recusou o envio.' }
    }

  } catch (error: any) {
    console.error('Erro enviarAlertaMensalidadeManual:', error)
    return { success: false, error: error.message || 'Erro de comunicação com o servidor de WhatsApp.' }
  }
}


