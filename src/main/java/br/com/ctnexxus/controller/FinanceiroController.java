package br.com.ctnexxus.controller;

import br.com.ctnexxus.model.Mensalidade;
import br.com.ctnexxus.model.StatusMensalidade;
import br.com.ctnexxus.repository.MensalidadeRepository;
import br.com.ctnexxus.service.EmailService;
import br.com.ctnexxus.service.FinanceiroService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;

@Controller
public class FinanceiroController {

    private final FinanceiroService financeiroService;
    private final MensalidadeRepository mensalidadeRepository;
    private final EmailService emailService;

    public FinanceiroController(FinanceiroService financeiroService,
                                MensalidadeRepository mensalidadeRepository,
                                EmailService emailService) {
        this.financeiroService = financeiroService;
        this.mensalidadeRepository = mensalidadeRepository;
        this.emailService = emailService;
    }

    @GetMapping("/financeiro")
    public String financeiro(@RequestParam(required = false) String mes, Model model) {
        YearMonth competencia = (mes == null || mes.isBlank()) ? YearMonth.now() : YearMonth.parse(mes);
        List<Mensalidade> mensalidades = financeiroService.listarOuGerarMes(competencia);

        model.addAttribute("mes", competencia.toString());
        model.addAttribute("mensalidades", mensalidades);
        model.addAttribute("hoje", LocalDate.now());
        return "financeiro";
    }

    @PostMapping("/financeiro/pagar")
    public String pagar(@RequestParam Long id,
                        @RequestParam String mes,
                        @RequestParam String forma) {
        financeiroService.marcarPago(id, forma);
        return "redirect:/financeiro?mes=" + mes;
    }

    @PostMapping("/financeiro/pendente")
    public String pendente(@RequestParam Long id, @RequestParam String mes) {
        financeiroService.marcarPendente(id);
        return "redirect:/financeiro?mes=" + mes;
    }

    @GetMapping("/inadimplencia")
    public String inadimplencia(Model model) {
        LocalDate hoje = LocalDate.now();
        List<Mensalidade> pendentes = mensalidadeRepository.findByStatus(StatusMensalidade.PENDENTE);
        pendentes.removeIf(m -> m.getVencimento() == null || !m.getVencimento().isBefore(hoje));

        model.addAttribute("inadimplentes", pendentes);
        model.addAttribute("hoje", hoje);
        return "inadimplencia";
    }

    // ===== Teste de e-mail =====

    @GetMapping("/email-teste")
    public String emailTeste(Model model) {
        model.addAttribute("enviado", false);
        model.addAttribute("erro", null);
        return "email-teste";
    }

    @PostMapping("/email-teste/enviar")
    public String enviarEmailTeste(@RequestParam String para, Model model) {
        try {
            emailService.enviar(
                    para,
                    "CT Nexxus - Teste de e-mail",
                    "Se você recebeu este e-mail, o envio do CT Nexxus está funcionando ✅"
            );
            model.addAttribute("enviado", true);
            model.addAttribute("erro", null);
        } catch (Exception e) {
            model.addAttribute("enviado", false);
            model.addAttribute("erro", e.getMessage());
        }
        return "email-teste";
    }
}
