package br.com.ctnexxus.service;

import br.com.ctnexxus.model.*;
import br.com.ctnexxus.repository.MensalidadeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    @Transactional
    public List<Mensalidade> listarOuGerarMes(YearMonth competencia) {
        List<Aluno> alunos = alunoService.listarTodos();
        List<Mensalidade> saida = new ArrayList<>();

        for (Aluno a : alunos) {
            if (!a.isAtivo())
                continue;

            if (a.getMatriculas() != null) {
                for (Matricula mat : a.getMatriculas()) {
                    if (!mat.isAtivo())
                        continue;

                    // Verifica se a matrícula começa DEPOIS do mês da competência
                    if (mat.getDataInicio() != null && mat.getDataInicio().isAfter(competencia.atEndOfMonth())) {
                        continue;
                    }

                    // Verifica se a matrícula termina ANTES do mês da competência
                    if (mat.getDataFim() != null && mat.getDataFim().isBefore(competencia.atDay(1))) {
                        continue;
                    }

                    Mensalidade m = mensalidadeRepository
                            .findByMatriculaIdAndCompetencia(mat.getId(), competencia.toString())
                            .orElseGet(() -> criarMensalidade(a, mat, competencia));

                    saida.add(m);
                }
            }
        }

        return saida;
    }

    private Mensalidade criarMensalidade(Aluno aluno, Matricula matricula, YearMonth competencia) {
        Mensalidade m = new Mensalidade();
        m.setAluno(aluno);
        m.setMatricula(matricula);
        m.setCompetencia(competencia.toString());

        int dia = (matricula.getDiaVencimento() == null) ? 10 : matricula.getDiaVencimento();
        if (dia < 1)
            dia = 1;

        int ultimoDiaDoMes = competencia.lengthOfMonth();
        if (dia > ultimoDiaDoMes)
            dia = ultimoDiaDoMes;

        m.setVencimento(LocalDate.of(competencia.getYear(), competencia.getMonth(), dia));

        BigDecimal valor = BigDecimal.ZERO;
        if (matricula.getPreco() != null) {
            valor = matricula.getPreco().getValor();
        }

        m.setValor(valor);
        m.setStatus(StatusMensalidade.PENDENTE);

        return mensalidadeRepository.save(m);
    }

    public void marcarPago(Long mensalidadeId, String formaPagamento) {
        Mensalidade m = mensalidadeRepository.findById(mensalidadeId).orElse(null);
        if (m == null)
            return;

        m.setStatus(StatusMensalidade.PAGO);
        m.setDataPagamento(LocalDate.now());
        m.setFormaPagamento(formaPagamento); // obrigatório

        mensalidadeRepository.save(m);
    }

    public void marcarPendente(Long mensalidadeId) {
        Mensalidade m = mensalidadeRepository.findById(mensalidadeId).orElse(null);
        if (m == null)
            return;

        m.setStatus(StatusMensalidade.PENDENTE);
        m.setDataPagamento(null);
        m.setFormaPagamento(null);

        mensalidadeRepository.save(m);
    }

    public BigDecimal calcularReceitaMes(YearMonth competencia) {
        // Trigger Recompile
        BigDecimal total = mensalidadeRepository.sumValorByCompetencia(competencia.toString());
        return total != null ? total : BigDecimal.ZERO;
    }

    public long contarInadimplentesMes(YearMonth competencia) {
        // Correção: Só é inadimplente se já passou da data de vencimento
        // Para simplificar a query no repositório, vamos contar quantos pendentes
        // existem com vencimento < HOJE
        // Se a competência for futura, ninguém é inadimplente ainda.

        LocalDate hoje = LocalDate.now();
        if (competencia.atEndOfMonth().isBefore(hoje)) {
            // Mês passado e pendente -> Tudo inadimplente
            return mensalidadeRepository.countByStatusAndCompetencia(StatusMensalidade.PENDENTE,
                    competencia.toString());
        } else if (competencia.equals(YearMonth.from(hoje))) {
            // Mês atual, filtrar dia a dia
            List<Mensalidade> pendentes = mensalidadeRepository.findByStatus(StatusMensalidade.PENDENTE);
            return pendentes.stream()
                    .filter(m -> m.getCompetencia().equals(competencia.toString()))
                    .filter(m -> m.getVencimento() != null && m.getVencimento().isBefore(hoje))
                    .count();
        } else {
            return 0; // Mês futuro
        }
    }
}
