package br.com.ctnexxus.controller;

import br.com.ctnexxus.model.Aluno;
import br.com.ctnexxus.service.AlunoService;
import br.com.ctnexxus.service.HorarioService;
import br.com.ctnexxus.service.ModalidadeService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/alunos")
public class AlunoController {

    private final AlunoService alunoService;
    private final ModalidadeService modalidadeService;
    private final HorarioService horarioService;

    public AlunoController(AlunoService alunoService, ModalidadeService modalidadeService, HorarioService horarioService) {
        this.alunoService = alunoService;
        this.modalidadeService = modalidadeService;
        this.horarioService = horarioService;
    }

    @GetMapping
    public String listar(Model model) {
        model.addAttribute("alunos", alunoService.listarTodos());
        return "alunos";
    }

    @GetMapping("/novo")
    public String novo(Model model) {
        model.addAttribute("aluno", new Aluno());
        model.addAttribute("modalidades", modalidadeService.listarTodas());
        model.addAttribute("horarios", horarioService.listarTodos());
        return "aluno-form";
    }

    @PostMapping("/salvar")
    public String salvar(@ModelAttribute Aluno aluno) {
        alunoService.salvar(aluno);
        return "redirect:/alunos";
    }

    @GetMapping("/editar/{id}")
    public String editar(@PathVariable Long id, Model model) {
        model.addAttribute("aluno", alunoService.buscarPorId(id));
        model.addAttribute("modalidades", modalidadeService.listarTodas());
        model.addAttribute("horarios", horarioService.listarTodos());
        return "aluno-form";
    }
}
