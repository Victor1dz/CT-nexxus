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

    public HorarioController(HorarioService horarioService, ModalidadeService modalidadeService) {
        this.horarioService = horarioService;
        this.modalidadeService = modalidadeService;
    }

    @GetMapping
    public String listar(Model model) {
        model.addAttribute("horarios", horarioService.listarTodos());
        return "horarios";
    }

    @GetMapping("/novo")
    public String novo(Model model) {
        model.addAttribute("horario", new Horario());
        model.addAttribute("diasSemana", Arrays.asList(DayOfWeek.values()));
        model.addAttribute("modalidades", modalidadeService.listarTodas());
        return "horario-form";
    }

    @PostMapping("/salvar")
    public String salvar(@ModelAttribute Horario horario) {
        horarioService.salvar(horario);
        return "redirect:/horarios";
    }

    @GetMapping("/editar/{id}")
    public String editar(@PathVariable Long id, Model model) {
        model.addAttribute("horario", horarioService.buscarPorId(id));
        model.addAttribute("diasSemana", Arrays.asList(DayOfWeek.values()));
        model.addAttribute("modalidades", modalidadeService.listarTodas());
        return "horario-form";
    }
}
