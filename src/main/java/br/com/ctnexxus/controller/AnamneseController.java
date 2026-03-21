package br.com.ctnexxus.controller;

import br.com.ctnexxus.model.Anamnese;
import br.com.ctnexxus.model.Aluno;
import br.com.ctnexxus.service.AnamneseService;
import br.com.ctnexxus.service.AlunoService;
import br.com.ctnexxus.service.TreinoInteligenteService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/anamneses")
public class AnamneseController {

    private final AnamneseService anamneseService;
    private final AlunoService alunoService;

    public AnamneseController(AnamneseService anamneseService, AlunoService alunoService) {
        this.anamneseService = anamneseService;
        this.alunoService = alunoService;
    }

    @GetMapping("/aluno/{alunoId}")
    public String ficha(@PathVariable Long alunoId, Model model) {
        Aluno aluno = alunoService.buscarPorId(alunoId);
        Anamnese anamnese = anamneseService.buscarPorAlunoId(alunoId);

        if (anamnese == null) {
            anamnese = new Anamnese();
            anamnese.setAluno(aluno);
        }

        model.addAttribute("aluno", aluno);
        model.addAttribute("anamnese", anamnese);
        return "anamnese-form";
    }

    @PostMapping("/salvar")
    public String salvar(@ModelAttribute Anamnese anamnese) {
        // Recarrega o aluno para ter dados de idade (dataNascimento) corretos
        // O formulário passa o ID do aluno oculto em anamnese.aluno.id
        if (anamnese.getAluno() != null && anamnese.getAluno().getId() != null) {
            Aluno aluno = alunoService.buscarPorId(anamnese.getAluno().getId());
            anamnese.setAluno(aluno);
        }

        anamneseService.salvar(anamnese);
        return "redirect:/alunos?success=Anamnese salva com sucesso!";
    }
}
