package br.com.ctnexxus.repository;

import br.com.ctnexxus.model.Mensalidade;
import br.com.ctnexxus.model.StatusMensalidade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MensalidadeRepository extends JpaRepository<Mensalidade, Long> {
        Optional<Mensalidade> findByMatriculaIdAndCompetencia(Long matriculaId, String competencia);

        boolean existsByMatriculaIdAndCompetencia(Long matriculaId, String competencia);

        List<Mensalidade> findByVencimentoBetween(LocalDate de, LocalDate ate);

        List<Mensalidade> findByStatus(StatusMensalidade status);

        List<Mensalidade> findByAlunoIdAndStatus(Long alunoId, StatusMensalidade status);

        long countByStatusAndCompetencia(StatusMensalidade status, String competencia);

        @org.springframework.data.jpa.repository.Query("SELECT SUM(m.valor) FROM Mensalidade m WHERE m.competencia = :competencia AND m.status = :status")
        java.math.BigDecimal sumValorByCompetenciaAndStatus(
                        @org.springframework.data.repository.query.Param("competencia") String competencia,
                        @org.springframework.data.repository.query.Param("status") StatusMensalidade status);

        @org.springframework.data.jpa.repository.Query("SELECT SUM(m.valor) FROM Mensalidade m WHERE m.competencia = :competencia")
        java.math.BigDecimal sumValorByCompetencia(
                        @org.springframework.data.repository.query.Param("competencia") String competencia);

        @org.springframework.data.jpa.repository.Query("SELECT m.matricula.modalidade.nome, SUM(m.valor) FROM Mensalidade m WHERE m.competencia = :competencia GROUP BY m.matricula.modalidade.nome")
        List<Object[]> sumValorByCompetenciaAgrupadoPorModalidade(
                        @org.springframework.data.repository.query.Param("competencia") String competencia);
}
