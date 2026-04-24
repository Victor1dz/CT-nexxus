"use client"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function RelatoriosClient({ data }: { data: any }) {
  const { receitaLabels, receitaData, alunosLabels, alunosData, diasLabels, diasData } = data

  const receitaChartData = {
    labels: receitaLabels,
    datasets: [
      {
        label: 'Receita (R$)',
        data: receitaData,
        backgroundColor: ['#2c3e50', '#3498db', '#e74c3c', '#f1c40f', '#2ecc71', '#9b59b6'],
        borderWidth: 1,
      },
    ],
  }

  const alunosChartData = {
    labels: alunosLabels,
    datasets: [
      {
        label: 'Alunos Ativos',
        data: alunosData,
        backgroundColor: '#3498db',
        borderRadius: 4,
      },
    ],
  }

  const frequenciaChartData = {
    labels: diasLabels,
    datasets: [
      {
        fill: true,
        label: 'Presenças Confirmadas',
        data: diasData,
        borderColor: '#e74c3c',
        backgroundColor: 'rgba(231, 76, 60, 0.2)',
        tension: 0.4,
      },
    ],
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-100 bg-slate-50 p-4">
            <h5 className="font-bold text-[#2c3e50]">Receita por Modalidade</h5>
          </div>
          <div className="p-6 flex-1 flex items-center justify-center min-h-[300px]">
            <div className="w-full max-w-[300px]">
              {receitaLabels.length > 0 ? (
                <Doughnut data={receitaChartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
              ) : (
                <p className="text-center text-slate-400">Sem dados suficientes.</p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="border-b border-slate-100 bg-slate-50 p-4">
            <h5 className="font-bold text-[#2c3e50]">Alunos por Modalidade</h5>
          </div>
          <div className="p-6 flex-1 flex items-center justify-center min-h-[300px]">
            {alunosLabels.length > 0 ? (
              <Bar data={alunosChartData} options={{ responsive: true, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} />
            ) : (
              <p className="text-center text-slate-400">Sem dados suficientes.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="border-b border-slate-100 bg-slate-50 p-4">
          <h5 className="font-bold text-[#2c3e50]">Frequência por Dia da Semana (Dias Mais Movimentados)</h5>
        </div>
        <div className="p-6 h-[300px]">
          {diasLabels.length > 0 ? (
            <Line data={frequenciaChartData} options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} />
          ) : (
            <p className="text-center text-slate-400 h-full flex items-center justify-center">Sem dados suficientes.</p>
          )}
        </div>
      </div>
    </div>
  )
}
