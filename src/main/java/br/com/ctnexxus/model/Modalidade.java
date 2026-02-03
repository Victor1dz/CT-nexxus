package br.com.ctnexxus.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Entity
@Data
public class Modalidade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    // Valor mensal (ex: 120.00)
    private BigDecimal valorMensal;

    private boolean ativa = true;
}
