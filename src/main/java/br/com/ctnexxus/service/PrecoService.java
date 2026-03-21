package br.com.ctnexxus.service;

import br.com.ctnexxus.model.Preco;
import br.com.ctnexxus.repository.PrecoRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PrecoService {

    private final PrecoRepository precoRepository;

    public PrecoService(PrecoRepository precoRepository) {
        this.precoRepository = precoRepository;
    }

    public List<Preco> listarPorModalidade(Long modalidadeId) {
        return precoRepository.findByModalidadeId(modalidadeId);
    }

    /**
     * Lista todos os preços com a Modalidade carregada via JOIN FETCH.
     * Necessário para mapear os preços para JSON no controller sem LazyInitializationException.
     */
    public List<Preco> listarTodos() {
        return precoRepository.findAllComModalidade();
    }

    public Preco buscarPorId(Long id) {
        return precoRepository.findById(id).orElse(null);
    }

    public Preco salvar(Preco preco) {
        return precoRepository.save(preco);
    }
}
