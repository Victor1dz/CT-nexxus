package br.com.ctnexxus.repository;

import br.com.ctnexxus.model.Aluno;
import br.com.ctnexxus.model.Presenca;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface PresencaRepository extends JpaRepository<Presenca, Long> {
    Optional<Presenca> findByAlunoAndData(Aluno aluno, LocalDate data);
}
