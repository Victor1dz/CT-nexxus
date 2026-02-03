package br.com.ctnexxus.repository;

import br.com.ctnexxus.model.Horario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HorarioRepository extends JpaRepository<Horario, Long> {
}
