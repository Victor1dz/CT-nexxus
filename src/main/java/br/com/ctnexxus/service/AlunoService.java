package br.com.ctnexxus.service;

import br.com.ctnexxus.model.Aluno;
import br.com.ctnexxus.repository.AlunoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AlunoService {

    private final AlunoRepository alunoRepository;

    public AlunoService(AlunoRepository alunoRepository) {
        this.alunoRepository = alunoRepository;
    }

    public List<Aluno> listarTodos() {
        return alunoRepository.findAll();
    }

    public Aluno buscarPorId(Long id) {
        return alunoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Aluno não encontrado: " + id));
    }

    /**
     * Carrega Aluno com TODAS as Matriculas e suas associações (preco, modalidade,
     * horario)
     * de forma eager. Evita LazyInitializationException no template de edição.
     */
    public Aluno buscarPorIdComMatriculas(Long id) {
        return alunoRepository.findByIdWithMatriculas(id)
                .orElseThrow(() -> new IllegalArgumentException("Aluno não encontrado: " + id));
    }

    public Aluno salvar(Aluno aluno) {
        return alunoRepository.save(aluno);
    }

    public void deletar(Long id) {
        alunoRepository.deleteById(id);
    }

    public long contarAlunosAtivos() {
        return alunoRepository.countByAtivoTrue();
    }
}
