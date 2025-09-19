// components/charts/AnalysesLine.tsx
'use client';

import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import type { TimeseriesPoint } from '@/app/types';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

type Props = { series: TimeseriesPoint[] };

export function AnalysesLine({ series }: Props) {
  const labels = series.map(p => p.date);
  const data = {
    labels,
    datasets: [
      {
        label: 'Analyses',
        data: series.map(p => p.count),
        fill: true,
        borderColor: '#60A5FA', // brand-blue
        backgroundColor: 'rgba(96, 165, 250, 0.15)',
        tension: 0.4,
        pointRadius: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: {
        grid: { color: 'rgba(255, 255, 255, 0.08)' },
        ticks: { color: '#94a3b8' }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.08)' },
        ticks: { color: '#94a3b8' }
      },
    },
  } as const;

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-card p-2 shadow-lg h-[300px]">
      <h4 className="mb-2 text-sm font-semibold text-slate-300">Project Analytics</h4>
      <Line data={data} options={options} />
    </div>
  );
}