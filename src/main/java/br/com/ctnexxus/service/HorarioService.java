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

    public void salvar(Horario horario) {
        repository.save(horario);
    }

    public Horario buscarPorId(Long id) {
        return repository.findById(id).orElse(null);
    }
}
