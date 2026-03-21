package br.com.ctnexxus.config;

import br.com.ctnexxus.model.Horario;
import br.com.ctnexxus.model.Modalidade;
import br.com.ctnexxus.model.Preco;
import br.com.ctnexxus.repository.HorarioRepository;
import br.com.ctnexxus.repository.ModalidadeRepository;
import br.com.ctnexxus.repository.PrecoRepository;
import br.com.ctnexxus.repository.AgendamentoRepository;
import br.com.ctnexxus.repository.MatriculaRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;

@Configuration
public class DataInitializer {

        @Bean
        public CommandLineRunner initData(ModalidadeRepository modalidadeRepository,
                        HorarioRepository horarioRepository,
                        PrecoRepository precoRepository,
                        AgendamentoRepository agendamentoRepository,
                        MatriculaRepository matriculaRepository) {
                return args -> {

                        System.out.println("REINICIANDO BANCO DE DADOS... DELETANDO DADOS ANTIGOS...");
                        // Limpa tudo para garantir zero duplicação (ordem importa por causa das FKs)
                        // Matriculas deveriam ser limpas tbm se tiver cascade, mas vamos focar no setup
                        // inicial
                        if (modalidadeRepository.count() > 0) {
                                System.out.println(
                                                "Banco já possui modalidades. Pulando carga inicial para não sobrescrever dados.");
                                return;
                        }

                        try {
                                System.out.println("Limpando dados antigos...");
                                agendamentoRepository.deleteAll();
                                matriculaRepository.deleteAll();
                                horarioRepository.deleteAll();
                                precoRepository.deleteAll();
                                modalidadeRepository.deleteAll();
                        } catch (Exception e) {
                                System.err.println("Erro ao limpar dados: " + e.getMessage());
                                return;
                        }

                        System.out.println("Sem dados antigos. Inicializando dados zerados e corretos...");

                        // --- 1. Ritbox ---
                        // Horário 07h00 as 08h00 e às 19h00 as 20h00
                        Modalidade ritbox = criarModalidade(modalidadeRepository, "Ritbox",
                                        "Treino ritmado de alta intensidade", false);

                        // Preços Ritbox: 1x=80, 2x=100, 3x=120
                        criarPreco(precoRepository, ritbox, 1, new BigDecimal("80.00"), "1x na semana");
                        criarPreco(precoRepository, ritbox, 2, new BigDecimal("100.00"), "2x na semana");
                        criarPreco(precoRepository, ritbox, 3, new BigDecimal("120.00"), "3x na semana");

                        // Horários Ritbox (Seg/Qua/Sex 07:00 e 19:00)
                        criarHorario(horarioRepository, ritbox, "Seg/Qua/Sex", LocalTime.of(7, 0), LocalTime.of(8, 0));
                        criarHorario(horarioRepository, ritbox, "Seg/Qua/Sex", LocalTime.of(19, 0),
                                        LocalTime.of(20, 0));

                        // --- 2. Muay Thai ---
                        // Horário 08h00 as 09h00 e às 21h30 as 22h30
                        Modalidade muayThai = criarModalidade(modalidadeRepository, "Muay Thai",
                                        "Arte marcial tailandesa", false);

                        // Preços Muay Thai: 1x=80, 2x=100, 3x=120
                        criarPreco(precoRepository, muayThai, 1, new BigDecimal("80.00"), "1x na semana");
                        criarPreco(precoRepository, muayThai, 2, new BigDecimal("100.00"), "2x na semana");
                        criarPreco(precoRepository, muayThai, 3, new BigDecimal("120.00"), "3x na semana");

                        criarHorario(horarioRepository, muayThai, "Seg/Qua/Sex", LocalTime.of(8, 0),
                                        LocalTime.of(9, 0));
                        criarHorario(horarioRepository, muayThai, "Seg/Qua/Sex", LocalTime.of(21, 30),
                                        LocalTime.of(22, 30));

                        // --- 3. Boxe ---
                        // Horarios de aula: 09h30 as 10h30 e às 20h00 as 21h00
                        Modalidade boxe = criarModalidade(modalidadeRepository, "Boxe", "Nobre arte", false);

                        // Preços Boxe: 1x=80, 2x=100, 3x=120
                        criarPreco(precoRepository, boxe, 1, new BigDecimal("80.00"), "1x na semana");
                        criarPreco(precoRepository, boxe, 2, new BigDecimal("100.00"), "2x na semana");
                        criarPreco(precoRepository, boxe, 3, new BigDecimal("120.00"), "3x na semana");

                        criarHorario(horarioRepository, boxe, "Seg/Qua/Sex", LocalTime.of(9, 30), LocalTime.of(10, 30));
                        criarHorario(horarioRepository, boxe, "Seg/Qua/Sex", LocalTime.of(20, 0), LocalTime.of(21, 0));

                        // --- 4. Funcional Específico ---
                        // Seg/qua/sex: 16h00 as 17h00 e às 17h00 as 18h00
                        // Terça e Quinta: 06h00 até as 07h00 , 07h00 as 08h00, 19h00 as 20h00 e às
                        // 20h00 até as 21h00
                        Modalidade funcional = criarModalidade(modalidadeRepository, "Funcional Específico",
                                        "Treino funcional focado", false);

                        // Preços Funcional (Geral): 1x=80, 2x=100, 3x=120
                        criarPreco(precoRepository, funcional, 1, new BigDecimal("80.00"), "1x na semana");
                        criarPreco(precoRepository, funcional, 2, new BigDecimal("100.00"), "2x na semana");
                        criarPreco(precoRepository, funcional, 3, new BigDecimal("120.00"), "3x na semana");

                        // Horários Funcional 1: Seg/Qua/Sex
                        criarHorario(horarioRepository, funcional, "Seg/Qua/Sex", LocalTime.of(16, 0),
                                        LocalTime.of(17, 0));
                        criarHorario(horarioRepository, funcional, "Seg/Qua/Sex", LocalTime.of(17, 0),
                                        LocalTime.of(18, 0));

                        // Horários Funcional 2: Ter/Qui
                        criarHorario(horarioRepository, funcional, "Ter/Qui", LocalTime.of(6, 0), LocalTime.of(7, 0));
                        criarHorario(horarioRepository, funcional, "Ter/Qui", LocalTime.of(7, 0), LocalTime.of(8, 0));
                        criarHorario(horarioRepository, funcional, "Ter/Qui", LocalTime.of(19, 0), LocalTime.of(20, 0));
                        criarHorario(horarioRepository, funcional, "Ter/Qui", LocalTime.of(20, 0), LocalTime.of(21, 0));

                        // --- 5. Projeto Emagrecimento ---
                        Modalidade emagrecimento = criarModalidade(modalidadeRepository, "Projeto Emagrecimento",
                                        "Somente por agendamento", true);

                        // Preço (Até 5x 150.00)
                        criarPreco(precoRepository, emagrecimento, 5, new BigDecimal("150.00"), "Até 5x na semana");

                        // Horário (Agendamento)
                        criarHorario(horarioRepository, emagrecimento, "A Combinar", null, null);

                        // --- 6. Aulas Particulares ---
                        Modalidade particulares = criarModalidade(modalidadeRepository, "Aulas Particulares",
                                        "Somente por agendamento", true);

                        // Preço (Até 5x 250.00)
                        criarPreco(precoRepository, particulares, 5, new BigDecimal("250.00"), "Até 5x na semana");

                        // Horário (Agendamento)
                        criarHorario(horarioRepository, particulares, "A Combinar", null, null);

                        System.out.println("Inicialização de dados (Limpeza e Carga) concluída com sucesso!");
                };
        }

        // Adicionando um Bean separado ou logica extra para garantir que correções
        // sejam aplicadas
        // mesmo que o Init acima seja pulado (pq o banco já tinha dados).
        @Bean
        public CommandLineRunner fixData(ModalidadeRepository modalidadeRepository,
                        HorarioRepository horarioRepository) {
                return args -> {
                        System.out.println("Verificando consistência de flags de Modalidade...");

                        // Força atualização de "Projeto Emagrecimento"
                        modalidadeRepository.findByNome("Projeto Emagrecimento").ifPresent(m -> {
                                if (!m.isExigeHorario()) {
                                        m.setExigeHorario(true);
                                        modalidadeRepository.save(m);
                                        System.out.println("CORRIGIDO: Projeto Emagrecimento agora exige horário.");
                                }
                        });

                        // Força atualização de "Aulas Particulares"
                        modalidadeRepository.findByNome("Aulas Particulares").ifPresent(m -> {
                                if (!m.isExigeHorario()) {
                                        m.setExigeHorario(true);
                                        modalidadeRepository.save(m);
                                        System.out.println("CORRIGIDO: Aulas Particulares agora exige horário.");
                                }
                        });

                        // Restaurador caso bug tenha apagado os horários!
                        if (horarioRepository.count() == 0 && modalidadeRepository.count() > 0) {
                                System.out.println("⚠️ Restaurando horários base perdidos acidentalmente...");

                                modalidadeRepository.findByNome("Ritbox").ifPresent(m -> {
                                        criarHorario(horarioRepository, m, "Seg/Qua/Sex", LocalTime.of(7, 0),
                                                        LocalTime.of(8, 0));
                                        criarHorario(horarioRepository, m, "Seg/Qua/Sex", LocalTime.of(19, 0),
                                                        LocalTime.of(20, 0));
                                });
                                modalidadeRepository.findByNome("Muay Thai").ifPresent(m -> {
                                        criarHorario(horarioRepository, m, "Seg/Qua/Sex", LocalTime.of(8, 0),
                                                        LocalTime.of(9, 0));
                                        criarHorario(horarioRepository, m, "Seg/Qua/Sex", LocalTime.of(21, 30),
                                                        LocalTime.of(22, 30));
                                });
                                modalidadeRepository.findByNome("Boxe").ifPresent(m -> {
                                        criarHorario(horarioRepository, m, "Seg/Qua/Sex", LocalTime.of(9, 30),
                                                        LocalTime.of(10, 30));
                                        criarHorario(horarioRepository, m, "Seg/Qua/Sex", LocalTime.of(20, 0),
                                                        LocalTime.of(21, 0));
                                });
                                modalidadeRepository.findByNome("Funcional Específico").ifPresent(m -> {
                                        criarHorario(horarioRepository, m, "Seg/Qua/Sex", LocalTime.of(16, 0),
                                                        LocalTime.of(17, 0));
                                        criarHorario(horarioRepository, m, "Seg/Qua/Sex", LocalTime.of(17, 0),
                                                        LocalTime.of(18, 0));
                                        criarHorario(horarioRepository, m, "Ter/Qui", LocalTime.of(7, 0),
                                                        LocalTime.of(8, 0));
                                        criarHorario(horarioRepository, m, "Ter/Qui", LocalTime.of(19, 0),
                                                        LocalTime.of(20, 0));
                                });
                                modalidadeRepository.findByNome("Jiu Jitsu Kids").ifPresent(m -> {
                                        criarHorario(horarioRepository, m, "Ter/Qui", LocalTime.of(15, 0),
                                                        LocalTime.of(16, 0));
                                        criarHorario(horarioRepository, m, "Ter/Qui", LocalTime.of(18, 0),
                                                        LocalTime.of(19, 0));
                                });
                                modalidadeRepository.findByNome("Jiu Jitsu Adulto").ifPresent(m -> {
                                        criarHorario(horarioRepository, m, "Ter/Qui", LocalTime.of(8, 0),
                                                        LocalTime.of(9, 0));
                                        criarHorario(horarioRepository, m, "Ter/Qui", LocalTime.of(20, 0),
                                                        LocalTime.of(21, 30));
                                });
                                modalidadeRepository.findByNome("Projeto Emagrecimento").ifPresent(m -> {
                                        criarHorario(horarioRepository, m, "A Combinar", null, null);
                                });
                                modalidadeRepository.findByNome("Aulas Particulares").ifPresent(m -> {
                                        criarHorario(horarioRepository, m, "A Combinar", null, null);
                                });
                        }
                };
        }

        private Modalidade criarModalidade(ModalidadeRepository repository, String nome, String descricao,
                        boolean exigeHorario) {
                Modalidade m = new Modalidade();
                m.setNome(nome);
                m.setDescricao(descricao);
                m.setAtiva(true);
                m.setExigeHorario(exigeHorario);
                return repository.save(m);
        }

        private void criarPreco(PrecoRepository repository, Modalidade modalidade, int frequencia, BigDecimal valor,
                        String descricao) {
                Preco p = new Preco();
                p.setModalidade(modalidade);
                p.setFrequenciaSemanal(frequencia);
                p.setValor(valor);
                p.setDescricao(descricao);
                repository.save(p);
        }

        private void criarHorario(HorarioRepository repository, Modalidade modalidade, String dias, LocalTime inicio,
                        LocalTime fim) {
                Horario h = new Horario();
                h.setModalidade(modalidade);
                h.setDiasSemana(dias);
                h.setHoraInicio(inicio);
                h.setHoraFim(fim);
                h.setAtivo(true);
                repository.save(h);
        }
}
