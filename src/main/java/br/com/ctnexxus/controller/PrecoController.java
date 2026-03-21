package br.com.ctnexxus.controller;

import br.com.ctnexxus.model.Preco;
import br.com.ctnexxus.service.ModalidadeService;
import br.com.ctnexxus.service.PrecoService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/precos")
public class PrecoController {

    private final PrecoService precoService;
    private final ModalidadeService modalidadeService;

    public PrecoController(PrecoService precoService, ModalidadeService modalidadeService) {
        this.precoService = precoService;
        this.modalidadeService = modalidadeService;
    }

    @GetMapping("/modalidade/{modalidadeId}")
    public String listarPorModalidade(@PathVariable Long modalidadeId, Model model) {
        model.addAttribute("precos", precoService.listarPorModalidade(modalidadeId));
        model.addAttribute("modalidade", modalidadeService.buscarPorId(modalidadeId));
        return "precos"; // You would need this template
    }

    @GetMapping("/novo")
    public String novo(Model model) {
        model.addAttribute("preco", new Preco());
        model.addAttribute("modalidades", modalidadeService.listarTodas());
        return "preco-form";
    }

    @PostMapping("/salvar")
    public String salvar(@ModelAttribute Preco preco) {
        precoService.salvar(preco);
        return "redirect:/precos/modalidade/" + preco.getModalidade().getId();
    }

    @GetMapping("/editar/{id}")
    public String editar(@PathVariable Long id, Model model) {
        Preco preco = precoService.buscarPorId(id);
        model.addAttribute("preco", preco);
        model.addAttribute("modalidades", modalidadeService.listarTodas());
        return "preco-form";
    }

    @GetMapping("/api/modalidade/{modalidadeId}")
    @ResponseBody
    public java.util.List<java.util.Map<String, Object>> listarPorModalidadeJson(@PathVariable Long modalidadeId) {
        return precoService.listarPorModalidade(modalidadeId).stream().map(p -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", p.getId());
            map.put("valor", p.getValor());
            map.put("descricao", p.getDescricao());
            map.put("frequenciaSemanal", p.getFrequenciaSemanal());
            return map;
        }).collect(java.util.stream.Collectors.toList());
    }
}
