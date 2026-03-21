package br.com.ctnexxus.controller;

import br.com.ctnexxus.model.Matricula;
import br.com.ctnexxus.model.Presenca;
import br.com.ctnexxus.repository.MatriculaRepository;
import br.com.ctnexxus.repository.PresencaRepository;
import br.com.ctnexxus.service.AlunoService;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.TextStyle;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Controller
public class DiarioController {

    private final MatriculaRepository matriculaRepository;
    private final PresencaRepository presencaRepository;
    private final AlunoService alunoService;

    public DiarioController(MatriculaRepository matriculaRepository, PresencaRepository presencaRepository,
            AlunoService alunoService) {
        this.matriculaRepository = matriculaRepository;
        this.presencaRepository = presencaRepository;
        this.alunoService = alunoService;
    }

    @GetMapping("/diario")
    public String diario(@RequestParam(required = false) LocalDate data,
            @RequestParam(required = false) String busca, Model model) {
        if (data == null) {
            data = LocalDate.now();
        }

        String diaSemana = data.getDayOfWeek().getDisplayName(TextStyle.SHORT, new Locale("pt", "BR"));
        diaSemana = diaSemana.replace(".", "").substring(0, 1).toUpperCase() + diaSemana.replace(".", "").substring(1);

        String termoBusca = mapDiaSemana(data.getDayOfWeek());

        List<Matricula> todas = matriculaRepository.findByAtivoTrue();
        final String termo = termoBusca;

        // Filtra alunos que tem aula neste dia e nome (se houver busca)
        List<Matricula> doDia = todas.stream().filter(m -> {
            boolean noHorarioFixo = m.getHorario() != null && m.getHorario().getDiasSemana().contains(termo);
            boolean noPersonalizado = m.getHorarioPersonalizado() != null
                    && m.getHorarioPersonalizado().contains(termo);
            boolean isLivre = m.getHorarioPersonalizado() != null
                    && m.getHorarioPersonalizado().toLowerCase().contains("livre");

            boolean ehDoDia = noHorarioFixo || noPersonalizado || isLivre;
            if (!ehDoDia)
                return false;

            if (busca != null && !busca.trim().isEmpty()) {
                return m.getAluno().getNome().toLowerCase().contains(busca.toLowerCase());
            }

            return true;
        }).collect(Collectors.toList());

        // Agrupa por Modalidade
        Map<String, List<Matricula>> agrupados = doDia.stream()
                .collect(Collectors.groupingBy(m -> m.getModalidade().getNome()));

        // Carregar Presenças do Dia
        List<Presenca> presencas = presencaRepository.findByData(data);
        Map<Long, Boolean> mapaPresenca = presencas.stream()
                .collect(Collectors.toMap(p -> p.getMatricula().getId(), Presenca::isPresente));

        model.addAttribute("alunosAgrupados", agrupados);
        model.addAttribute("dataAtual", data);
        model.addAttribute("termoBuscaAluno", busca);
        model.addAttribute("diaSemanaTexto", termo);
        model.addAttribute("mapaPresenca", mapaPresenca);

        return "diario";
    }

    @PostMapping("/diario/api/presenca")
    @ResponseBody
    public ResponseEntity<?> togglePresenca(@RequestBody Map<String, Object> payload) {
        try {
            Long matriculaId = Long.valueOf(payload.get("matriculaId").toString());
            String dataStr = payload.get("data").toString();
            LocalDate data = LocalDate.parse(dataStr);
            Boolean presente = Boolean.valueOf(payload.get("presente").toString());

            Optional<Presenca> existing = presencaRepository.findByMatriculaIdAndData(matriculaId, data);
            Presenca p;
            if (existing.isPresent()) {
                p = existing.get();
                p.setPresente(presente);
            } else {
                Matricula m = matriculaRepository.findById(matriculaId).orElseThrow();
                p = new Presenca(m, data, presente);
            }
            presencaRepository.save(p);
            return ResponseEntity.ok().body(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/diario/api/historico/{alunoId}")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> getHistoricoAjax(@PathVariable Long alunoId) {
        List<Presenca> presencas = presencaRepository.findByMatriculaAlunoIdOrderByDataDesc(alunoId);
        List<Map<String, Object>> result = presencas.stream().map(p -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", p.getId());
            map.put("data", p.getData().toString());
            map.put("presente", p.isPresente());
            map.put("observacao", p.getObservacao());
            map.put("modalidade",
                    p.getMatricula() != null && p.getMatricula().getModalidade() != null
                            ? p.getMatricula().getModalidade().getNome()
                            : "");
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/diario/historico/{alunoId}")
    public String historicoPresencaAluno(@PathVariable Long alunoId, Model model) {
        model.addAttribute("aluno", alunoService.buscarPorId(alunoId));

        List<Presenca> historicoCompleto = presencaRepository.findByMatriculaAlunoIdOrderByDataDesc(alunoId);
        LocalDate hoje = LocalDate.now();

        long presencasMes = 0;
        long faltasMes = 0;

        for (Presenca p : historicoCompleto) {
            if (p.getData() != null && p.getData().getYear() == hoje.getYear()
                    && p.getData().getMonth() == hoje.getMonth()) {
                if (p.isPresente()) {
                    presencasMes++;
                } else {
                    faltasMes++;
                }
            }
        }

        long totalMes = presencasMes + faltasMes;
        int porcentagemMes = totalMes > 0 ? (int) Math.round(((double) presencasMes / totalMes) * 100) : 0;

        model.addAttribute("historicoPresencas", historicoCompleto);
        model.addAttribute("presencasMes", presencasMes);
        model.addAttribute("faltasMes", faltasMes);
        model.addAttribute("totalMes", totalMes);
        model.addAttribute("porcentagemMes", porcentagemMes);

        return "diario-historico";
    }

    private String mapDiaSemana(java.time.DayOfWeek day) {
        switch (day) {
            case MONDAY:
                return "Seg";
            case TUESDAY:
                return "Ter";
            case WEDNESDAY:
                return "Qua";
            case THURSDAY:
                return "Qui";
            case FRIDAY:
                return "Sex";
            case SATURDAY:
                return "Sab";
            case SUNDAY:
                return "Dom";
            default:
                return "";
        }
    }
}
