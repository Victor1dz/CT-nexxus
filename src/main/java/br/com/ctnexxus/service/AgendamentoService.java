package br.com.ctnexxus.service;

import br.com.ctnexxus.model.Agendamento;
import br.com.ctnexxus.repository.AgendamentoRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class AgendamentoService {

    private final AgendamentoRepository agendamentoRepository;

    public AgendamentoService(AgendamentoRepository agendamentoRepository) {
        this.agendamentoRepository = agendamentoRepository;
    }

    public List<Agendamento> listarTodos() {
        return agendamentoRepository.findAll();
    }

    public Agendamento salvar(Agendamento agendamento) {
        // Regras de negócio podem vir aqui (ex: validar horário)
        if (agendamento.getStatus() == null) {
            agendamento.setStatus(Agendamento.StatusAgendamento.PENDENTE);
        }
        return agendamentoRepository.save(agendamento);
    }

    public void deletar(Long id) {
        agendamentoRepository.deleteById(id);
    }
}
