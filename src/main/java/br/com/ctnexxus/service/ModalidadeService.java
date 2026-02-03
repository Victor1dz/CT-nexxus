package br.com.ctnexxus.service;

import br.com.ctnexxus.model.Modalidade;
import br.com.ctnexxus.repository.ModalidadeRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ModalidadeService {

    private final ModalidadeRepository repository;

    public ModalidadeService(ModalidadeRepository repository) {
        this.repository = repository;
    }

    public List<Modalidade> listarTodas() {
        return repository.findAll();
    }

    public void salvar(Modalidade modalidade) {
        repository.save(modalidade);
    }

    public Modalidade buscarPorId(Long id) {
        return repository.findById(id).orElse(null);
    }
}
