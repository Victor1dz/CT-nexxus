package br.com.ctnexxus.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;
import java.math.BigDecimal;

@Data
@Entity
@Table(name = "agendamentos")
public class Agendamento {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "aluno_id")
    private Aluno aluno;

    @ManyToOne
    @JoinColumn(name = "modalidade_id")
    private Modalidade modalidade; // Ex: Aula Particular, Avaliação

    private LocalDate data;
    private LocalTime horarioInicio;
    private LocalTime horarioFim;

    private BigDecimal valor; // Valor combinado

    @Enumerated(EnumType.STRING)
    private StatusAgendamento status; // PENDENTE, CONFIRMADO, REALIZADO, CANCELADO

    public enum StatusAgendamento {
        PENDENTE, CONFIRMADO, REALIZADO, CANCELADO
    }
}
