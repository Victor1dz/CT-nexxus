package br.com.ctnexxus.controller;

import br.com.ctnexxus.model.Agendamento;
import br.com.ctnexxus.service.AgendamentoService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/agendamentos")
public class AgendamentoController {

    private final AgendamentoService agendamentoService;

    public AgendamentoController(AgendamentoService agendamentoService) {
        this.agendamentoService = agendamentoService;
    }

    @PostMapping("/salvar")
    public String salvar(Agendamento agendamento) {
        agendamentoService.salvar(agendamento);
        return "redirect:/agenda";
    }
}
