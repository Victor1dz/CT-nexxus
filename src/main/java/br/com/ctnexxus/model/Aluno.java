package br.com.ctnexxus.model;

import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
import java.time.LocalDate;
import java.util.List;

@Entity
@Data
@Table(name = "alunos")
public class Aluno {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    private String telefone;

    private String email;

    @Column(unique = true)
    private String cpf;

    // Endereço
    private String cep;
    private String logradouro;
    private String numero;
    private String bairro;
    private String cidade;
    private String uf;

    private LocalDate dataNascimento;

    private LocalDate dataCadastro = LocalDate.now();

    private boolean ativo = true;

    @OneToOne(mappedBy = "aluno", cascade = CascadeType.ALL)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Anamnese anamnese;

    @OneToMany(mappedBy = "aluno", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Matricula> matriculas;

    @OneToMany(mappedBy = "aluno", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<FichaTreino> fichas;

    // Se tiver Presencas ou Financeiro solto, adicionar aqui também se nao
    // estiverem ligados a Matricula
    // Mas geralmente Financeiro é ligado a Matricula ou Aluno.
    // Vamos garantir que tudo que depende de Aluno seja deletado.
}
