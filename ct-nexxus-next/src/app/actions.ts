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
