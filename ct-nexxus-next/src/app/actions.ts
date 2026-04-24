"use server"

import prisma from "@/lib/prisma"
import { Modalidade, Preco, Horario } from "@/types"

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
      horaInicio: h.hora_inicio || "",
      horaFim: h.hora_fim || "",
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
  const nome = formData.get('nome') as string
  const descricao = formData.get('descricao') as string
  const ativa = formData.get('ativa') === 'on'
  const exigeHorario = formData.get('exigeHorario') === 'on'

  try {
    await prisma.modalidades.create({
      data: {
        nome,
        descricao,
        ativa,
        exige_horario: exigeHorario
      }
    })
    return { success: true }
  } catch (error) {
    console.error('Erro ao salvar modalidade:', error)
    return { success: false, error: 'Erro ao salvar modalidade' }
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

    const inadimplentesCount = await prisma.mensalidades.count({
      where: {
        status: 'PENDENTE',
        vencimento: {
          lt: now
        }
      }
    })

    return {
      totalAlunos,
      receitaMensal: recebidoAgregado._sum.valor ? Number(recebidoAgregado._sum.valor) : 0,
      totalInadimplentes: inadimplentesCount
    }
  } catch (error) {
    console.error('Erro ao buscar stats:', error)
    return { totalAlunos: 0, receitaMensal: 0, totalInadimplentes: 0 }
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

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    const mensalidades = await prisma.mensalidades.findMany({
      where: {
        vencimento: {
          gte: firstDay,
          lte: lastDay
        }
      },
      include: {
        alunos: true
      },
      orderBy: { vencimento: 'asc' }
    })

    const despesas = await prisma.despesas.findMany({
      where: {
        data_vencimento: {
          gte: firstDay,
          lte: lastDay
        }
      },
      orderBy: { data_vencimento: 'asc' }
    })

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
  } catch (error) {
    console.error('Erro ao buscar dados financeiros:', error)
    return { mensalidades: [], despesas: [], totalEntradas: 0, totalSaidas: 0, saldo: 0, mesString: '' }
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
      agrupados[modNome].push(m)
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

export async function getHorariosAgrupados() {
  try {
    const horarios = await prisma.horarios.findMany({
      include: {
        modalidades: true
      },
      orderBy: { hora_inicio: 'asc' }
    })

    const diasSemana = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const agrupados: Record<string, any[]> = {}
    
    diasSemana.forEach(d => { agrupados[d] = [] })

    horarios.forEach((h: any) => {
      const dias = h.dias_semana ? h.dias_semana.split(',').map((d: string) => d.trim()) : []
      dias.forEach((dia: string) => {
        if (agrupados[dia]) {
          agrupados[dia].push(h)
        }
      })
    })

    return agrupados
  } catch (error) {
    console.error('Erro getHorarios:', error)
    return {}
  }
}
