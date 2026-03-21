package br.com.ctnexxus.repository;

import br.com.ctnexxus.model.Agendamento;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.time.LocalDate;

public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {
    List<Agendamento> findByDataBetween(LocalDate inicio, LocalDate fim);

    List<Agendamento> findByAlunoId(Long alunoId);
}
