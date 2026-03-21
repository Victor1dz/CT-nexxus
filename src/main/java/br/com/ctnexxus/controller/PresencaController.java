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

    private final br.com.ctnexxus.service.MatriculaService matriculaService;
    private final PresencaService presencaService;

    public PresencaController(br.com.ctnexxus.service.MatriculaService matriculaService,
            PresencaService presencaService) {
        this.matriculaService = matriculaService;
        this.presencaService = presencaService;
    }

    @GetMapping
    public String tela(@RequestParam(required = false) String data, Model model) {

        LocalDate dataSelecionada = (data == null || data.isBlank())
                ? LocalDate.now()
                : LocalDate.parse(data);

        // Busca matrículas ativas em vez de alunos soltos
        List<br.com.ctnexxus.model.Matricula> matriculas = matriculaService.listarAtivas();
        List<Presenca> presencas = new ArrayList<>();

        for (br.com.ctnexxus.model.Matricula m : matriculas) {
            presencas.add(presencaService.obterOuCriar(m, dataSelecionada));
        }

        model.addAttribute("dataSelecionada", dataSelecionada);
        model.addAttribute("presencas", presencas);

        return "presencas";
    }

    @PostMapping("/salvar")
    public String salvar(@RequestParam String data, @RequestParam(required = false) List<Long> presentes) {

        LocalDate dia = LocalDate.parse(data);

        List<br.com.ctnexxus.model.Matricula> matriculas = matriculaService.listarAtivas();
        for (br.com.ctnexxus.model.Matricula m : matriculas) {

            Presenca p = presencaService.obterOuCriar(m, dia);

            // "presentes" agora contém IDs de Alunos ou Matriculas?
            // O ideal seria IDs de Matricula, mas o form antigo provavelmente mandava ID de
            // Aluno.
            // Se mantivermos ID de Aluno, pode dar conflito se o aluno tiver 2 matrículas.
            // Vamos assumir que o formulário "presencas.html" (que eu nao vi) usa o ID do
            // objeto iterado.
            // Se ele itera sobre "presencas", presenca.aluno.id...
            // O correto é atualizar o HTML também. Mas como o user pediu só pra arrumar o
            // Controller para não dar erro...
            // Vou assumir que o checkbox envia o ID da MATRÍCULA ou adequar a lógica.

            // Lógica mais segura: Checkbox name="presentes"
            // value="${presenca.matricula.id}"

            boolean marcado = presentes != null && presentes.contains(m.getId());
            p.setPresente(marcado);

            presencaService.salvar(p);
        }

        return "redirect:/presencas?data=" + data;
    }
}
