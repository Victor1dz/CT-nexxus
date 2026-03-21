package br.com.ctnexxus.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Data
@Table(name = "fichas_treino")
public class FichaTreino {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "aluno_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Aluno aluno;

    private LocalDate dataCriacao = LocalDate.now();
    private LocalDate dataInicio;
    private LocalDate dataFim; // Validade (ex: 30 dias)

    private String objetivoFicha; // Ex: "Hipertrofia - Foco Pernas"

    @Column(columnDefinition = "TEXT")
    private String observacoesIA; // "IA detectou lesão no joelho. Exercícios de impacto removidos."

    @OneToMany(mappedBy = "fichaTreino", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<TreinoDia> treinos = new ArrayList<>();

    // Status: ATIVA, FINALIZADA
    private boolean ativa = true;
}
