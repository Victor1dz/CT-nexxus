package br.com.ctnexxus.service;

import br.com.ctnexxus.model.Aluno;
import br.com.ctnexxus.repository.AlunoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AlunoService {

    private final AlunoRepository repository;

    public AlunoService(AlunoRepository repository) {
        this.repository = repository;
    }

    public List<Aluno> listarTodos() {
        return repository.findAll();
    }

    public void salvar(Aluno aluno) {
        repository.save(aluno);
    }

    public Aluno buscarPorId(Long id) {
        return repository.findById(id).orElse(null);
    }
}
