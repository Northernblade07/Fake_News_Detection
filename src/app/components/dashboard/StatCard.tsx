// components/ui/StatsCard.tsx
import { ReactNode } from 'react';

type Props = {
  title: string;
  value: string | number;
  hint?: string;
  icon: ReactNode;
};

export function StatsCard({ title, value, hint, icon }: Props) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-card p-5 shadow-lg">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">{title}</span>
        <div className="text-brand-blue">{icon}</div>
      </div>
      <div className="mt-2 text-3xl font-semibold text-slate-100">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </div>
  );
}