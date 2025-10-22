'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';

// Components
import { StatsCard } from '@/app/components/dashboard/StatCard';
import { AnalysesLine } from '@/app/components/charts/AnalysisLine';
import { OutcomeDonut } from '@/app/components/charts/OutcomeDonut';
import { RecentJobs } from '@/app/components/dashboard/RecentDetections';

// Icons
import { TrendingUp, ShieldAlert, ShieldCheck, HelpCircle, ScanLine } from 'lucide-react';

// Types
interface DashboardStats {
  total: number;
  fake: number;
  real: number;
  unknown: number;
  running?: number;
  pending?: number;
}

interface DetectionJob {
  id: string;
  title:string;
  textPreview:string;
  sourceType: 'text' | 'file' | 'url';
  fileType?: string;
  status: 'completed' | 'running' | 'pending';
  submittedAt: string;
  verdict?: 'fake' | 'real' | 'unknown';
  confidence?: number;
}

interface TimeseriesPoint {
  date: string;
  count: number;
}

export default function DashboardPage() {
  const container = useRef<HTMLDivElement | null>(null);

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [jobs, setJobs] = useState<DetectionJob[]>([]);
  const [series, setSeries] = useState<TimeseriesPoint[]>([]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // Fetch stats
        const statsRes = await fetch('/api/dashboard/stats', { cache: 'no-store' });
        const statsData: DashboardStats = await statsRes.json();
        setStats(statsData);

        // Fetch recent jobs
        const recentRes = await fetch('/api/dashboard/recent?limit=10', { cache: 'no-store' });
        console.log(recentRes)
        const recentJobs: DetectionJob[] = await recentRes.json();
 console.log(recentJobs)
        setJobs(recentJobs);

        // Build series for analytics chart
        const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const seriesData: TimeseriesPoint[] = weekdays.map((day, idx) => {
          const count = recentJobs.filter(job => {
            const date = new Date(job.submittedAt);
            return date.getDay() === idx;
          }).length;
          return { date: day, count };
        });
        setSeries(seriesData);
      } catch (error) {
        console.error('Dashboard fetch error:', error);
      }
    }

    fetchDashboardData();
  }, []);

  useGSAP(() => {
    gsap.from('.dashboard-card', {
      duration: 0.8,
      opacity: 0,
      y: 30,
      ease: 'power3.out',
      stagger: 0.1,
    });
  }, { scope: container });

  if (!stats) return <div className="text-slate-400 p-6">Loading dashboard...</div>;

  return (
    <div ref={container} className="scrollbar-hide">
      {/* Header */}
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        <div className="dashboard-card"><StatsCard title="Total Analyses" value={stats.total} icon={<TrendingUp size={20} />} /></div>
        <div className="dashboard-card"><StatsCard title="Fake Verdicts" value={stats.fake} icon={<ShieldAlert size={20} />} /></div>
        <div className="dashboard-card"><StatsCard title="Real Verdicts" value={stats.real} icon={<ShieldCheck size={20} />} /></div>
        <div className="dashboard-card"><StatsCard title="Unknown" value={stats.unknown} icon={<HelpCircle size={20} />} /></div>
      </div>

      {/* Main Grid */}
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
