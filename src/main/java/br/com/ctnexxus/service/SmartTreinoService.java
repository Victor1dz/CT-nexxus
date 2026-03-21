package br.com.ctnexxus.service;

import br.com.ctnexxus.model.*;
import br.com.ctnexxus.repository.FichaTreinoRepository;
import br.com.ctnexxus.repository.MatriculaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class SmartTreinoService {

    @Autowired
    private FichaTreinoRepository fichaRepository;

    @Autowired
    private MatriculaRepository matriculaRepository;

    public FichaTreino gerarFichaInteligente(Aluno aluno) {
        Anamnese anamnese = aluno.getAnamnese();
        if (anamnese == null) {
            throw new RuntimeException("Aluno sem anamnese preenchida. Impossível gerar treino IA.");
        }

        FichaTreino ficha = new FichaTreino();
        ficha.setAluno(aluno);
        ficha.setDataInicio(LocalDate.now());
        ficha.setDataFim(LocalDate.now().plusWeeks(4)); // Ficha Mensal
        ficha.setObjetivoFicha(anamnese.getObjetivoPrincipal());

        // 1. ENGINE DE SEGURANÇA (Scanner de Lesões)
        List<String> restricoes = detectarRestricoes(anamnese);
        ficha.setObservacoesIA("IA detectou: " + String.join(", ", restricoes));

        // 2. CÁLCULO DE FREQUÊNCIA E VOLUME (Baseado na Matrícula Ativa)
        int aulasPorSemana = 2; // Default

        // Tenta pegar da matrícula ativa
        List<Matricula> matriculas = matriculaRepository.findByAlunoId(aluno.getId());
        // Pega a primeira ativa com preço definido
        for (Matricula m : matriculas) {
            if (m.isAtivo() && m.getPreco() != null) {
                aulasPorSemana = m.getPreco().getFrequenciaSemanal();
                break;
            }
        }

        // Se ainda for 2 e o aluno disse que treina 5x na anamnese, poderiamos usar(?).
        // Mas o plano manda. Se o plano é 5x, geramos 5x.

        int aulasNoMes = aulasPorSemana * 4; // Ficha Mensal (4 semanas)

        // 3. GERAR TREINOS DO MÊS
        List<TreinoDia> treinos = new ArrayList<>();

        for (int i = 1; i <= aulasNoMes; i++) {
            TreinoDia treino = new TreinoDia();
            treino.setFichaTreino(ficha);
            treino.setDiaSemana("Aula " + i);

            // Lógica de variação (A/B/C ou Full Body)
            String tipoTreino = definirTipoTreino(i, aulasPorSemana, anamnese.getObjetivoPrincipal());
            treino.setFocoDoDia(tipoTreino);

            // Monta exercícios filtrando proibidos
            String exercicios = montarExerciciosSeguros(tipoTreino, restricoes, anamnese);
            treino.setDescricaoExercicios(exercicios);

            treinos.add(treino);
        }

        ficha.setTreinos(treinos);
        return fichaRepository.save(ficha);
    }

    private List<String> detectarRestricoes(Anamnese a) {
        List<String> r = new ArrayList<>();
        String textoGeral = (a.getObservacoesGerais() + " " + a.getQuaisCirurgias() + " "
                + a.getDetalheProblemaCardiaco()).toLowerCase();

        // Keywords de Lesão
        if (textoGeral.contains("joelho") || textoGeral.contains("menisco") || textoGeral.contains("ligamento"))
            r.add("Lesão de Joelho (Evitar Impacto/Flexão profunda)");
        if (textoGeral.contains("coluna") || textoGeral.contains("lombar") || textoGeral.contains("hernia"))
            r.add("Lesão de Coluna (Evitar compressão axial)");
        if (textoGeral.contains("ombro") || textoGeral.contains("manguito"))
            r.add("Lesão de Ombro (Evitar movimentos acima da cabeça)");

        // Condições Clínicas
        if (a.isPossuiProblemaCardiaco())
            r.add("Cardíaco (Monitorar FC)");
        if (a.isFezCirurgiaRecente())
            r.add("Pós-Cirúrgico Recente (Cuidado Extremo)");

        return r;
    }

    private int extrairFrequencia(String freqTexto) {
        // Tenta extrair número da string "1-2x na semana" -> default 2
        if (freqTexto == null)
            return 2;
        if (freqTexto.contains("1"))
            return 1;
        if (freqTexto.contains("3"))
            return 3;
        if (freqTexto.contains("4"))
            return 4;
        if (freqTexto.contains("5"))
            return 5;
        return 2; // Padrão
    }

    private String definirTipoTreino(int numeroAula, int freqSemanal, String objetivo) {
        // Exemplo simples: Alternar A/B
        if (freqSemanal == 1)
            return "Full Body (Geral)";
        if (numeroAula % 2 != 0)
            return "Treino A (Superiores/Cardio)";
        return "Treino B (Inferiores/Core)";
    }

    private String montarExerciciosSeguros(String tipo, List<String> restricoes, Anamnese a) {
        StringBuilder sb = new StringBuilder();
        boolean joelhoRuim = restricoes.stream().anyMatch(s -> s.contains("Joelho"));
        boolean colunaRuim = restricoes.stream().anyMatch(s -> s.contains("Coluna"));
        boolean ombroRuim = restricoes.stream().anyMatch(s -> s.contains("Ombro"));

        sb.append("AQUECIMENTO:\n");
        if (joelhoRuim)
            sb.append("- Bicicleta Ergométrica (Leve) - 10min\n- Mobilidade de Tornozelo\n");
        else
            sb.append("- Pular Corda - 3min\n- Polichinelos - 3x30\n");

        sb.append("\nBLOCO PRINCIPAL (" + tipo + "):\n");

        // Exemplo de Banco de Exercícios Dinâmico
        if (tipo.contains("Inferiores") || tipo.contains("Full Body")) {
            if (joelhoRuim) {
                sb.append("1. Cadeira Extensora (Isometria) - 3x15\n");
                sb.append("2. Elevação Pélvica (Solo) - 3x15\n");
                sb.append("3. Abdutor/Adutor Máquina - 3x15\n");
            } else {
                sb.append("1. Agachamento Livre - 4x10\n");
                sb.append("2. Afundo Alternado - 3x12\n");
                sb.append("3. Leg Press 45 - 3x12\n");
            }
        }

        if (tipo.contains("Superiores") || tipo.contains("Full Body")) {
            if (ombroRuim) {
                sb.append("4. Elevação Lateral (Baixa amplitude) - 3x15\n");
                sb.append("5. Remada Baixa (Neutda) - 3x12\n");
            } else {
                sb.append("4. Desenvolvimento Halteres - 3x12\n");
                sb.append("5. Flexão de Braços - 3xMax\n");
            }
        }

        sb.append("\nFINALIZAÇÃO:\n");
        sb.append("- Alongamento passivo (foco na respiração)\n");

        return sb.toString();
    }
}
