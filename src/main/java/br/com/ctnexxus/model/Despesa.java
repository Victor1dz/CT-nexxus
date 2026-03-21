package br.com.ctnexxus.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Data
@Table(name = "despesas")
public class Despesa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String descricao;

    private BigDecimal valor;

    private LocalDate dataVencimento;

    private LocalDate dataPagamento;

    @Enumerated(EnumType.STRING)
    private StatusMensalidade status = StatusMensalidade.PENDENTE; // Reusing Enum (PENDENTE/PAGO)

    private String categoria; // Aluguel, Agua, Luz, Limpeza, Equipamento
}
