package br.com.ctnexxus.repository;

import br.com.ctnexxus.model.Modalidade;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ModalidadeRepository extends JpaRepository<Modalidade, Long> {
    Optional<Modalidade> findByNome(String nome);
}
