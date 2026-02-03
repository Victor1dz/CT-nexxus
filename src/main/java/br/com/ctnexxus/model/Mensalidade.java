package br.com.ctnexxus.model;

import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Data
@Table(
        uniqueConstraints = @UniqueConstraint(columnNames = {"aluno_id", "competencia"})
)
public class Mensalidade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Ex: "2026-02" (mês/ano)
    private String competencia;

    private LocalDate vencimento;

    private BigDecimal valor;

    @Enumerated(EnumType.STRING)
    private StatusMensalidade status = StatusMensalidade.PENDENTE;

    private LocalDate dataPagamento;

    private String formaPagamento; // Pix, dinheiro, etc

    @ManyToOne
    @JoinColumn(name = "aluno_id")
    private Aluno aluno;
}
