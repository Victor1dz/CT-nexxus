package br.com.ctnexxus.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Data
@Table(name = "mensalidades", uniqueConstraints = @UniqueConstraint(columnNames = { "matricula_id", "competencia" }))
public class Mensalidade {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String competencia; // "2026-02"

    private LocalDate vencimento;

    private BigDecimal valor;

    @Enumerated(EnumType.STRING)
    private StatusMensalidade status = StatusMensalidade.PENDENTE;

    private LocalDate dataPagamento;

    private String formaPagamento;

    @ManyToOne
    @JoinColumn(name = "aluno_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Aluno aluno;

    @ManyToOne
    @JoinColumn(name = "matricula_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Matricula matricula;
}
