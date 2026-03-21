package br.com.ctnexxus.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.ui.Model;
import br.com.ctnexxus.repository.HorarioRepository;
import br.com.ctnexxus.model.Horario;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Controller
public class AgendaController {

    private final HorarioRepository horarioRepository;
    private final br.com.ctnexxus.repository.AgendamentoRepository agendamentoRepository;
    private final br.com.ctnexxus.service.AlunoService alunoService;
    private final br.com.ctnexxus.repository.ModalidadeRepository modalidadeRepository;
    private final br.com.ctnexxus.repository.MatriculaRepository matriculaRepository;

    public AgendaController(HorarioRepository horarioRepository,
            br.com.ctnexxus.repository.AgendamentoRepository agendamentoRepository,
            br.com.ctnexxus.service.AlunoService alunoService,
            br.com.ctnexxus.repository.ModalidadeRepository modalidadeRepository,
            br.com.ctnexxus.repository.MatriculaRepository matriculaRepository) {
        this.horarioRepository = horarioRepository;
        this.agendamentoRepository = agendamentoRepository;
        this.alunoService = alunoService;
        this.modalidadeRepository = modalidadeRepository;
        this.matriculaRepository = matriculaRepository;
    }

    @GetMapping("/agenda")
    public String agenda(Model model) {
        List<Horario> horarios = horarioRepository.findAll();
        List<Map<String, Object>> events = new ArrayList<>();

        for (Horario h : horarios) {
            if (!h.isAtivo() || h.getHoraInicio() == null)
                continue;

            Map<String, Object> event = new HashMap<>();

            // Título com contagem de alunos
            long qtdAlunos = 0;
            if (h.getMatriculas() != null) {
                qtdAlunos = h.getMatriculas().stream().filter(br.com.ctnexxus.model.Matricula::isAtivo).count();
            }
            event.put("title", h.getModalidade().getNome() + " (" + h.getHoraInicio() + ") [" + qtdAlunos + " alunos]");

            event.put("startTime", h.getHoraInicio().toString());

            if (h.getHoraFim() != null) {
                event.put("endTime", h.getHoraFim().toString());
            } else {
                event.put("endTime", h.getHoraInicio().plusHours(1).toString());
            }

            // Parse Days (Robust Logic for Accents)
            List<Integer> days = new ArrayList<>();
            String d = h.getDiasSemana() != null ? h.getDiasSemana().toLowerCase() : "";

            if (d.contains("seg"))
                days.add(1);
            if (d.contains("ter"))
                days.add(2);
            if (d.contains("qua"))
                days.add(3);
            if (d.contains("qui"))
                days.add(4);
            if (d.contains("sex"))
                days.add(5);
            if (d.contains("sab") || d.contains("sáb"))
                days.add(6); // Fix for Sábado
            if (d.contains("dom"))
                days.add(0);

            if (days.isEmpty())
                continue; // Skip if no valid days

            event.put("daysOfWeek", days);

            // Colors
            String modName = h.getModalidade().getNome().toLowerCase();
            if (modName.contains("muay"))
                event.put("backgroundColor", "#2563EB"); // Blue
            else if (modName.contains("boxe"))
                event.put("backgroundColor", "#D32F2F"); // Red
            else if (modName.contains("rit"))
                event.put("backgroundColor", "#F59E0B"); // Orange
            else if (modName.contains("func"))
                event.put("backgroundColor", "#10B981"); // Green
            else
                event.put("backgroundColor", "#607D8B"); // Gray

            events.add(event);
        }

        // --- MERGE: Agendamentos Particulares ---
        List<br.com.ctnexxus.model.Agendamento> agendamentos = agendamentoRepository.findAll();
        for (br.com.ctnexxus.model.Agendamento a : agendamentos) {
            Map<String, Object> evt = new HashMap<>();
            evt.put("title", "PARTICULAR: " + a.getAluno().getNome() + " (" + a.getModalidade().getNome() + ")");

            // FullCalendar date/time format: YYYY-MM-DDTHH:mm:ss
            String startIso = a.getData().toString() + "T" + a.getHorarioInicio() + ":00";
            evt.put("start", startIso);

            if (a.getHorarioFim() != null) {
                String endIso = a.getData().toString() + "T" + a.getHorarioFim() + ":00";
                evt.put("end", endIso);
            }

            // Style distinctively for Private Classes
            evt.put("backgroundColor", "#7C3AED"); // Violet/Purple for Private
            evt.put("borderColor", "#5B21B6");
            evt.put("textColor", "#FFFFFF");

            events.add(evt);
            events.add(evt);
        }

        // --- MERGE: Horários Personalizados/A Combinar (Sincronização Total) ---
        // Busca matrículas ativas que têm horário personalizado definido
        // Formato esperado: "Seg,Qua|15:00" ou similar

        List<br.com.ctnexxus.model.Matricula> matriculas = matriculaRepository.findByAtivoTrue();

        for (br.com.ctnexxus.model.Matricula m : matriculas) {
            String hp = m.getHorarioPersonalizado();

            // Verifica se tem horário personalizado e NÃO tem horário fixo (pra não
            // duplicar)
            if (m.getHorario() == null && hp != null && hp.contains("|")) {
                try {
                    String[] parts = hp.split("\\|");
                    String diasStr = parts[0]; // "Seg,Qua"
                    String horaStr = parts[1]; // "15:00"

                    Map<String, Object> evt = new HashMap<>();
                    evt.put("title", m.getAluno().getNome() + " (" + m.getModalidade().getNome() + ")");
                    evt.put("startTime", horaStr + ":00");
                    evt.put("endTime", java.time.LocalTime.parse(horaStr).plusHours(1).toString()); // 1h duration
                                                                                                    // default

                    List<Integer> days = new ArrayList<>();
                    if (diasStr.contains("Seg"))
                        days.add(1);
                    if (diasStr.contains("Ter"))
                        days.add(2);
                    if (diasStr.contains("Qua"))
                        days.add(3);
                    if (diasStr.contains("Qui"))
                        days.add(4);
                    if (diasStr.contains("Sex"))
                        days.add(5);
                    if (diasStr.contains("Sab") || diasStr.contains("Sáb"))
                        days.add(6);
                    if (diasStr.contains("Dom"))
                        days.add(0);

                    if (!days.isEmpty()) {
                        evt.put("daysOfWeek", days);

                        // Style for Custom Plans
                        evt.put("backgroundColor", "#14B8A6"); // Teal
                        evt.put("borderColor", "#0D9488");

                        events.add(evt);
                    }
                } catch (Exception e) {
                    // Ignore parsing errors for robust display
                    System.err.println("Erro ao parsear horario personalizado: " + hp);
                }
            }
        }

        model.addAttribute("events", events);

        // Populate Modal Dropdowns
        model.addAttribute("alunos", alunoService.listarTodos());
        model.addAttribute("modalidades", modalidadeRepository.findAll());

        return "agenda";
    }
}
