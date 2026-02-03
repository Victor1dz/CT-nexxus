package br.com.ctnexxus.jobs;

import br.com.ctnexxus.model.Mensalidade;
import br.com.ctnexxus.model.NotificacaoEmail;
import br.com.ctnexxus.model.StatusMensalidade;
import br.com.ctnexxus.repository.MensalidadeRepository;
import br.com.ctnexxus.repository.NotificacaoEmailRepository;
import br.com.ctnexxus.service.EmailService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Component
public class LembreteEmailJob {

    private final MensalidadeRepository mensalidadeRepository;
    private final NotificacaoEmailRepository notificacaoRepo;
    private final EmailService emailService;

    public LembreteEmailJob(MensalidadeRepository mensalidadeRepository,
                            NotificacaoEmailRepository notificacaoRepo,
                            EmailService emailService) {
        this.mensalidadeRepository = mensalidadeRepository;
        this.notificacaoRepo = notificacaoRepo;
        this.emailService = emailService;
    }

    // Roda todo dia 09:00
    @Scheduled(cron = "0 0 9 * * *")
    public void enviarLembretes() {

        LocalDate hoje = LocalDate.now();
        LocalDate ate = hoje.plusDays(2); // D0, D1, D2

        List<Mensalidade> mensalidades = mensalidadeRepository.findByVencimentoBetween(hoje, ate);

        for (Mensalidade m : mensalidades) {
            if (m.getStatus() == StatusMensalidade.PAGO) continue;
            if (m.getAluno() == null) continue;
            if (m.getAluno().getEmail() == null || m.getAluno().getEmail().isBlank()) continue;

            long dias = ChronoUnit.DAYS.between(hoje, m.getVencimento()); // 0, 1, 2
            String tipo = (dias == 2) ? "D2" : (dias == 1) ? "D1" : "D0";

            // Anti-spam: não repete o mesmo aviso para a mesma mensalidade
            if (notificacaoRepo.existsByMensalidadeIdAndTipo(m.getId(), tipo)) continue;

            String assunto = "CT Nexxus - Lembrete de pagamento (" + tipo + ")";
            String texto =
                    "Olá, " + m.getAluno().getNome() + "!\n\n" +
                    "Lembrete de pagamento do CT Nexxus.\n" +
                    "Competência: " + m.getCompetencia() + "\n" +
                    "Valor: R$ " + m.getValor() + "\n" +
                    "Vencimento: " + m.getVencimento() + "\n\n" +
                    "Se você já realizou o pagamento, por favor desconsidere.\n\n" +
                    "Obrigado!";

            emailService.enviar(m.getAluno().getEmail(), assunto, texto);

            NotificacaoEmail n = new NotificacaoEmail();
            n.setMensalidade(m);
            n.setTipo(tipo);
            notificacaoRepo.save(n);
        }
    }
}
