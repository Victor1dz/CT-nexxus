package br.com.ctnexxus.controller;

import br.com.ctnexxus.model.Modalidade;
import br.com.ctnexxus.service.ModalidadeService;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
public class ModalidadeConverter implements Converter<String, Modalidade> {

    private final ModalidadeService modalidadeService;

    public ModalidadeConverter(ModalidadeService modalidadeService) {
        this.modalidadeService = modalidadeService;
    }

    @Override
    public Modalidade convert(String source) {
        if (source == null || source.isBlank()) return null;
        Long id = Long.valueOf(source);
        return modalidadeService.buscarPorId(id);
    }
}
