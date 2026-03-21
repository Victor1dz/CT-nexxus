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
    private final br.com.ctnexxus.repository.DespesaRepository despesaRepository;
    private final EmailService emailService;

    public FinanceiroController(FinanceiroService financeiroService,
            MensalidadeRepository mensalidadeRepository,
            br.com.ctnexxus.repository.DespesaRepository despesaRepository,
            EmailService emailService) {
        this.financeiroService = financeiroService;
        this.mensalidadeRepository = mensalidadeRepository;
        this.despesaRepository = despesaRepository;
        this.emailService = emailService;
    }

    @GetMapping("/financeiro")
    public String financeiro(@RequestParam(required = false) String mes, Model model) {
        YearMonth competencia = (mes == null || mes.isBlank()) ? YearMonth.now() : YearMonth.parse(mes);
        List<Mensalidade> mensalidades = financeiroService.listarOuGerarMes(competencia);

        // Despesas
        List<br.com.ctnexxus.model.Despesa> despesas = despesaRepository.findByDataVencimentoBetween(
                competencia.atDay(1),
                competencia.atEndOfMonth());

        // Se não houver nenhuma despesa neste mês, gerar as padrões automaticamente
        if (despesas.isEmpty()) {
            synchronized (this) {
                // Checa novamente dentro do bloco sincronizado
                despesas = despesaRepository.findByDataVencimentoBetween(
                        competencia.atDay(1),
                        competencia.atEndOfMonth());

                if (despesas.isEmpty()) {
                    String[] despesasPadroes = { "Água", "Luz", "Aluguel", "Cartão", "Investimentos" };
                    LocalDate dataVencimentoPadrao = competencia.atDay(10); // Sugestão: Dia 10 do mês

                    for (String desc : despesasPadroes) {
                        br.com.ctnexxus.model.Despesa nova = new br.com.ctnexxus.model.Despesa();
                        nova.setDescricao(desc);
                        nova.setValor(java.math.BigDecimal.ZERO);
                        nova.setDataVencimento(dataVencimentoPadrao);
                        nova.setStatus(StatusMensalidade.PENDENTE);
                        despesaRepository.save(nova);
                    }

                    // Recarrega a lista após salvar
                    despesas = despesaRepository.findByDataVencimentoBetween(
                            competencia.atDay(1),
                            competencia.atEndOfMonth());
                }
            }
        } else {
            // Lógica corretiva (Apaga duplicações indesejadas que aconteceram antes)
            // Se encontrar a mesma "Descrição" repetida no mesmo mês com valor 0.00
            java.util.Set<String> descricoesVistas = new java.util.HashSet<>();
            java.util.List<br.com.ctnexxus.model.Despesa> paraDeletar = new java.util.ArrayList<>();

            for (br.com.ctnexxus.model.Despesa d : despesas) {
                if (d.getValor() != null && d.getValor().compareTo(java.math.BigDecimal.ZERO) == 0
                        && d.getStatus() == StatusMensalidade.PENDENTE) {
                    if (descricoesVistas.contains(d.getDescricao())) {
                        paraDeletar.add(d);
                    } else {
                        descricoesVistas.add(d.getDescricao());
                    }
                }
            }
            if (!paraDeletar.isEmpty()) {
                despesaRepository.deleteAll(paraDeletar);
                // Filtra da lista em memória também
                despesas.removeAll(paraDeletar);
            }
        }

        // Cálculos de Caixa
        java.math.BigDecimal totalEntradas = mensalidadeRepository
                .sumValorByCompetenciaAndStatus(competencia.toString(), StatusMensalidade.PAGO);
        if (totalEntradas == null)
            totalEntradas = java.math.BigDecimal.ZERO;

        java.math.BigDecimal totalSaidas = despesaRepository.sumValorByCompetencia(competencia.getYear(),
                competencia.getMonthValue());
        if (totalSaidas == null)
            totalSaidas = java.math.BigDecimal.ZERO;

        // Nota: sumValorByCompetencia na DespesaRepo soma TUDO (Previsto). Se quiser só
        // PAGO, teria que filtrar.
        // Vamos ajustar para somar TUDO como "Despesa Estimada" e calcular Saldo Real
        // depois?
        // Simplificação: Vamos pegar o que foi PAGO nas despesas para o cálculo do
        // saldo real.
        // Mas a query do repo `sumValorByCompetencia` que fiz pega TUDO. Vamos usar
        // Java Stream para filtrar rapidinho ou aceitar assim.
        // Pela robustez, vamos somar só as PAGAS para o Saldo.

        java.math.BigDecimal baixasReais = despesas.stream()
                .filter(d -> d.getStatus() == StatusMensalidade.PAGO)
                .map(br.com.ctnexxus.model.Despesa::getValor)
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);

        model.addAttribute("totalEntradas", totalEntradas);
        model.addAttribute("totalSaidas", totalSaidas); // Total a Pagar
        model.addAttribute("saldo", totalEntradas.subtract(baixasReais)); // Saldo (Entradas - Saídas Pagas)

        model.addAttribute("mes", competencia.toString());
        model.addAttribute("mensalidades", mensalidades);
        model.addAttribute("despesas", despesas);
        model.addAttribute("hoje", LocalDate.now());
        return "financeiro";
    }

    @PostMapping("/financeiro/despesa/salvar")
    public String salvarDespesa(br.com.ctnexxus.model.Despesa despesa) {
        if (despesa.getStatus() == null)
            despesa.setStatus(StatusMensalidade.PENDENTE);
        if (despesa.getStatus() == StatusMensalidade.PAGO && despesa.getDataPagamento() == null) {
            despesa.setDataPagamento(LocalDate.now());
        }
        despesaRepository.save(despesa);
        String mes = java.time.format.DateTimeFormatter.ofPattern("yyyy-MM").format(despesa.getDataVencimento());
        return "redirect:/financeiro?mes=" + mes + "#despesas-tab-pane";
    }

    @PostMapping("/financeiro/despesa/excluir/{id}")
    public String excluirDespesa(@PathVariable Long id,
            @RequestHeader(value = "Referer", required = false) String referer) {
        despesaRepository.deleteById(id);
        return "redirect:" + (referer != null ? referer : "/financeiro");
    }

    @PostMapping("/financeiro/despesa/pagar/{id}")
    public String pagarDespesa(@PathVariable Long id,
            @RequestHeader(value = "Referer", required = false) String referer) {
        br.com.ctnexxus.model.Despesa d = despesaRepository.findById(id).orElse(null);
        if (d != null) {
            d.setStatus(StatusMensalidade.PAGO);
            d.setDataPagamento(LocalDate.now());
            despesaRepository.save(d);
        }
        return "redirect:" + (referer != null ? referer : "/financeiro");
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
                    "Se você recebeu este e-mail, o envio do CT Nexxus está funcionando ✅");
            model.addAttribute("enviado", true);
            model.addAttribute("erro", null);
        } catch (Exception e) {
            model.addAttribute("enviado", false);
            model.addAttribute("erro", e.getMessage());
        }
        return "email-teste";
    }
}
