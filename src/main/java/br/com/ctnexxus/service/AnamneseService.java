package br.com.ctnexxus.service;

import br.com.ctnexxus.model.Anamnese;
import br.com.ctnexxus.repository.AnamneseRepository;
import org.springframework.stereotype.Service;

@Service
public class AnamneseService {

    private final AnamneseRepository repository;

    public AnamneseService(AnamneseRepository repository) {
        this.repository = repository;
    }

    public Anamnese buscarPorAlunoId(Long alunoId) {
        return repository.findByAlunoId(alunoId);
    }

    public void salvar(Anamnese anamnese) {
        repository.save(anamnese);
    }
}
