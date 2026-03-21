package br.com.ctnexxus.jobs;

import br.com.ctnexxus.model.Matricula;
import br.com.ctnexxus.model.Mensalidade;
import br.com.ctnexxus.model.StatusMensalidade;
import br.com.ctnexxus.repository.MatriculaRepository;
import br.com.ctnexxus.repository.MensalidadeRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Component
public class MensalidadeGeneratorJob {

    private final MatriculaRepository matriculaRepository;
    private final MensalidadeRepository mensalidadeRepository;

    public MensalidadeGeneratorJob(MatriculaRepository matriculaRepository,
            MensalidadeRepository mensalidadeRepository) {
        this.matriculaRepository = matriculaRepository;
        this.mensalidadeRepository = mensalidadeRepository;
    }

    /**
     * Executa todos os dias às 01:00 da manhã.
     * Gera mensalidade para o mês ATUAL se ainda não existir.
     */
    @Scheduled(cron = "0 0 1 * * ?")
    public void gerarMensalidadesRecorrentes() {
        System.out.println(">>> JOB: Iniciando geração de mensalidades...");

        List<Matricula> matriculasAtivas = matriculaRepository.findByAtivoTrue();
        LocalDate hoje = LocalDate.now();
        String competenciaAtual = hoje.format(DateTimeFormatter.ofPattern("yyyy-MM"));

        int geradas = 0;

        for (Matricula matricula : matriculasAtivas) {
            // Verifica se já existe mensalidade para esta competência nesta matrícula
            boolean existe = mensalidadeRepository.existsByMatriculaIdAndCompetencia(matricula.getId(),
                    competenciaAtual);

            if (!existe) {
                Mensalidade nova = new Mensalidade();
                nova.setMatricula(matricula);
                nova.setAluno(matricula.getAluno());
                nova.setCompetencia(competenciaAtual);
                nova.setValor(matricula.getPreco().getValor());
                nova.setStatus(StatusMensalidade.PENDENTE);

                // Define vencimento: Dia escolhido no mês atual
                // Se o dia escolhido já passou muito (ex: hoje é dia 20 e vence dia 5),
                // ideal seria gerar para o próximo mês?
                // POLÍTICA SIMPLIFICADA: Gera para o mês atual. Administrativo ajusta se
                // necessário.

                int diaVenc = matricula.getDiaVencimento() != null ? matricula.getDiaVencimento() : 10;
                // Tratamento para dias inválidos (ex: 31 em Fevereiro)
                int maxDia = hoje.lengthOfMonth();
                if (diaVenc > maxDia)
                    diaVenc = maxDia;

                LocalDate dataVencimento = LocalDate.of(hoje.getYear(), hoje.getMonth(), diaVenc);
                nova.setVencimento(dataVencimento);

                mensalidadeRepository.save(nova);
                geradas++;
            }
        }
        System.out.println(">>> JOB: Finalizado. Mensalidades geradas: " + geradas);
    }
}
