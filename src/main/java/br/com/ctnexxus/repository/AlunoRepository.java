package br.com.ctnexxus.repository;

import br.com.ctnexxus.model.Aluno;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlunoRepository extends JpaRepository<Aluno, Long> {
}
