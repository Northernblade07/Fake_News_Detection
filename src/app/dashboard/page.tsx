// app/dashboard/page.tsx
'use client'; // Required for GSAP animations and hooks

import Link from 'next/link';
import { useRef } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

// Import Components
import { StatsCard } from '@/app/components/dashboard/StatCard';
import { AnalysesLine } from '@/app/components/charts/AnalysisLine';
import { OutcomeDonut } from '@/app/components/charts/OutcomeDonut';
import { RecentJobs } from '@/app/components/dashboard/RecentDetections';

// Import Types
import type { DashboardStats, TimeseriesPoint, DetectionJob } from '@/app/types';

// Import Icons
import { TrendingUp, ShieldAlert, ShieldCheck, HelpCircle, ScanLine } from 'lucide-react';

// Mock Data (in a real app, this would come from a client-side fetch or props)
const stats: DashboardStats = { total: 24, fake: 10, real: 12, unknown: 2, running: 3, pending: 1 };
const series: TimeseriesPoint[] = [
  { date: 'Mon', count: 16 }, { date: 'Tue', count: 22 }, { date: 'Wed', count: 18 },
  { date: 'Thu', count: 26 }, { date: 'Fri', count: 20 }, { date: 'Sat', count: 14 }, { date: 'Sun', count: 28 },
];
const jobs: DetectionJob[] = [
  { id: 'j1', sourceType: 'file', fileType: 'video', status: 'completed', submittedAt: new Date().toISOString(), verdict: 'fake', confidence: 0.92 },
  { id: 'j2', sourceType: 'url', status: 'running', submittedAt: new Date().toISOString() },
  { id: 'j3', sourceType: 'text', status: 'pending', submittedAt: new Date().toISOString() },
  { id: 'j4', sourceType: 'file', fileType: 'audio', status: 'completed', submittedAt: new Date().toISOString(), verdict: 'real', confidence: 0.98 },
];


export default function DashboardPage() {
  const container = useRef(null);

  useGSAP(() => {
    // Animate all elements with the 'dashboard-card' class
    gsap.from(".dashboard-card", {
      duration: 0.8,
      opacity: 0,
      y: 30,
      ease: "power3.out",
      stagger: 0.1,
    });
  }, { scope: container });

  return (
    <div ref={container} className='scrollbar-hide'>
      {/* Header row */}
      <div className="dashboard-card mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 sm:text-3xl">Dashboard</h1>
          <p className="mt-1.5 text-sm text-slate-400">Your AI-powered mission control for truth.</p>
        </div>
        <Link href="/detect" className="btn-primary w-full sm:w-auto text-sm inline-flex items-center gap-2">
            <ScanLine size={16} />
            Detect New Content
        </Link>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="dashboard-card"><StatsCard title="Total Analyses" value={stats.total} icon={<TrendingUp size={20}/>} /></div>
        <div className="dashboard-card"><StatsCard title="Fake Verdicts" value={stats.fake} icon={<ShieldAlert size={20}/>} /></div>
        <div className="dashboard-card"><StatsCard title="Real Verdicts" value={stats.real} icon={<ShieldCheck size={20}/>} /></div>
        <div className="dashboard-card"><StatsCard title="Unknown" value={stats.unknown} icon={<HelpCircle size={20}/>} /></div>
      </div>
      
      {/* Main Content Grid */}
      <div className="mt-2 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="dashboard-card lg:col-span-2">
            <AnalysesLine series={series} />
        </div>
        <div className="dashboard-card lg:col-span-1">
            <OutcomeDonut fake={stats.fake} real={stats.real} unknown={stats.unknown} />
        </div>
        <div className="dashboard-card lg:col-span-3">
            <RecentJobs jobs={jobs} />
        </div>
      </div>
    </div>
  );
}