import { getModalidades, getPrecos, getHorarios } from "@/app/actions"
import NovoAlunoForm from "./NovoAlunoForm"

export const dynamic = "force-dynamic"

export default async function Page() {
  const modalidades = await getModalidades()
  const precos = await getPrecos()
  const horarios = await getHorarios()

  return (
    <NovoAlunoForm 
      initialModalidades={modalidades}
      initialPrecos={precos}
      initialHorarios={horarios}
    />
  )
}
