package br.com.ctnexxus.controller;

import br.com.ctnexxus.model.Modalidade;
import br.com.ctnexxus.service.ModalidadeService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/modalidades")
public class ModalidadeController {

    private final ModalidadeService service;

    public ModalidadeController(ModalidadeService service) {
        this.service = service;
    }

    @GetMapping
    public String listar(Model model) {
        model.addAttribute("modalidades", service.listarTodas());
        return "modalidades";
    }

    @GetMapping("/nova")
    public String nova(Model model) {
        model.addAttribute("modalidade", new Modalidade());
        return "modalidade-form";
    }

    @PostMapping("/salvar")
    public String salvar(@ModelAttribute Modalidade modalidade) {
        service.salvar(modalidade);
        return "redirect:/modalidades";
    }

    @GetMapping("/editar/{id}")
    public String editar(@PathVariable Long id, Model model) {
        model.addAttribute("modalidade", service.buscarPorId(id));
        return "modalidade-form";
    }
}
