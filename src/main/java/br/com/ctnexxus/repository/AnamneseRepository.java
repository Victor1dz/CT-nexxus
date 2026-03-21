package br.com.ctnexxus.repository;

import br.com.ctnexxus.model.Anamnese;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AnamneseRepository extends JpaRepository<Anamnese, Long> {
    Anamnese findByAlunoId(Long alunoId);
}
