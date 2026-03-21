package br.com.ctnexxus.repository;

import br.com.ctnexxus.model.Preco;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PrecoRepository extends JpaRepository<Preco, Long> {
    List<Preco> findByModalidadeId(Long modalidadeId);

    /**
     * Eagerly loads ALL Preco entities junto com a Modalidade via JOIN FETCH.
     * Evita LazyInitializationException quando acessamos p.getModalidade()
     * fora do contexto transacional (ex: stream no Controller).
     */
    @Query("SELECT p FROM Preco p JOIN FETCH p.modalidade")
    List<Preco> findAllComModalidade();
}
