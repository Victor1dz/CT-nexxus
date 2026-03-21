package br.com.ctnexxus.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;

@Entity
@Data
@Table(name = "precos")
public class Preco {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "modalidade_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Modalidade modalidade;

    private Integer frequenciaSemanal; // 1, 2, 3, 5

    private BigDecimal valor;

    private String descricao;
}
