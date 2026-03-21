package br.com.ctnexxus.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import java.time.LocalTime;

@Entity
@Data
@Table(name = "horarios")
public class Horario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "modalidade_id")
    private Modalidade modalidade;

    private String diasSemana;

    @Column(nullable = true)
    private LocalTime horaInicio;

    @Column(nullable = true)
    private LocalTime horaFim;

    private boolean ativo = true;

    @OneToMany(mappedBy = "horario")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private java.util.List<Matricula> matriculas;
}
