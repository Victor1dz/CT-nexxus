package br.com.ctnexxus.repository;

import br.com.ctnexxus.model.Mensalidade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface MensalidadeRepository extends JpaRepository<Mensalidade, Long> {
    Optional<Mensalidade> findByAlunoIdAndCompetencia(Long alunoId, String competencia);
    List<Mensalidade> findByVencimentoBetween(LocalDate de, LocalDate ate);
    List<Mensalidade> findByStatus(br.com.ctnexxus.model.StatusMensalidade status);
}
