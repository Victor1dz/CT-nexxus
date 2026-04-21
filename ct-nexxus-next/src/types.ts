export type Modalidade = {
  id: number;
  nome: string;
  exigeHorario: boolean;
};

export type Preco = {
  id: number;
  valor: string;
  descricao: string;
  frequenciaSemanal: number;
  modalidade: { id: number };
};

export type Horario = {
  id: number;
  diasSemana: string;
  horaInicio: string;
  horaFim: string;
  modalidade: { id: number; nome: string };
};
