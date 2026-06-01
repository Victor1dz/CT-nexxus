"use client"

import { useTransition } from "react"
import { excluirAnamnese } from "@/app/actions"

interface Props {
  anamneseId: number
  alunoId: number
}

export default function ExcluirAnamneseButton({ anamneseId, alunoId }: Props) {
  const [isPending, startTransition] = useTransition()

  const handleDelete = () => {
    if (confirm("Tem certeza que deseja excluir permanentemente esta avaliação física? Essa ação não pode ser desfeita e ela sairá do histórico.")) {
      startTransition(async () => {
        const res = await excluirAnamnese(anamneseId)
        if (res.success) {
          window.location.href = `/alunos/${alunoId}/anamnese?deleted=true`
        } else {
          alert(`Erro ao excluir avaliação: ${res.error || 'Erro desconhecido'}`)
        }
      })
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 hover:border-rose-300 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer text-xs font-extrabold uppercase tracking-wider disabled:opacity-50 shadow-sm"
    >
      <i className={`bi ${isPending ? 'bi-hourglass-split animate-spin' : 'bi-trash3-fill'}`}></i>
      {isPending ? 'Excluindo...' : 'Excluir Avaliação'}
    </button>
  )
}
