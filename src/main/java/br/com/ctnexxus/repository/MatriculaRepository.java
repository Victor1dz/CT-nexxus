package br.com.ctnexxus.repository;

import br.com.ctnexxus.model.Matricula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MatriculaRepository extends JpaRepository<Matricula, Long> {
    List<Matricula> findByAtivoTrue();

    List<Matricula> findByAlunoId(Long alunoId);

    // Custom Queries for Reports (Creating them here since I'm touching the file)
    @Query("SELECT m.modalidade.nome, SUM(m.preco.valor) FROM Matricula m WHERE m.ativo = true GROUP BY m.modalidade.nome")
    List<Object[]> sumReceitaPorModalidade();

    @Query("SELECT m.modalidade.nome, COUNT(m) FROM Matricula m WHERE m.ativo = true GROUP BY m.modalidade.nome")
    List<Object[]> countAlunosPorModalidade();

    @Query("SELECT COUNT(m) FROM Matricula m WHERE m.dataInicio >= :dataInicio")
    Long countNovasMatriculas(@Param("dataInicio") java.time.LocalDate dataInicio);
}
