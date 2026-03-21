package br.com.ctnexxus.repository;

import br.com.ctnexxus.model.FichaTreino;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FichaTreinoRepository extends JpaRepository<FichaTreino, Long> {
    List<FichaTreino> findByAlunoId(Long alunoId);
}
