package br.com.ctnexxus.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Data
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"mensalidade_id", "tipo"}))
public class NotificacaoEmail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // "D2", "D1", "D0"
    private String tipo;

    private LocalDate dataEnvio = LocalDate.now();

    @ManyToOne
    @JoinColumn(name = "mensalidade_id")
    private Mensalidade mensalidade;
}
