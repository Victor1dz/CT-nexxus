package br.com.ctnexxus.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@Entity
@Data
@Table(name = "treinos_dia")
public class TreinoDia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "ficha_treino_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private FichaTreino fichaTreino;

    private String diaSemana; // "Segunda-feira", "Treino A", "Aula 1"
    private String focoDoDia; // "Pernas", "Boxe Técnico", "Full Body"

    @Column(columnDefinition = "TEXT")
    private String descricaoExercicios;
    // Ex:
    // 1. Agachamento Livre - 4x10
    // 2. Leg Press - 3x12
    // ...
}
