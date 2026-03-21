package br.com.ctnexxus.repository;

import br.com.ctnexxus.model.TreinoDia;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TreinoDiaRepository extends JpaRepository<TreinoDia, Long> {
}
