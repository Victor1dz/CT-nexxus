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
