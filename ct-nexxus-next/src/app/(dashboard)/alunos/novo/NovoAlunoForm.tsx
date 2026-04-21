"use client"

import { useState } from "react";
import { Modalidade, Preco, Horario } from "@/types";

interface Props {
  initialModalidades: Modalidade[]
  initialPrecos: Preco[]
  initialHorarios: Horario[]
}

export default function NovoAlunoForm({ initialModalidades, initialPrecos, initialHorarios }: Props) {
  const [modalidades, setModalidades] = useState<Modalidade[]>(initialModalidades);
  const [todosPrecos, setTodosPrecos] = useState<Preco[]>(initialPrecos);
  const [todosHorarios, setTodosHorarios] = useState<Horario[]>(initialHorarios);

  // State for the Block
  const [selectedMod, setSelectedMod] = useState<number | "">("");
  const [selectedPreco, setSelectedPreco] = useState<number | "">("");
  const [selectedHorario, setSelectedHorario] = useState<number | "custom" | "">("");
  const [isCustomHorario, setIsCustomHorario] = useState(false);

  const selectedModObj = modalidades.find(m => m.id === Number(selectedMod));
  const exigeHorario = selectedModObj?.exigeHorario ?? false;

  // Filter Precos
  const precosFiltrados = todosPrecos.filter(p => p.modalidade.id === Number(selectedMod));
  
  // Filter Horarios
  const horariosFiltrados = todosHorarios.filter(h => h.modalidade.id === Number(selectedMod));

  const currentPreco = todosPrecos.find(p => p.id === Number(selectedPreco));
  const displayValor = currentPreco ? `R$ ${currentPreco.valor}` : "R$ 0,00";

  return (
    <div className="container mt-4">
      <div className="card mb-4 border-0 shadow-sm">
        <div className="card-header bg-white py-3 border-bottom-0 d-flex justify-content-between align-items-center">
          <h5 className="card-title fw-bold text-success mb-0"><i className="bi bi-journal-check"></i> Planos / Modalidades</h5>
          <button type="button" className="btn btn-sm btn-outline-success">
            <i className="bi bi-plus-circle"></i> Adicionar Outro Plano
          </button>
        </div>

        <div className="card-body bg-light">
          <div className="matricula-block border border-success border-opacity-25 rounded p-3 mb-4 bg-white">
            <div className="row">
              {/* Modalidade */}
              <div className="col-md-4 mb-3">
                <label className="form-label fw-bold">Modalidade <span className="text-danger">*</span></label>
                <select 
                  className="form-select" required
                  value={selectedMod}
                  onChange={e => {
                    setSelectedMod(e.target.value ? Number(e.target.value) : "");
                    setSelectedPreco("");
                    setSelectedHorario("");
                    setIsCustomHorario(false);
                  }}
                >
                  <option value="">Selecione...</option>
                  {modalidades.map(m => (
                    <option key={m.id} value={m.id}>{m.nome}</option>
                  ))}
                </select>
              </div>

              {/* Preço */}
              <div className="col-md-4 mb-3">
                <label className="form-label fw-bold">Plano / Frequência <span className="text-danger">*</span></label>
                <select 
                  className="form-select" required
                  value={selectedPreco}
                  onChange={e => setSelectedPreco(e.target.value ? Number(e.target.value) : "")}
                >
                  {!selectedMod ? (
                    <option value="">Selecione a modalidade primeiro...</option>
                  ) : precosFiltrados.length === 0 ? (
                    <option value="">Sem planos cadastrados nesta Modalidade</option>
                  ) : (
                    <>
                      <option value="">Selecione o Plano...</option>
                      {precosFiltrados.map(p => (
                        <option key={p.id} value={p.id}>{p.descricao}</option>
                      ))}
                    </>
                  )}
                </select>
                <small className="text-primary fw-bold mt-1 d-block">Valor: {displayValor}</small>
              </div>

              {/* Horário */}
              <div className="col-md-4 mb-3">
                <label className="form-label fw-bold">Horário de Preferência</label>
                
                {!isCustomHorario && !exigeHorario ? (
                  <>
                    <select 
                      className="form-select"
                      value={selectedHorario}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === "custom") {
                          setIsCustomHorario(true);
                        } else {
                          setSelectedHorario(val ? Number(val) : "");
                        }
                      }}
                    >
                      <option value="">Selecione...</option>
                      {horariosFiltrados.map(h => (
                        <option key={h.id} value={h.id}>{h.horaInicio ? `${h.horaInicio} - ` : ''}{h.modalidade.nome} | {h.diasSemana}</option>
                      ))}
                      <option value="custom">A Combinar / Horário Livre</option>
                    </select>
                  </>
                ) : null}

                {(isCustomHorario || exigeHorario) && (
                  <div className="mt-2 p-3 bg-light border rounded">
                    <div className="d-flex justify-content-between">
                       <h6 className="text-muted fw-bold mb-3">Horário Personalizado</h6>
                       {!exigeHorario && (
                         <button type="button" className="btn-close" onClick={() => { setIsCustomHorario(false); setSelectedHorario(""); }}></button>
                       )}
                    </div>
                    {/* Checkboxes etc. */}
                    <div className="p-2 border rounded border-success text-success fw-bold">Modo Horário Livre ativado</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
