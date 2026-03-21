package br.com.ctnexxus.controller;

import br.com.ctnexxus.service.AlunoService;
import br.com.ctnexxus.service.FinanceiroService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.time.YearMonth;
import java.math.BigDecimal;

@Controller
public class DashboardController {

    private final AlunoService alunoService;
    private final FinanceiroService financeiroService;

    public DashboardController(AlunoService alunoService, FinanceiroService financeiroService) {
        this.alunoService = alunoService;
        this.financeiroService = financeiroService;
    }

    @GetMapping("/")
    public String dashboard(Model model) {
        YearMonth mesAtual = YearMonth.now();

        // Carrega dados reais
        long alunosAtivos = alunoService.contarAlunosAtivos();
        BigDecimal receitaEstimada = financeiroService.calcularReceitaMes(mesAtual);
        long inadimplentes = financeiroService.contarInadimplentesMes(mesAtual);

        model.addAttribute("totalAlunos", alunosAtivos);
        model.addAttribute("receitaMensal", receitaEstimada);
        model.addAttribute("totalInadimplentes", inadimplentes);
        model.addAttribute("mesReferencia", mesAtual);

        return "index";
    }
}
