package br.com.ctnexxus.controller;

import br.com.ctnexxus.model.Aluno;
import br.com.ctnexxus.model.Presenca;
import br.com.ctnexxus.service.AlunoService;
import br.com.ctnexxus.service.PresencaService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Controller
@RequestMapping("/presencas")
public class PresencaController {

    private final AlunoService alunoService;
    private final PresencaService presencaService;

    public PresencaController(AlunoService alunoService, PresencaService presencaService) {
        this.alunoService = alunoService;
        this.presencaService = presencaService;
    }

    @GetMapping
    public String tela(@RequestParam(required = false) String data, Model model) {

        LocalDate dataSelecionada = (data == null || data.isBlank())
                ? LocalDate.now()
                : LocalDate.parse(data);

        List<Aluno> alunos = alunoService.listarTodos();
        List<Presenca> presencas = new ArrayList<>();

        for (Aluno a : alunos) {
            if (a.isAtivo()) {
                presencas.add(presencaService.obterOuCriar(a, dataSelecionada));
            }
        }

        model.addAttribute("dataSelecionada", dataSelecionada);
        model.addAttribute("presencas", presencas);

        return "presencas";
    }

    @PostMapping("/salvar")
    public String salvar(@RequestParam String data, @RequestParam(required = false) List<Long> presentes) {

        LocalDate dia = LocalDate.parse(data);

        List<Aluno> alunos = alunoService.listarTodos();
        for (Aluno a : alunos) {
            if (!a.isAtivo()) continue;

            Presenca p = presencaService.obterOuCriar(a, dia);

            boolean marcado = presentes != null && presentes.contains(a.getId());
            p.setPresente(marcado);

            presencaService.salvar(p);
        }

        return "redirect:/presencas?data=" + data;
    }
}
