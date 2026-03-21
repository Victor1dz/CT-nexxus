package br.com.ctnexxus.service;

import br.com.ctnexxus.model.Anamnese;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class TreinoInteligenteService {

    public String gerarSugestao(Anamnese anamnese) {
        StringBuilder sugestao = new StringBuilder();
        List<String> focos = new ArrayList<>();
        List<String> cuidados = new ArrayList<>();

        // 1. Análise do Objetivo
        String objetivo = anamnese.getObjetivoPrincipal() != null ? anamnese.getObjetivoPrincipal().toLowerCase() : "";
        if (objetivo.contains("emagrecimento") || objetivo.contains("perder peso")) {
            focos.add("Alta Intensidade (HIIT)");
            focos.add("Circuitos Funcionais");
            sugestao.append("<strong>Foco Principal:</strong> Queima Calórica e Condicionamento.<br>");
        } else if (objetivo.contains("hipertrofia") || objetivo.contains("massa") || objetivo.contains("musculo")) {
            focos.add("Treino de Força (Cargas Progressivas)");
            focos.add("Descanso Controlado");
            sugestao.append("<strong>Foco Principal:</strong> Ganho de Massa Muscular e Força.<br>");
        } else {
            focos.add("Condicionamento Geral");
            focos.add("Mobilidade");
            sugestao.append("<strong>Foco Principal:</strong> Saúde e Bem-estar Geral.<br>");
        }

        // 2. Análise de Lesões/Cuidados
        if (anamnese.isPossuiProblemaCardiaco()) {
            cuidados.add("Monitorar Frequência Cardíaca (Manter na Zona 2/3)");
            cuidados.add("Evitar picos extremos de esforço sem aquecimento longo");
        }
        if (anamnese.isPossuiProblemaRespiratorio()) {
            cuidados.add("Aumentar tempo de descanso entre séries");
            cuidados.add("Ambiente bem ventilado");
        }
        // Aqui poderíamos analisar textos livres como "Lombar", "Joelho" se tivéssemos
        // NLP,
        // mas vamos fazer uma busca simples por palavras-chave nos campos de texto se
        // houver.

        // 3. Montagem do Treino Sugerido
        sugestao.append("<br>📋 <strong>Estrutura Sugerida:</strong><br>");

        sugestao.append("<ul>");
        sugestao.append("<li><strong>Aquecimento (10-15min):</strong> ");
        if (anamnese.isPossuiProblemaRespiratorio()) {
            sugestao.append("Caminhada progressiva ou Elíptico (menor impacto cardio inicial).</li>");
        } else {
            sugestao.append("Pular corda (ritmo leve) ou Polichinelos + Mobilidade Articular.</li>");
        }

        sugestao.append("<li><strong>Bloco Principal (30-40min):</strong> ");
        if (focos.contains("Alta Intensidade (HIIT)")) {
            sugestao.append(
                    "Treino intervalado. Ex: 3 min Boxe/Muay Thai intenso + 1 min descanso ativo (agachamentos).</li>");
        } else if (focos.contains("Treino de Força (Cargas Progressivas)")) {
            sugestao.append(
                    "Foco em técnica e força. Séries de 8-12 repetições. Ex: Sequências de golpes com peso ou Funcional com carga.</li>");
        } else {
            sugestao.append("Treino misto (Técnica + Aeróbico moderado). Manter constância.</li>");
        }

        sugestao.append(
                "<li><strong>Volta à Calma (5-10min):</strong> Alongamento estático e respiração diafragmática.</li>");
        sugestao.append("</ul>");

        // 4. Alerts de Segurança
        if (!cuidados.isEmpty()) {
            sugestao.append(
                    "<div class='alert alert-warning mt-2'><i class='bi bi-exclamation-triangle'></i> <strong>Atenção / Cuidados Especiais:</strong><ul class='mb-0'>");
            for (String cuidado : cuidados) {
                sugestao.append("<li>").append(cuidado).append("</li>");
            }
            sugestao.append("</ul></div>");
        }

        // 5. OBS Extra
        if (anamnese.getFrequenciaAtividadeFisica() != null
                && anamnese.getFrequenciaAtividadeFisica().toLowerCase().contains("sedent")) {
            sugestao.append(
                    "<div class='mt-2'><i class='bi bi-lightbulb text-primary'></i> <em>Dica: Aluno iniciante/sedentário. Começar com volume baixo e focar na adaptação nas primeiras 2 semanas.</em></div>");
        }

        return sugestao.toString();
    }
}
