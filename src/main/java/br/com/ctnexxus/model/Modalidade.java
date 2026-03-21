package br.com.ctnexxus.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Entity
@Data
@Table(name = "modalidades")
public class Modalidade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    private String descricao;

    private boolean ativa = true;

    private boolean exigeHorario = false; // Se true, exige definição manual de dia/hora no cadastro
}
