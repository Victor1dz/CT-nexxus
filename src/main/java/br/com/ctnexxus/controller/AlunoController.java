package br.com.ctnexxus.controller;

import br.com.ctnexxus.model.Aluno;
import br.com.ctnexxus.model.Matricula;
import br.com.ctnexxus.model.Mensalidade;
import br.com.ctnexxus.model.Presenca;
import br.com.ctnexxus.model.StatusMensalidade;
import br.com.ctnexxus.repository.MensalidadeRepository;
import br.com.ctnexxus.service.AlunoService;
import br.com.ctnexxus.service.HorarioService;
import br.com.ctnexxus.service.MatriculaService;
import br.com.ctnexxus.service.ModalidadeService;
import br.com.ctnexxus.service.PrecoService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDate;
import java.util.List;

@Controller
@RequestMapping("/alunos")
public class AlunoController {

    private final AlunoService alunoService;
    private final ModalidadeService modalidadeService;
    private final HorarioService horarioService;
    private final MatriculaService matriculaService;
    private final PrecoService precoService;
    private final MensalidadeRepository mensalidadeRepository;
    private final br.com.ctnexxus.service.DisponibilidadeService disponibilidadeService;
    private final br.com.ctnexxus.repository.PresencaRepository presencaRepository;

    public AlunoController(AlunoService alunoService,
            ModalidadeService modalidadeService,
            HorarioService horarioService,
            MatriculaService matriculaService,
            PrecoService precoService,
            MensalidadeRepository mensalidadeRepository,
            br.com.ctnexxus.service.DisponibilidadeService disponibilidadeService,
            br.com.ctnexxus.repository.PresencaRepository presencaRepository) {
        this.alunoService = alunoService;
        this.modalidadeService = modalidadeService;
        this.horarioService = horarioService;
        this.matriculaService = matriculaService;
        this.precoService = precoService;
        this.mensalidadeRepository = mensalidadeRepository;
        this.disponibilidadeService = disponibilidadeService;
        this.presencaRepository = presencaRepository;
    }

    @GetMapping
    public String listar(Model model) {
        // ... (resto do método listar)
        model.addAttribute("alunos", alunoService.listarTodos());
        return "alunos";
    }

    @GetMapping("/novo")
    public String novo(Model model) {
        model.addAttribute("aluno", new Aluno());
        model.addAttribute("modalidades", modalidadeService.listarTodas());
        model.addAttribute("horarios", horarioService.listarTodos());
        model.addAttribute("mapaLivres", disponibilidadeService.getDisponibilidadeSemana());

        // Pre-carrega todos os preços com modalidade carregada (JOIN FETCH)
        List<java.util.Map<String, Object>> precosNovoList = precoService.listarTodos().stream().map(p -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", p.getId());
            map.put("valor", p.getValor() != null ? p.getValor().toString() : "0.00");
            map.put("descricao", p.getDescricao());
            map.put("frequenciaSemanal", p.getFrequenciaSemanal());
            map.put("modalidadeId", p.getModalidade() != null ? p.getModalidade().getId() : null);
            return map;
        }).collect(java.util.stream.Collectors.toList());

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            model.addAttribute("todosPrecosJson", mapper.writeValueAsString(precosNovoList));
        } catch (Exception e) {
            model.addAttribute("todosPrecosJson", "[]");
            e.printStackTrace();
        }

        return "aluno-form";
    }

    @PostMapping("/salvar")
    public String salvar(@ModelAttribute Aluno aluno,
            @RequestParam(required = false) List<Long> modalidadeId,
            @RequestParam(required = false) List<Long> horarioId,
            @RequestParam(required = false) List<Long> precoId,
            @RequestParam(required = false) List<String> horarioPersonalizado,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) List<LocalDate> dataInicioMatricula,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) List<LocalDate> dataFimMatricula,
            @RequestParam(required = false) List<Integer> diaVencimento,
            RedirectAttributes redirectAttributes) {

        // CORREÇÃO CPF DUPLICADO: Se vier vazio, seta null para o banco aceitar
        if (aluno.getCpf() != null && aluno.getCpf().trim().isEmpty()) {
            aluno.setCpf(null);
        }

        // Salva o aluno primeiro para garantir o ID
        Aluno alunoSalvo = alunoService.salvar(aluno);

        // Lógica de Múltiplas Matrículas no cadastro inicial
        if (modalidadeId != null && !modalidadeId.isEmpty()) {
            for (int i = 0; i < modalidadeId.size(); i++) {
                Long mId = modalidadeId.get(i);
                if (mId == null)
                    continue; // Pula se a modalidade estiver vazia

                Long pId = (precoId != null && precoId.size() > i) ? precoId.get(i) : null;
                Long hId = (horarioId != null && horarioId.size() > i) ? horarioId.get(i) : null;
                String hp = (horarioPersonalizado != null && horarioPersonalizado.size() > i)
                        ? horarioPersonalizado.get(i)
                        : null;

                LocalDate dInicio = (dataInicioMatricula != null && dataInicioMatricula.size() > i
                        && dataInicioMatricula.get(i) != null)
                                ? dataInicioMatricula.get(i)
                                : LocalDate.now();
                LocalDate dFim = (dataFimMatricula != null && dataFimMatricula.size() > i) ? dataFimMatricula.get(i)
                        : null;
                Integer vDia = (diaVencimento != null && diaVencimento.size() > i && diaVencimento.get(i) != null)
                        ? diaVencimento.get(i)
                        : 10;

                boolean temHorarioFixo = hId != null;
                boolean temPersonalizado = hp != null && !hp.trim().isEmpty();

                if (temHorarioFixo || temPersonalizado || pId != null) {
                    criarMatricula(alunoSalvo, mId, hId, pId, hp, null, null, null, dInicio, dFim, vDia);
                }
            }
        }

        redirectAttributes.addFlashAttribute("success", "Aluno salvo com sucesso!");
        return "redirect:/alunos";
    }

    @PostMapping("/matricula/adicionar")
    public String adicionarMatricula(@RequestParam Long alunoId,
            @RequestParam(required = false) List<Long> modalidadeId,
            @RequestParam(required = false) List<Long> horarioId,
            @RequestParam(required = false) List<Long> precoId,
            @RequestParam(required = false) List<String> horarioPersonalizado,
            // diasPersonalizados is already a list, but it's per form submission.
            // In the dynamic form, we changed it so that it joins with "/" and sends as a
            // string inside horarioPersonalizado!
            // So we don't need diasPersonalizados list of lists here. We can just ignore it
            // or take it as a list of strings and not use it if our JS builds the string.
            @RequestParam(required = false) List<String> diasPersonalizados,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) List<java.time.LocalTime> horaInicioPersonalizada,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) List<java.time.LocalTime> horaFimPersonalizada,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) List<LocalDate> dataInicioMatricula,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) List<LocalDate> dataFimMatricula,
            @RequestParam(required = false) List<Integer> diaVencimento,
            RedirectAttributes redirectAttributes) {

        Aluno aluno = alunoService.buscarPorId(alunoId);

        if (modalidadeId != null && !modalidadeId.isEmpty()) {
            for (int i = 0; i < modalidadeId.size(); i++) {
                Long mId = modalidadeId.get(i);
                if (mId == null)
                    continue;

                Long pId = (precoId != null && precoId.size() > i) ? precoId.get(i) : null;
                Long hId = (horarioId != null && horarioId.size() > i) ? horarioId.get(i) : null;
                String hp = (horarioPersonalizado != null && horarioPersonalizado.size() > i)
                        ? horarioPersonalizado.get(i)
                        : null;
                LocalDate dInicio = (dataInicioMatricula != null && dataInicioMatricula.size() > i)
                        ? dataInicioMatricula.get(i)
                        : LocalDate.now();
                LocalDate dFim = (dataFimMatricula != null && dataFimMatricula.size() > i) ? dataFimMatricula.get(i)
                        : null;
                Integer vDia = (diaVencimento != null && diaVencimento.size() > i) ? diaVencimento.get(i) : 10;

                boolean temHorarioFixo = hId != null;
                boolean temPersonalizado = hp != null && !hp.trim().isEmpty();

                if (temHorarioFixo || temPersonalizado || pId != null) {
                    criarMatricula(aluno, mId, hId, pId, hp, null, null, null, dInicio, dFim, vDia);
                }
            }
        }

        redirectAttributes.addFlashAttribute("success", "Nova(s) matrícula(s) adicionadas com sucesso!");
        return "redirect:/alunos";
    }

    @PostMapping("/matricula/editar")
    public String editarMatricula(@RequestParam Long matriculaId,
            @RequestParam Long alunoId,
            @RequestParam Long modalidadeId,
            @RequestParam(required = false) Long horarioId,
            @RequestParam(required = false) Long precoId,
            @RequestParam(required = false) String horarioPersonalizado,
            @RequestParam(required = false) List<String> diasPersonalizados,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) java.time.LocalTime horaInicioPersonalizada,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.TIME) java.time.LocalTime horaFimPersonalizada,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataInicioMatricula,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dataFimMatricula,
            @RequestParam(required = false) Integer diaVencimento,
            RedirectAttributes redirectAttributes) {

        Matricula matricula = matriculaService.buscarPorId(matriculaId);
        matricula.setModalidade(modalidadeService.buscarPorId(modalidadeId));

        if (horarioId != null) {
            matricula.setHorario(horarioService.buscarPorId(horarioId));
            matricula.setHorarioPersonalizado(null);
            matricula.setDiasPersonalizados(null);
            matricula.setHoraInicioPersonalizada(null);
            matricula.setHoraFimPersonalizada(null);
        } else {
            matricula.setHorario(null);
            if (diasPersonalizados != null && !diasPersonalizados.isEmpty()) {
                String diasStr = String.join("/", diasPersonalizados);
                matricula.setDiasPersonalizados(diasStr);
                matricula.setHoraInicioPersonalizada(horaInicioPersonalizada);
                matricula.setHoraFimPersonalizada(horaFimPersonalizada);

                String horarioDisplay = diasStr;
                if (horaInicioPersonalizada != null)
                    horarioDisplay += " " + horaInicioPersonalizada;
                if (horaFimPersonalizada != null)
                    horarioDisplay += "-" + horaFimPersonalizada;
                matricula.setHorarioPersonalizado(horarioDisplay);
            } else if (horarioPersonalizado != null && !horarioPersonalizado.isEmpty()) {
                matricula.setHorarioPersonalizado(horarioPersonalizado);
                matricula.setDiasPersonalizados(null);
            }
        }

        if (precoId != null) {
            matricula.setPreco(precoService.buscarPorId(precoId));
        }

        if (dataInicioMatricula != null)
            matricula.setDataInicio(dataInicioMatricula);
        matricula.setDataFim(dataFimMatricula);
        if (diaVencimento != null)
            matricula.setDiaVencimento(diaVencimento);

        matriculaService.salvar(matricula);

        redirectAttributes.addFlashAttribute("success", "Matrícula atualizada com sucesso!");
        return "redirect:/alunos/editar/" + alunoId;
    }

    // ... [Manter métodos editar e excluir iguais] ...
    @GetMapping("/editar/{id}")
    public String editar(@PathVariable Long id, Model model) {
        Aluno aluno = alunoService.buscarPorIdComMatriculas(id);
        model.addAttribute("aluno", aluno);
        model.addAttribute("modalidades", modalidadeService.listarTodas());
        model.addAttribute("horarios", horarioService.listarTodos());

        // Lógica de Status Financeiro para WhatsApp e Feedback Visual
        String statusFin = "PAGO";
        String msgCobranca = "Olá " + aluno.getNome() + ", obrigado por manter suas mensalidades em dia!";
        String corBotao = "success";

        List<Mensalidade> pendentes = mensalidadeRepository.findByAlunoIdAndStatus(id, StatusMensalidade.PENDENTE);
        LocalDate hoje = LocalDate.now();
        boolean temAtrasado = pendentes.stream()
                .anyMatch(m -> m.getVencimento() != null && m.getVencimento().isBefore(hoje));

        if (temAtrasado) {
            statusFin = "INADIMPLENTE";
            msgCobranca = "Olá " + aluno.getNome() + ", notamos que há mensalidade(s) em atraso. Poderia verificar?";
            corBotao = "danger";
        } else if (!pendentes.isEmpty()) {
            statusFin = "PENDENTE";
            msgCobranca = "Olá " + aluno.getNome() + ", sua mensalidade vence em breve. Segue lembrete de pagamento.";
            corBotao = "warning";
        }

        model.addAttribute("statusFinanceiro", statusFin);
        model.addAttribute("msgCobranca", msgCobranca);
        model.addAttribute("mapaLivres", disponibilidadeService.getDisponibilidadeSemana());
        model.addAttribute("corBotaoFinanceiro", corBotao);

        // Pre-load all prices formatted for JS
        List<java.util.Map<String, Object>> precosList = precoService.listarTodos().stream().map(p -> {
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", p.getId());
            map.put("valor", p.getValor() != null ? p.getValor().toString() : "0.00");
            map.put("descricao", p.getDescricao());
            map.put("frequenciaSemanal", p.getFrequenciaSemanal());
            map.put("modalidadeId", p.getModalidade() != null ? p.getModalidade().getId() : null);
            return map;
        }).collect(java.util.stream.Collectors.toList());

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            model.addAttribute("todosPrecosJson", mapper.writeValueAsString(precosList));
        } catch (Exception e) {
            model.addAttribute("todosPrecosJson", "[]");
            e.printStackTrace();
        }

        // Histórico de Presenças puxando apenas do Mês Atual para os Cálculos de
        // dashboard
        List<Presenca> historicoCompleto = presencaRepository.findByMatriculaAlunoIdOrderByDataDesc(id);

        long presencasMes = 0;
        long faltasMes = 0;

        for (Presenca p : historicoCompleto) {
            if (p.getData() != null && p.getData().getYear() == hoje.getYear()
                    && p.getData().getMonth() == hoje.getMonth()) {
                if (p.isPresente()) {
                    presencasMes++;
                } else {
                    faltasMes++;
                }
            }
        }

        long totalMes = presencasMes + faltasMes;
        int porcentagemMes = totalMes > 0 ? (int) Math.round(((double) presencasMes / totalMes) * 100) : 0;

        model.addAttribute("historicoPresencas", historicoCompleto);
        model.addAttribute("presencasMes", presencasMes);
        model.addAttribute("faltasMes", faltasMes);
        model.addAttribute("totalMes", totalMes);
        model.addAttribute("porcentagemMes", porcentagemMes);

        return "aluno-form";
    }

    @PostMapping("/excluir/{id}")
    public String excluir(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            alunoService.deletar(id);
            redirectAttributes.addFlashAttribute("success", "Aluno excluído com sucesso!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error",
                    "Não foi possível excluir o aluno. Verifique se há registros financeiros ou matrículas ativas.");
        }
        return "redirect:/alunos";
    }

    @PostMapping("/presenca/{id}/observacao")
    public String salvarObservacaoPresenca(@PathVariable Long id, @RequestParam("observacao") String observacao,
            @RequestParam("alunoId") Long alunoId, @RequestParam(value = "origem", defaultValue = "") String origem,
            RedirectAttributes redirectAttributes) {
        presencaRepository.findById(id).ifPresent(presenca -> {
            presenca.setObservacao(observacao);
            presencaRepository.save(presenca);
        });
        redirectAttributes.addFlashAttribute("success", "Observação da presença/falta salva com sucesso!");

        if ("diario".equals(origem)) {
            return "redirect:/diario/historico/" + alunoId;
        }
        return "redirect:/alunos/editar/" + alunoId + "#historico-presencas";
    }

    // Método Auxiliar para criar matrícula (DRY)
    private void criarMatricula(Aluno aluno, Long modalidadeId, Long horarioId, Long precoId,
            String horarioPersonalizado, List<String> diasPersonalizados,
            java.time.LocalTime inicio, java.time.LocalTime fim, LocalDate dataInicio, LocalDate dataFim,
            Integer diaVencimento) {
        Matricula matricula = new Matricula();
        matricula.setAluno(aluno);
        matricula.setModalidade(modalidadeService.buscarPorId(modalidadeId));

        if (horarioId != null) {
            matricula.setHorario(horarioService.buscarPorId(horarioId));
        }

        // Lógica Hibrida: Salva String legível E Dados Estruturados
        if (diasPersonalizados != null && !diasPersonalizados.isEmpty()) {
            String diasStr = String.join("/", diasPersonalizados);
            matricula.setDiasPersonalizados(diasStr);
            matricula.setHoraInicioPersonalizada(inicio);
            matricula.setHoraFimPersonalizada(fim);

            // Monta string amigavel para exibir na tabela
            String horarioDisplay = diasStr;
            if (inicio != null)
                horarioDisplay += " " + inicio;
            if (fim != null)
                horarioDisplay += "-" + fim;
            matricula.setHorarioPersonalizado(horarioDisplay);
        } else if (horarioPersonalizado != null && !horarioPersonalizado.isEmpty()) {
            // Fallback antigo
            matricula.setHorarioPersonalizado(horarioPersonalizado);
        }

        if (precoId != null) {
            matricula.setPreco(precoService.buscarPorId(precoId));
        } else {
            // Fallback: tenta pegar o primeiro preço da modalidade
            var precos = precoService.listarPorModalidade(modalidadeId);
            if (!precos.isEmpty()) {
                matricula.setPreco(precos.get(0));
            }
        }

        matricula.setDataInicio(dataInicio != null ? dataInicio : LocalDate.now());
        matricula.setDataFim(dataFim);
        matricula.setDiaVencimento(diaVencimento != null ? diaVencimento : 10); // Padrão 10 se não informado
        matricula.setAtivo(true);

        matriculaService.salvar(matricula);
    }
}
