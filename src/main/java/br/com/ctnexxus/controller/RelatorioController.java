package br.com.ctnexxus.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class RelatorioController {

    private final br.com.ctnexxus.repository.MensalidadeRepository mensalidadeRepository;
    private final br.com.ctnexxus.repository.MatriculaRepository matriculaRepository;
    private final br.com.ctnexxus.repository.PresencaRepository presencaRepository;

    public RelatorioController(br.com.ctnexxus.repository.MensalidadeRepository mensalidadeRepository,
            br.com.ctnexxus.repository.MatriculaRepository matriculaRepository,
            br.com.ctnexxus.repository.PresencaRepository presencaRepository) {
        this.mensalidadeRepository = mensalidadeRepository;
        this.matriculaRepository = matriculaRepository;
        this.presencaRepository = presencaRepository;
    }

    @GetMapping("/relatorios")
    public String relatorios(org.springframework.ui.Model model) {
        // Grafico 1: Receita por Modalidade (Mes Atual)
        java.time.YearMonth mesAtual = java.time.YearMonth.now();
        java.util.List<Object[]> receitaRaw = mensalidadeRepository
                .sumValorByCompetenciaAgrupadoPorModalidade(mesAtual.toString());

        java.util.List<String> receitaLabels = new java.util.ArrayList<>();
        java.util.List<java.math.BigDecimal> receitaData = new java.util.ArrayList<>();

        for (Object[] row : receitaRaw) {
            receitaLabels.add((String) row[0]);
            receitaData.add((java.math.BigDecimal) row[1]);
        }

        // Grafico 2: Alunos por Modalidade (Ativos)
        java.util.List<Object[]> alunosRaw = matriculaRepository.countAlunosPorModalidade();

        java.util.List<String> alunosLabels = new java.util.ArrayList<>();
        java.util.List<Long> alunosData = new java.util.ArrayList<>();

        for (Object[] row : alunosRaw) {
            alunosLabels.add((String) row[0]);
            alunosData.add((Long) row[1]);
        }

        // Grafico 3: Frequência por Dia da Semana (Total)
        java.util.List<br.com.ctnexxus.model.Presenca> presencas = presencaRepository.findAll();
        java.util.Map<java.time.DayOfWeek, Long> frequenciaMap = presencas.stream()
                .filter(br.com.ctnexxus.model.Presenca::isPresente)
                .collect(java.util.stream.Collectors.groupingBy(
                        p -> p.getData().getDayOfWeek(),
                        java.util.stream.Collectors.counting()));

        // Converter para listas ordenadas (Seg -> Dom)
        java.util.List<String> diasLabels = java.util.Arrays.asList("Seg", "Ter", "Qua", "Qui", "Sex", "Sab", "Dom");
        java.util.List<Long> diasData = new java.util.ArrayList<>();

        diasData.add(frequenciaMap.getOrDefault(java.time.DayOfWeek.MONDAY, 0L));
        diasData.add(frequenciaMap.getOrDefault(java.time.DayOfWeek.TUESDAY, 0L));
        diasData.add(frequenciaMap.getOrDefault(java.time.DayOfWeek.WEDNESDAY, 0L));
        diasData.add(frequenciaMap.getOrDefault(java.time.DayOfWeek.THURSDAY, 0L));
        diasData.add(frequenciaMap.getOrDefault(java.time.DayOfWeek.FRIDAY, 0L));
        diasData.add(frequenciaMap.getOrDefault(java.time.DayOfWeek.SATURDAY, 0L));
        diasData.add(frequenciaMap.getOrDefault(java.time.DayOfWeek.SUNDAY, 0L));

        model.addAttribute("receitaLabels", receitaLabels);
        model.addAttribute("receitaData", receitaData);

        model.addAttribute("alunosLabels", alunosLabels);
        model.addAttribute("alunosData", alunosData);

        model.addAttribute("diasLabels", diasLabels);
        model.addAttribute("diasData", diasData);

        return "relatorios";
    }
}
