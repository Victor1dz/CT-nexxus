package br.com.ctnexxus.service;

import br.com.ctnexxus.model.*;
import br.com.ctnexxus.repository.MensalidadeRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;

@Service
public class FinanceiroService {

    private final AlunoService alunoService;
    private final MensalidadeRepository mensalidadeRepository;

    public FinanceiroService(AlunoService alunoService, MensalidadeRepository mensalidadeRepository) {
        this.alunoService = alunoService;
        this.mensalidadeRepository = mensalidadeRepository;
    }

    public List<Mensalidade> listarOuGerarMes(YearMonth competencia) {
        List<Aluno> alunos = alunoService.listarTodos();
        List<Mensalidade> saida = new ArrayList<>();

        for (Aluno a : alunos) {
            if (!a.isAtivo()) continue;

            Mensalidade m = mensalidadeRepository
                    .findByAlunoIdAndCompetencia(a.getId(), competencia.toString())
                    .orElseGet(() -> criarMensalidade(a, competencia));

            saida.add(m);
        }

        return saida;
    }

    private Mensalidade criarMensalidade(Aluno aluno, YearMonth competencia) {
        Mensalidade m = new Mensalidade();
        m.setAluno(aluno);
        m.setCompetencia(competencia.toString());

        int dia = (aluno.getDiaVencimento() == null) ? 10 : aluno.getDiaVencimento();
        if (dia < 1) dia = 1;

        int ultimoDiaDoMes = competencia.lengthOfMonth();
        if (dia > ultimoDiaDoMes) dia = ultimoDiaDoMes;

        m.setVencimento(LocalDate.of(competencia.getYear(), competencia.getMonth(), dia));

        BigDecimal valor = aluno.getValorPersonalizado();
        if (valor == null && aluno.getModalidade() != null) {
            valor = aluno.getModalidade().getValorMensal();
        }
        if (valor == null) valor = BigDecimal.ZERO;

        m.setValor(valor);
        m.setStatus(StatusMensalidade.PENDENTE);

        return mensalidadeRepository.save(m);
    }

    public void marcarPago(Long mensalidadeId, String formaPagamento) {
        Mensalidade m = mensalidadeRepository.findById(mensalidadeId).orElse(null);
        if (m == null) return;

        m.setStatus(StatusMensalidade.PAGO);
        m.setDataPagamento(LocalDate.now());
        m.setFormaPagamento(formaPagamento); // obrigatório

        mensalidadeRepository.save(m);
    }

    public void marcarPendente(Long mensalidadeId) {
        Mensalidade m = mensalidadeRepository.findById(mensalidadeId).orElse(null);
        if (m == null) return;

        m.setStatus(StatusMensalidade.PENDENTE);
        m.setDataPagamento(null);
        m.setFormaPagamento(null);

        mensalidadeRepository.save(m);
    }
}
