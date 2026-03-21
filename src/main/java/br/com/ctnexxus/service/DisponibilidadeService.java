package br.com.ctnexxus.service;

import br.com.ctnexxus.model.Horario;
import br.com.ctnexxus.model.Matricula;
import br.com.ctnexxus.repository.HorarioRepository;
import br.com.ctnexxus.repository.MatriculaRepository;
import org.springframework.stereotype.Service;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class DisponibilidadeService {

    private final HorarioRepository horarioRepository;
    private final MatriculaRepository matriculaRepository;
    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(DisponibilidadeService.class);

    // Horário de funcionamento
    private final LocalTime ABERTURA = LocalTime.of(6, 0);
    private final LocalTime FECHAMENTO = LocalTime.of(22, 0);

    public DisponibilidadeService(HorarioRepository horarioRepository, MatriculaRepository matriculaRepository) {
        this.horarioRepository = horarioRepository;
        this.matriculaRepository = matriculaRepository;
        logger.info("DisponibilidadeService inicializado com sucesso.");
    }

    public List<Intervalo> calcularHorariosLivres(String diaSemanaAbrev) {
        // 1. INTERVALO INICIAL (Dia Todo)
        List<Intervalo> livres = new ArrayList<>();
        livres.add(new Intervalo(ABERTURA, FECHAMENTO));

        // 2. OBTER OCUPAÇÕES (Aulas Fixas)
        List<Horario> fixos = horarioRepository.findAll();
        // Filtrar por dia (Assumindo string "Seg/Qua")
        List<Intervalo> ocupados = new ArrayList<>();

        for (Horario h : fixos) {
            if (h.isAtivo() && h.getDiasSemana() != null && h.getDiasSemana().contains(diaSemanaAbrev)) {
                if (h.getHoraInicio() != null && h.getHoraFim() != null) {
                    ocupados.add(new Intervalo(h.getHoraInicio(), h.getHoraFim()));
                }
            }
        }

        // 3. OBTER OCUPAÇÕES (Personalizados - Nova Lógica)
        // Precisa buscar matriculas ativas que tenham hora marcada nesse dia
        List<Matricula> matriculas = matriculaRepository.findByAtivoTrue();
        for (Matricula m : matriculas) {
            if (m.getHorarioPersonalizado() != null && m.getHoraInicioPersonalizada() != null
                    && m.getHoraFimPersonalizada() != null) {
                // Verifica se o dia bate (usando diasPersonalizados ou string antiga)
                String dias = m.getDiasPersonalizados() != null ? m.getDiasPersonalizados()
                        : m.getHorarioPersonalizado();
                if (dias != null && dias.contains(diaSemanaAbrev)) {
                    ocupados.add(new Intervalo(m.getHoraInicioPersonalizada(), m.getHoraFimPersonalizada()));
                }
            }
        }

        // 4. SUBTRAIR OCUPAÇÕES DOS LIVRES
        for (Intervalo ocupado : ocupados) {
            livres = subtrairIntervalo(livres, ocupado);
        }

        return livres;
    }

    private List<Intervalo> subtrairIntervalo(List<Intervalo> disponiveis, Intervalo ocupado) {
        List<Intervalo> resultado = new ArrayList<>();

        for (Intervalo livre : disponiveis) {
            // Caso 1: Ocupado não intersecta (está antes ou depois)
            if (ocupado.fim.isBefore(livre.inicio) || ocupado.fim.equals(livre.inicio) ||
                    ocupado.inicio.isAfter(livre.fim) || ocupado.inicio.equals(livre.fim)) {
                resultado.add(livre);
                continue;
            }

            // Há intersecção. Vamos recortar.

            // Parte antes do ocupado
            if (ocupado.inicio.isAfter(livre.inicio)) {
                resultado.add(new Intervalo(livre.inicio, ocupado.inicio));
            }

            // Parte depois do ocupado
            if (ocupado.fim.isBefore(livre.fim)) {
                resultado.add(new Intervalo(ocupado.fim, livre.fim));
            }
        }

        // Ordenar e Agrupar?
        // Por enquanto retorna simples
        resultado.sort(Comparator.comparing(i -> i.inicio));
        return resultado;
    }

    public java.util.Map<String, List<Intervalo>> getDisponibilidadeSemana() {
        java.util.Map<String, List<Intervalo>> mapaLivres = new java.util.LinkedHashMap<>();
        java.util.List<String> dias = java.util.Arrays.asList("Seg", "Ter", "Qua", "Qui", "Sex", "Sáb");

        for (String dia : dias) {
            mapaLivres.put(dia, calcularHorariosLivres(dia));
        }
        return mapaLivres;
    }

    public static class Intervalo {
        private LocalTime inicio;
        private LocalTime fim;

        public Intervalo(LocalTime inicio, LocalTime fim) {
            this.inicio = inicio;
            this.fim = fim;
        }

        public LocalTime getInicio() {
            return inicio;
        }

        public LocalTime getFim() {
            return fim;
        }

        // Helper para o Front-end (Calculo de % na barra de 06h as 22h)
        public String getLeftPercent() {
            // 06:00 é o zero. Total 16 horas.
            double minutesFromStart = (inicio.getHour() - 6) * 60 + inicio.getMinute();
            double totalDayMinutes = 16 * 60; // 960 min
            double percent = (minutesFromStart / totalDayMinutes) * 100;
            return String.format(java.util.Locale.US, "%.2f%%", Math.max(0, percent));
        }

        public String getWidthPercent() {
            double durationMinutes = java.time.Duration.between(inicio, fim).toMinutes();
            double totalDayMinutes = 16 * 60;
            double percent = (durationMinutes / totalDayMinutes) * 100;
            return String.format(java.util.Locale.US, "%.2f%%", Math.max(0, percent));
        }

        @Override
        public String toString() {
            return inicio + " - " + fim;
        }
    }
}
