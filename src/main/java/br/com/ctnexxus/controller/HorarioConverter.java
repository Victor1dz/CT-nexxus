package br.com.ctnexxus.controller;

import br.com.ctnexxus.model.Horario;
import br.com.ctnexxus.service.HorarioService;
import org.springframework.core.convert.converter.Converter;
import org.springframework.stereotype.Component;

@Component
public class HorarioConverter implements Converter<String, Horario> {

    private final HorarioService horarioService;

    public HorarioConverter(HorarioService horarioService) {
        this.horarioService = horarioService;
    }

    @Override
    public Horario convert(String source) {
        if (source == null || source.isBlank()) return null;
        return horarioService.buscarPorId(Long.valueOf(source));
    }
}
