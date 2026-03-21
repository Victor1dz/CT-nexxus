package br.com.ctnexxus.repository;

import br.com.ctnexxus.model.Aluno;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface AlunoRepository extends JpaRepository<Aluno, Long> {
    long countByAtivoTrue();

    /**
     * Eagerly loads Aluno + all Matriculas + Preco + Modalidade + Horario
     * in a single composite query. Prevents LazyInitializationException in
     * edit page modals when the Hibernate session is already closed.
     */
    @Query("SELECT DISTINCT a FROM Aluno a " +
            "LEFT JOIN FETCH a.matriculas mat " +
            "LEFT JOIN FETCH mat.preco " +
            "LEFT JOIN FETCH mat.modalidade " +
            "LEFT JOIN FETCH mat.horario " +
            "WHERE a.id = :id")
    Optional<Aluno> findByIdWithMatriculas(@Param("id") Long id);
}
