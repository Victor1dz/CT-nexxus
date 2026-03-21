package br.com.ctnexxus.service;

import br.com.ctnexxus.model.Horario;
import br.com.ctnexxus.repository.HorarioRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class HorarioService {

    private final HorarioRepository repository;

    public HorarioService(HorarioRepository repository) {
        this.repository = repository;
    }

    public List<Horario> listarTodos() {
        return repository.findAll();
    }

    public List<Horario> listarTodos(String ordem) {
        if ("desc".equalsIgnoreCase(ordem)) {
            return repository.findAll(org.springframework.data.domain.Sort
                    .by(org.springframework.data.domain.Sort.Direction.DESC, "modalidade.nome"));
        }
        return repository.findAll(org.springframework.data.domain.Sort
                .by(org.springframework.data.domain.Sort.Direction.ASC, "modalidade.nome"));
    }

    public void salvar(Horario horario) {
        repository.save(horario);
    }

    public Horario buscarPorId(Long id) {
        return repository.findById(id).orElse(null);
    }
}
