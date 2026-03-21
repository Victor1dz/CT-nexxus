package br.com.ctnexxus.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import java.time.LocalDateTime;

@Entity
@Data
@Table(name = "anamneses")
public class Anamnese {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "aluno_id", unique = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Aluno aluno;

    // Dados Médicos Básicos
    private boolean possuiProblemaCardiaco;
    private boolean possuiProblemaRespiratorio;
    private boolean tomaMedicamentoContinuo;
    private boolean fezCirurgiaRecente;
    private boolean possuiAlergia;

    @Column(columnDefinition = "TEXT")
    private String detalheProblemaCardiaco;

    @Column(columnDefinition = "TEXT")
    private String detalheProblemaRespiratorio;

    @Column(columnDefinition = "TEXT")
    private String quaisMedicamentos;

    @Column(columnDefinition = "TEXT")
    private String quaisCirurgias;

    @Column(columnDefinition = "TEXT")
    private String quaisAlergias;

    // Objetivos e Estilo de Vida
    @Column(columnDefinition = "TEXT")
    private String objetivoPrincipal; // Emagrecimento, Hipertrofia, Saúde

    private boolean fuma;
    private boolean bebeAlcool;

    @Column(columnDefinition = "TEXT")
    private String frequenciaAtividadeFisica; // Sedentário, 1-2x, 3-5x

    @Column(columnDefinition = "TEXT")
    private String observacoesGerais;

    // Métricas Físicas para IA
    private Double peso;
    private Double altura;

    @Column(columnDefinition = "TEXT")
    private String sugestaoTreinoGerada; // Campo para salvar a sugestão da IA

    private LocalDateTime dataAtualizacao = LocalDateTime.now();
}
