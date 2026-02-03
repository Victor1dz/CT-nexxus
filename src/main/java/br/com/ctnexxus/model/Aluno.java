package br.com.ctnexxus.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Data
public class Aluno {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    private String telefone;

    // Email será obrigatório na tela (required).
    // No H2 com ddl-auto:update pode não aplicar NOT NULL em tabela já criada,
    // mas o formulário vai obrigar.
    private String email;

    // Data que começou
    private LocalDate dataInicio = LocalDate.now();

    // Agora 1..31 (o sistema ajusta se o mês não tiver esse dia)
    private Integer diaVencimento = 10;

    // Valor opcional por aluno (se null, usa valor da modalidade)
    private BigDecimal valorPersonalizado;

    @ManyToOne
    @JoinColumn(name = "modalidade_id")
    private Modalidade modalidade;

    @ManyToOne
    @JoinColumn(name = "horario_id")
    private Horario horario;

    private boolean ativo = true;

    private LocalDate dataCadastro = LocalDate.now();
}
