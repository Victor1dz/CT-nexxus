package br.com.ctnexxus.controller;

import br.com.ctnexxus.model.Horario;
import br.com.ctnexxus.service.HorarioService;
import br.com.ctnexxus.service.ModalidadeService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.DayOfWeek;
import java.util.Arrays;

@Controller
@RequestMapping("/horarios")
public class HorarioController {

    private final HorarioService horarioService;
    private final ModalidadeService modalidadeService;
    private final br.com.ctnexxus.service.DisponibilidadeService disponibilidadeService;

    public HorarioController(HorarioService horarioService, ModalidadeService modalidadeService,
            br.com.ctnexxus.service.DisponibilidadeService disponibilidadeService) {
        this.horarioService = horarioService;
        this.modalidadeService = modalidadeService;
        this.disponibilidadeService = disponibilidadeService;
    }

    @GetMapping
    public String listar(@RequestParam(required = false) String sort, Model model) {
        if (sort != null) {
            model.addAttribute("horarios", horarioService.listarTodos(sort));
        } else {
            model.addAttribute("horarios", horarioService.listarTodos());
        }

        // Calcular Horários Livres para a semana toda
        java.util.Map<String, java.util.List<br.com.ctnexxus.service.DisponibilidadeService.Intervalo>> mapaLivres = new java.util.LinkedHashMap<>();
        java.util.List<String> dias = Arrays.asList("Seg", "Ter", "Qua", "Qui", "Sex", "Sáb");

        for (String dia : dias) {
            mapaLivres.put(dia, disponibilidadeService.calcularHorariosLivres(dia));
        }
        model.addAttribute("mapaLivres", mapaLivres);

        return "horarios";
    }

    @GetMapping("/novo")
    public String novo(Model model) {
        model.addAttribute("horario", new Horario());
        // Lista simples de dias para checkboxes
        model.addAttribute("diasOpcoes",
                Arrays.asList("Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo"));
        model.addAttribute("modalidades", modalidadeService.listarTodas());
        return "horario-form";
    }

    @PostMapping("/salvar")
    public String salvar(@ModelAttribute Horario horario) {
        // Formatar dias para Seg/Qua/Sex
        if (horario.getDiasSemana() != null && !horario.getDiasSemana().isEmpty()) {
            String raw = horario.getDiasSemana();
            // Ordem correta dos dias
            java.util.List<String> ordemDias = Arrays.asList("Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado",
                    "Domingo");
            java.util.List<String> diasEscolhidos = new java.util.ArrayList<>();

            for (String dia : ordemDias) {
                if (raw.contains(dia)) { // Verifica se a string crua contém o dia
                    // Adiciona a abreviação (3 primeiras letras)
                    // Mas 'Sábado' tem acento, então:
                    if (dia.equals("Sábado"))
                        diasEscolhidos.add("Sáb");
                    else
                        diasEscolhidos.add(dia.substring(0, 3));
                }
            }

            // Juntar com barras
            if (!diasEscolhidos.isEmpty()) {
                horario.setDiasSemana(String.join("/", diasEscolhidos));
            }
        }

        horarioService.salvar(horario);
        // Redireciona sempre ordenado para não "perder" o item
        return "redirect:/horarios?sort=asc";
    }

    @GetMapping("/editar/{id}")
    public String editar(@PathVariable Long id, Model model) {
        Horario horario = horarioService.buscarPorId(id);
        model.addAttribute("horario", horario);

        java.util.List<String> diasOpcoes = Arrays.asList("Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado",
                "Domingo");
        model.addAttribute("diasOpcoes", diasOpcoes);

        // Lógica robusta para marcar os checkboxes
        java.util.List<String> diasSelecionados = new java.util.ArrayList<>();
        if (horario.getDiasSemana() != null) {
            String dias = horario.getDiasSemana().toLowerCase();
            if (dias.contains("seg"))
                diasSelecionados.add("Segunda");
            if (dias.contains("ter"))
                diasSelecionados.add("Terça");
            if (dias.contains("qua"))
                diasSelecionados.add("Quarta");
            if (dias.contains("qui"))
                diasSelecionados.add("Quinta");
            if (dias.contains("sex"))
                diasSelecionados.add("Sexta");
            if (dias.contains("sáb") || dias.contains("sab"))
                diasSelecionados.add("Sábado");
            if (dias.contains("dom"))
                diasSelecionados.add("Domingo");
        }
        model.addAttribute("diasSelecionados", diasSelecionados);

        model.addAttribute("modalidades", modalidadeService.listarTodas());
        return "horario-form";
    }

    @PostMapping("/vaga/excluir")
    public String excluirVagaLivre(@RequestParam String diaAbrev, @RequestParam java.time.LocalTime inicio,
            @RequestParam java.time.LocalTime fim) {
        Horario bloqueio = new Horario();
        bloqueio.setDiasSemana(diaAbrev);
        bloqueio.setHoraInicio(inicio);
        bloqueio.setHoraFim(fim);
        bloqueio.setAtivo(true);
        // modalidade null indica que é um bloqueio livre override
        horarioService.salvar(bloqueio);
        return "redirect:/horarios";
    }

    @PostMapping("/vaga/modificar")
    public String modificarVagaLivre(@RequestParam String diaAbrev,
            @RequestParam java.time.LocalTime inicioAntigo,
            @RequestParam java.time.LocalTime fimAntigo,
            @RequestParam java.time.LocalTime novoInicio,
            @RequestParam java.time.LocalTime novoFim) {

        // Se o novo início é DEPOIS do início antigo, cria um bloqueio do início antigo
        // até o novo início
        if (novoInicio.isAfter(inicioAntigo)) {
            Horario bloqueioInicio = new Horario();
            bloqueioInicio.setDiasSemana(diaAbrev);
            bloqueioInicio.setHoraInicio(inicioAntigo);
            bloqueioInicio.setHoraFim(novoInicio);
            bloqueioInicio.setAtivo(true);
            horarioService.salvar(bloqueioInicio);
        }

        // Se o novo fim é ANTES do fim antigo, cria um bloqueio do novo fim até o fim
        // antigo
        if (novoFim.isBefore(fimAntigo)) {
            Horario bloqueioFim = new Horario();
            bloqueioFim.setDiasSemana(diaAbrev);
            bloqueioFim.setHoraInicio(novoFim);
            bloqueioFim.setHoraFim(fimAntigo);
            bloqueioFim.setAtivo(true);
            horarioService.salvar(bloqueioFim);
        }

        return "redirect:/horarios";
    }
}
