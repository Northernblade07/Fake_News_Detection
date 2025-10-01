// components/charts/OutcomeDonut.tsx
'use client';

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

type Props = { fake: number; real: number; unknown: number };

export function OutcomeDonut({ fake, real, unknown }: Props) {
  const data = {
    labels: ['Fake', 'Real', 'Unknown'],
    datasets: [
      {
        label: 'Outcomes',
        data: [fake, real, unknown],
        backgroundColor: ['#EF4444', '#10B981', '#60A5FA'],
        borderColor: ['#121827'], // brand-card
        borderWidth: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    cutout: '70%',
    plugins: {
        legend: {
            position: 'bottom' as const,
            labels: {
                color: '#94a3b8',
                usePointStyle: true,
                boxWidth: 8,
            }
        }
    }
  }

  return (
    <div className="rounded-2xl border border-brand-border bg-brand-card p-6 shadow-lg">
      <h4 className="mb-4 text-sm font-semibold text-slate-300">Outcome Distribution</h4>
      <div className='mx-auto max-w-[250px]'>
         <Doughnut data={data} options={options}/>
      </div>
    </div>
  );
}