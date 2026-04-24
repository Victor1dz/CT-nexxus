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

export async function salvarAnamnese(formData: FormData) {
  try {
    const aluno_id = Number(formData.get('aluno_id'))
    const peso = formData.get('peso') ? Number(formData.get('peso')) : null
    const altura = formData.get('altura') ? Number(formData.get('altura')) : null
    
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

    // Logic for IA Sugestao
    let sugestao = ""
    let focos = []
    let cuidados = []

    const obj = objetivo_principal ? objetivo_principal.toLowerCase() : ""
    if (obj.includes("emagrecimento") || obj.includes("perder peso")) {
      focos.push("Alta Intensidade (HIIT)", "Circuitos Funcionais")
      sugestao += "<strong>Foco Principal:</strong> Queima Calórica e Condicionamento.<br>"
    } else if (obj.includes("hipertrofia") || obj.includes("massa") || obj.includes("musculo")) {
      focos.push("Treino de Força (Cargas Progressivas)", "Descanso Controlado")
      sugestao += "<strong>Foco Principal:</strong> Ganho de Massa Muscular e Força.<br>"
    } else {
      focos.push("Condicionamento Geral", "Mobilidade")
      sugestao += "<strong>Foco Principal:</strong> Saúde e Bem-estar Geral.<br>"
    }

    if (possui_problema_cardiaco) {
      cuidados.push("Monitorar Frequência Cardíaca (Manter na Zona 2/3)")
      cuidados.push("Evitar picos extremos de esforço sem aquecimento longo")
    }
    if (possui_problema_respiratorio) {
      cuidados.push("Aumentar tempo de descanso entre séries")
      cuidados.push("Ambiente bem ventilado")
    }

    sugestao += "<br>📋 <strong>Estrutura Sugerida:</strong><br><ul>"
    sugestao += "<li><strong>Aquecimento (10-15min):</strong> "
    if (possui_problema_respiratorio) {
      sugestao += "Caminhada progressiva ou Elíptico (menor impacto cardio inicial).</li>"
    } else {
      sugestao += "Pular corda (ritmo leve) ou Polichinelos + Mobilidade Articular.</li>"
    }

    sugestao += "<li><strong>Bloco Principal (30-40min):</strong> "
    if (focos.includes("Alta Intensidade (HIIT)")) {
      sugestao += "Treino intervalado. Ex: 3 min Boxe/Muay Thai intenso + 1 min descanso ativo (agachamentos).</li>"
    } else if (focos.includes("Treino de Força (Cargas Progressivas)")) {
      sugestao += "Foco em técnica e força. Séries de 8-12 repetições. Ex: Sequências de golpes com peso ou Funcional com carga.</li>"
    } else {
      sugestao += "Treino misto (Técnica + Aeróbico moderado). Manter constância.</li>"
    }

    sugestao += "<li><strong>Volta à Calma (5-10min):</strong> Alongamento estático e respiração diafragmática.</li></ul>"

    if (cuidados.length > 0) {
      sugestao += "<div class='p-3 bg-amber-50 text-amber-800 rounded-lg mt-3 border border-amber-200'><strong><i class='bi bi-exclamation-triangle'></i> Atenção / Cuidados Especiais:</strong><ul class='mb-0 mt-1 pl-4'>"
      cuidados.forEach(c => {
        sugestao += `<li>${c}</li>`
      })
      sugestao += "</ul></div>"
    }

    if (frequencia_atividade_fisica && frequencia_atividade_fisica.toLowerCase().includes("sedent")) {
      sugestao += "<div class='mt-3 text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200'><i class='bi bi-lightbulb-fill'></i> <em>Dica da IA: Aluno iniciante/sedentário. Começar com volume baixo e focar na adaptação nas primeiras 2 semanas.</em></div>"
    }

    const dataObj = {
      aluno_id,
      peso, altura,
      possui_problema_cardiaco, detalhe_problema_cardiaco,
      possui_problema_respiratorio, detalhe_problema_respiratorio,
      toma_medicamento_continuo, quais_medicamentos,
      possui_alergia, quais_alergias,
      fez_cirurgia_recente, quais_cirurgias,
      objetivo_principal, frequencia_atividade_fisica,
      fuma, bebe_alcool, observacoes_gerais,
      sugestao_treino_gerada: sugestao,
      data_atualizacao: new Date()
    }

    const existing = await prisma.anamneses.findUnique({ where: { aluno_id } })
    if (existing) {
      await prisma.anamneses.update({ where: { id: existing.id }, data: dataObj })
    } else {
      await prisma.anamneses.create({ data: dataObj })
    }

    return { success: true }
  } catch (error) {
    console.error('Erro salvarAnamnese:', error)
    return { success: false }
  }
}}
