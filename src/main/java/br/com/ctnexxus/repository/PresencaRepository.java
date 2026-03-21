package br.com.ctnexxus.repository;

import br.com.ctnexxus.model.Presenca;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PresencaRepository extends JpaRepository<Presenca, Long> {
    List<Presenca> findByData(LocalDate data);

    Optional<Presenca> findByMatriculaIdAndData(Long matriculaId, LocalDate data);

    /**
     * Eagerly loads Presenca + Matricula + Modalidade in a single JOIN FETCH query.
     * This prevents Hibernate LazyInitializationException when Thymeleaf renders
     * the edit page after the JPA session has already been closed.
     */
    @Query("SELECT p FROM Presenca p " +
            "JOIN FETCH p.matricula mat " +
            "WHERE mat.aluno.id = :alunoId " +
            "ORDER BY p.data DESC")
    List<Presenca> findByMatriculaAlunoIdOrderByDataDesc(@Param("alunoId") Long alunoId);
}
