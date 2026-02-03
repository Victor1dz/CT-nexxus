package br.com.ctnexxus.service;

import br.com.ctnexxus.model.Aluno;
import br.com.ctnexxus.model.Presenca;
import br.com.ctnexxus.repository.PresencaRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class PresencaService {

    private final PresencaRepository repository;

    public PresencaService(PresencaRepository repository) {
        this.repository = repository;
    }

    public Presenca obterOuCriar(Aluno aluno, LocalDate data) {
        return repository.findByAlunoAndData(aluno, data).orElseGet(() -> {
            Presenca p = new Presenca();
            p.setAluno(aluno);
            p.setData(data);
            p.setPresente(false);
            return repository.save(p);
        });
    }

    public void salvar(Presenca presenca) {
        repository.save(presenca);
    }

    public List<Presenca> listarTodas() {
        return repository.findAll();
    }
}
