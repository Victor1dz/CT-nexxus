package br.com.ctnexxus.controller;

import br.com.ctnexxus.model.Aluno;
import br.com.ctnexxus.model.Anamnese;
import br.com.ctnexxus.model.FichaTreino;
import br.com.ctnexxus.model.TreinoDia;
import br.com.ctnexxus.repository.AnamneseRepository;
import br.com.ctnexxus.repository.FichaTreinoRepository;
import br.com.ctnexxus.repository.TreinoDiaRepository;
import br.com.ctnexxus.service.AlunoService;
import br.com.ctnexxus.service.SmartTreinoService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.time.LocalDate;
import java.util.List;

@Controller
@RequestMapping("/fichas")
public class FichaTreinoController {

    private final FichaTreinoRepository fichaRepository;
    private final TreinoDiaRepository treinoRepository;
    private final AlunoService alunoService;
    private final SmartTreinoService smartTreinoService;
    private final AnamneseRepository anamneseRepository;

    public FichaTreinoController(FichaTreinoRepository fichaRepository, TreinoDiaRepository treinoRepository,
            AlunoService alunoService, SmartTreinoService smartTreinoService,
            AnamneseRepository anamneseRepository) {
        this.fichaRepository = fichaRepository;
        this.treinoRepository = treinoRepository;
        this.alunoService = alunoService;
        this.smartTreinoService = smartTreinoService;
        this.anamneseRepository = anamneseRepository;
    }

    @GetMapping("/aluno/{alunoId}")
    public String verFicha(@PathVariable Long alunoId, Model model) {
        Aluno aluno = alunoService.buscarPorId(alunoId);
        List<FichaTreino> fichas = fichaRepository.findByAlunoId(alunoId);

        // Busca anamnese para exibir no topo
        Anamnese anamnese = anamneseRepository.findByAlunoId(alunoId);

        // Ordena por data de início (mais recente primeiro)
        fichas.sort((f1, f2) -> f2.getDataInicio().compareTo(f1.getDataInicio()));

        model.addAttribute("aluno", aluno);
        model.addAttribute("fichas", fichas);
        model.addAttribute("anamnese", anamnese); // Passa para a view
        model.addAttribute("novaFicha", new FichaTreino()); // Para o modal de criar nova
        model.addAttribute("novoTreino", new TreinoDia()); // Para adicionar aula

        return "ficha-treino";
    }

    @PostMapping("/aluno/{alunoId}/nova")
    public String criarNovaFicha(@PathVariable Long alunoId, @ModelAttribute FichaTreino ficha) {
        Aluno aluno = alunoService.buscarPorId(alunoId);

        // Arquivas as anteriores
        List<FichaTreino> anteriores = fichaRepository.findByAlunoId(alunoId);
        for (FichaTreino f : anteriores) {
            f.setAtiva(false);
            fichaRepository.save(f);
        }

        ficha.setAluno(aluno);
        ficha.setAtiva(true);
        // Data atual como padrão se não vier
        if (ficha.getDataInicio() == null)
            ficha.setDataInicio(LocalDate.now());
        if (ficha.getDataFim() == null)
            ficha.setDataFim(LocalDate.now().plusMonths(1));

        fichaRepository.save(ficha);
        return "redirect:/fichas/aluno/" + alunoId;
    }

    @PostMapping("/{fichaId}/clonar")
    public String clonarFicha(@PathVariable Long fichaId, RedirectAttributes redirectAttributes) {
        try {
            FichaTreino original = fichaRepository.findById(fichaId).orElseThrow();

            // Arquivas as anteriores
            List<FichaTreino> anteriores = fichaRepository.findByAlunoId(original.getAluno().getId());
            for (FichaTreino f : anteriores) {
                f.setAtiva(false);
                fichaRepository.save(f);
            }

            // Criar Nova Ficha
            FichaTreino clone = new FichaTreino();
            clone.setAluno(original.getAluno());
            clone.setDataInicio(LocalDate.now()); // Data de hoje
            clone.setDataFim(LocalDate.now().plusMonths(1));
            clone.setObjetivoFicha(original.getObjetivoFicha());
            clone.setObservacoesIA(original.getObservacoesIA() + " (Cópia)");
            clone.setAtiva(true);

            FichaTreino salvo = fichaRepository.save(clone);

            // Copiar Treinos
            if (original.getTreinos() != null) {
                for (TreinoDia treinoOriginal : original.getTreinos()) {
                    TreinoDia treinoClone = new TreinoDia();
                    treinoClone.setFichaTreino(salvo);
                    treinoClone.setDiaSemana(treinoOriginal.getDiaSemana());
                    treinoClone.setFocoDoDia(treinoOriginal.getFocoDoDia());
                    treinoClone.setDescricaoExercicios(treinoOriginal.getDescricaoExercicios()); // Copia a descrição de
                                                                                                 // texto

                    treinoRepository.save(treinoClone);
                }
            }

            redirectAttributes.addFlashAttribute("success", "Ficha clonada com sucesso! Data atualizada para hoje.");
            return "redirect:/fichas/aluno/" + original.getAluno().getId();

        } catch (Exception e) {
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("error", "Erro ao clonar ficha.");
            return "redirect:/alunos"; // Fallback
        }
    }

    @PostMapping("/{fichaId}/treinos/novo")
    public String adicionarTreino(@PathVariable Long fichaId, @ModelAttribute TreinoDia treinoDia) {
        FichaTreino ficha = fichaRepository.findById(fichaId)
                .orElseThrow(() -> new IllegalArgumentException("Ficha inválida"));

        int numeroAula = ficha.getTreinos().size() + 1;
        if (treinoDia.getDiaSemana() == null || treinoDia.getDiaSemana().isEmpty()) {
            treinoDia.setDiaSemana("Aula " + numeroAula);
        }

        treinoDia.setFichaTreino(ficha);
        if (treinoDia.getFocoDoDia() == null || treinoDia.getFocoDoDia().isEmpty()) {
            treinoDia.setFocoDoDia("Treino do Dia");
        }

        treinoRepository.save(treinoDia);
        return "redirect:/fichas/aluno/" + ficha.getAluno().getId();
    }

    @PostMapping("/{fichaId}/treinos/{treinoId}/editar")
    public String editarTreino(
            @PathVariable Long fichaId,
            @PathVariable Long treinoId,
            @ModelAttribute TreinoDia treinoAtualizado,
            RedirectAttributes redirectAttributes) {
        try {
            FichaTreino ficha = fichaRepository.findById(fichaId)
                    .orElseThrow(() -> new IllegalArgumentException("Ficha inválida"));

            TreinoDia treinoExistente = treinoRepository.findById(treinoId)
                    .orElseThrow(() -> new IllegalArgumentException("Treino inválido"));

            treinoExistente.setDiaSemana(treinoAtualizado.getDiaSemana());
            treinoExistente.setFocoDoDia(treinoAtualizado.getFocoDoDia());
            treinoExistente.setDescricaoExercicios(treinoAtualizado.getDescricaoExercicios());

            treinoRepository.save(treinoExistente);
            redirectAttributes.addFlashAttribute("success", "Aula/Treino atualizado com sucesso!");

            return "redirect:/fichas/aluno/" + ficha.getAluno().getId();
        } catch (Exception e) {
            e.printStackTrace();
            redirectAttributes.addFlashAttribute("error", "Erro ao atualizar treino.");
            return "redirect:/fichas";
        }
    }

    @PostMapping("/{fichaId}/excluir")
    public String excluirFicha(@PathVariable Long fichaId) {
        FichaTreino ficha = fichaRepository.findById(fichaId).orElseThrow();
        Long alunoId = ficha.getAluno().getId();
        fichaRepository.delete(ficha);
        return "redirect:/fichas/aluno/" + alunoId;
    }

    @PostMapping("/aluno/{alunoId}/gerar-ia")
    public String gerarTreineIA(@PathVariable Long alunoId, RedirectAttributes redirectAttributes) {
        try {
            Aluno aluno = alunoService.buscarPorId(alunoId);
            smartTreinoService.gerarFichaInteligente(aluno);
            redirectAttributes.addFlashAttribute("success", "Treino gerado pela IA com sucesso!");
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Erro ao gerar treino: " + e.getMessage());
        }
        return "redirect:/fichas/aluno/" + alunoId;
    }
}
