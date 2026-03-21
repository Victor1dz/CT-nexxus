package br.com.ctnexxus.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import java.time.LocalDate;

@Entity
@Data
@Table(name = "matriculas")
public class Matricula {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "aluno_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Aluno aluno;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "modalidade_id")
    private Modalidade modalidade;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "preco_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Preco preco;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "horario_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Horario horario;

    private LocalDate dataInicio;

    private LocalDate dataFim;

    private Integer diaVencimento;

    private boolean ativo = true;

    private String horarioPersonalizado; // Ex: "Segunda 14:00" - Mantendo para compatibilidade/exibição simples

    @Column(name = "hora_inicio_personalizada")
    private java.time.LocalTime horaInicioPersonalizada;

    @Column(name = "hora_fim_personalizada")
    private java.time.LocalTime horaFimPersonalizada;

    // Armazena dias da semana para personalizados (ex: "Seg/Qua")
    private String diasPersonalizados;
}
