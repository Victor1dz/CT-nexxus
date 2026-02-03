package br.com.ctnexxus.repository;

import br.com.ctnexxus.model.NotificacaoEmail;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificacaoEmailRepository extends JpaRepository<NotificacaoEmail, Long> {
    boolean existsByMensalidadeIdAndTipo(Long mensalidadeId, String tipo);
}
