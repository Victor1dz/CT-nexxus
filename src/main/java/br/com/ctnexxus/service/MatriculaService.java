package br.com.ctnexxus.service;

import br.com.ctnexxus.model.Matricula;
import br.com.ctnexxus.repository.MatriculaRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MatriculaService {

    private final MatriculaRepository repository;

    public MatriculaService(MatriculaRepository repository) {
        this.repository = repository;
    }

    public List<Matricula> listarTodas() {
        return repository.findAll();
    }

    public List<Matricula> listarPorAluno(Long alunoId) {
        return repository.findByAlunoId(alunoId);
    }

    public Matricula buscarPorId(Long id) {
        return repository.findById(id).orElseThrow(() -> new IllegalArgumentException("Matrícula inválida: " + id));
    }

    public void salvar(Matricula matricula) {
        repository.save(matricula);
    }

    public List<Matricula> listarAtivas() {
        return repository.findByAtivoTrue();
    }
}
