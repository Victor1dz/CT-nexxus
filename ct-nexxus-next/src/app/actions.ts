"use server"

import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
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

  try {
    const dataObj = { nome, descricao, ativa, exige_horario }
    if (id) {
      await prisma.modalidades.update({ where: { id }, data: dataObj })
    } else {
      await prisma.modalidades.create({ data: dataObj })
    }
    revalidatePath('/modalidades')
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
      
      // Serialize Date and BigInt fields for Next.js Server->Client boundary
      const serialized = {
        ...m,
        id: Number(m.id),
        aluno_id: m.aluno_id ? Number(m.aluno_id) : null,
        modalidade_id: m.modalidade_id ? Number(m.modalidade_id) : null,
        preco_id: m.preco_id ? Number(m.preco_id) : null,
        horario_id: m.horario_id ? Number(m.horario_id) : null,
        data_inicio: m.data_inicio?.toISOString() || null,
        data_fim: m.data_fim?.toISOString() || null,
        hora_inicio_personalizada: m.hora_inicio_personalizada?.toISOString() || null,
        hora_fim_personalizada: m.hora_fim_personalizada?.toISOString() || null,
        alunos: m.alunos ? {
          ...m.alunos,
          id: Number(m.alunos.id),
          data_cadastro: m.alunos.data_cadastro?.toISOString() || null,
          data_nascimento: m.alunos.data_nascimento?.toISOString() || null,
        } : null,
        horarios: m.horarios ? {
          ...m.horarios,
          id: Number(m.horarios.id),
          modalidade_id: m.horarios.modalidade_id ? Number(m.horarios.modalidade_id) : null,
          hora_inicio: m.horarios.hora_inicio ? m.horarios.hora_inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : null,
          hora_fim: m.horarios.hora_fim ? m.horarios.hora_fim.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) : null,
        } : null,
        modalidades: m.modalidades ? {
          ...m.modalidades,
          id: Number(m.modalidades.id)
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
    return { success: true }
  } catch (error) {
    console.error('Erro excluirHorario:', error)
    return { success: false }
  }
}

export async function atualizarStatusMensalidade(formData: FormData) {
  try {
    const id = Number(formData.get('id'))
    const status = formData.get('status') as string
    const forma_pagamento = formData.get('forma') as string

    if (status === 'PAGO') {
      await prisma.mensalidades.update({
        where: { id },
        data: {
          status: 'PAGO',
          data_pagamento: new Date(),
          forma_pagamento: forma_pagamento || 'NÃO INFORMADO'
        }
      })
    } else {
      await prisma.mensalidades.update({
        where: { id },
        data: {
          status: status,
          data_pagamento: null,
          forma_pagamento: null
        }
      })
    }
    
    revalidatePath('/financeiro')
    return { success: true }
  } catch (error) {
    console.error('Erro atualizarStatusMensalidade:', error)
    return { success: false }
  }
}

export async function pagarDespesa(formData: FormData) {
  try {
    const id = Number(formData.get('id'))
    await prisma.despesas.update({
      where: { id },
      data: {
        status: 'PAGO',
        data_pagamento: new Date()
      }
    })
    revalidatePath('/financeiro')
    return { success: true }
  } catch (error) {
    console.error('Erro pagarDespesa:', error)
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
export async function salvarNovoAluno(formData: FormData) {
  try {
    const aluno_id_form = formData.get('aluno_id')
    const aluno_id = aluno_id_form ? Number(aluno_id_form) : null
    const nome = formData.get('nome') as string
    const telefone = formData.get('telefone') as string
    const cpf = formData.get('cpf') as string
    const cep = formData.get('cep') as string
    const logradouro = formData.get('logradouro') as string
    const numero = formData.get('numero') as string
    const bairro = formData.get('bairro') as string
    const cidade = formData.get('cidade') as string
    const uf = formData.get('uf') as string
    const blocksJson = formData.get('blocks_json') as string

    // 1. Create or Update Aluno
    let aluno;
    const alunoData = { nome, telefone, cpf, cep, logradouro, numero, bairro, cidade, uf, ativo: true }
    
    if (aluno_id) {
      aluno = await prisma.alunos.update({
        where: { id: aluno_id },
        data: alunoData
      })
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
        const matriculaData: any = {
          aluno_id: aluno.id,
          modalidade_id: Number(block.selectedMod),
          preco_id: block.selectedPreco ? Number(block.selectedPreco) : null,
          ativo: block.ativo ?? true,
          horario_id: null,
          dias_personalizados: null,
          horario_personalizado: null,
          hora_inicio_personalizada: null,
          hora_fim_personalizada: null
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
          // Se foi desativado agora, registrar data_fim
          if (block.ativo === false) {
             matriculaData.data_fim = new Date()
          }
          await prisma.matriculas.update({
            where: { id: Number(block.matricula_id) },
            data: matriculaData
          })
        } else {
          matriculaData.data_inicio = new Date()
          await prisma.matriculas.create({
            data: matriculaData
          })
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
    const objetivo_ficha = formData.get('objetivo_ficha') as string
    const observacoesia = formData.get('observacoesia') as string
    const ativa = formData.get('ativa') === 'on'
    const treinosJson = formData.get('treinos_json') as string

    let fichaIdToUse = ficha_id

    if (fichaIdToUse) {
      await prisma.fichas_treino.update({
        where: { id: fichaIdToUse },
        data: { objetivo_ficha, observacoesia, ativa }
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
          data_criacao: new Date(),
          data_inicio: new Date()
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
