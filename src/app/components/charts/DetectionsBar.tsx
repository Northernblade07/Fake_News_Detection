// components/charts/DetectionsBar.tsx
'use client';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { detectionHistory } from '@/app/lib/mockdata';

export function DetectionsBar() {
  return (
    <div className="rounded-xl bg-card p-6 shadow-soft">
      <h3 className="mb-4 text-lg font-semibold">Detection History</h3>
      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={detectionHistory}>
            <XAxis dataKey="name" stroke="#94A3B8" tickLine={false} axisLine={false} />
            <YAxis stroke="#94A3B8" tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(59,130,246,0.08)' }}
              contentStyle={{ backgroundColor: '#0B1220', border: '1px solid #1E293B', color: '#E2E8F0' }}
            />
            <Bar dataKey="detections" fill="#3B82F6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
