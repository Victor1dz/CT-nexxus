"use client"

import { excluirModalidade } from '@/app/actions'

export function DeleteModalidadeButton({ id }: { id: number }) {
  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault()
    if (confirm('Tem certeza que deseja excluir esta modalidade? Isso removerá permanentemente TODOS os preços, turmas/horários, matrículas, presenças e cobranças associadas a ela. Esta ação NÃO pode ser desfeita.')) {
      await excluirModalidade(id)
    }
  }

  return (
    <form onSubmit={handleDelete} className="inline">
      <button type="submit" className="w-8 h-8 flex items-center justify-center rounded bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200 transition-colors" title="Excluir">
        <i className="bi bi-trash"></i>
      </button>
    </form>
  )
}
