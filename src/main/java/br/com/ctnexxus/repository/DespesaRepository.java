package br.com.ctnexxus.repository;

import br.com.ctnexxus.model.Despesa;
import br.com.ctnexxus.model.StatusMensalidade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public interface DespesaRepository extends JpaRepository<Despesa, Long> {

    List<Despesa> findByDataVencimentoBetween(LocalDate inicio, LocalDate fim);

    @Query("SELECT SUM(d.valor) FROM Despesa d WHERE d.dataPagamento BETWEEN :inicio AND :fim AND d.status = 'PAGO'")
    BigDecimal sumValorPagoBetween(@Param("inicio") LocalDate inicio, @Param("fim") LocalDate fim);

    @Query("SELECT SUM(d.valor) FROM Despesa d WHERE YEAR(d.dataVencimento) = :ano AND MONTH(d.dataVencimento) = :mes")
    BigDecimal sumValorByCompetencia(@Param("ano") int ano, @Param("mes") int mes);
}
