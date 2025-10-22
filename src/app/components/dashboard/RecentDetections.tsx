// components/dashboard/RecentJobs.tsx
import type { DetectionJob, Verdict } from '@/app/types';
import { CheckCircle2, AlertTriangle, Clock, File, Link2, Type } from 'lucide-react';
import { JSX } from 'react';

// Status mapping
const statusMap: Record<DetectionJob['status'], { icon: JSX.Element; text: string }> = {
  completed: { icon: <CheckCircle2 className="text-green-500" />, text: 'Completed' },
  running: { icon: <Clock className="text-yellow-500 animate-pulse" />, text: 'Running' },
  pending: { icon: <AlertTriangle className="text-orange-500" />, text: 'Pending' },
};

// Verdict mapping
const verdictMap: Record<Verdict, { className: string; text: string }> = {
  fake: { className: 'bg-red-500/10 text-red-400', text: 'Fake' },
  real: { className: 'bg-green-500/10 text-green-400', text: 'Real' },
  unknown: { className: 'bg-blue-500/10 text-blue-400', text: 'Unknown' },
};

// Source type mapping
const sourceTypeMap: Record<DetectionJob['sourceType'], JSX.Element> = {
  file: <File size={16} />,
  url: <Link2 size={16} />,
  text: <Type size={16} />,
};

interface RecentJobsProps {
  jobs: DetectionJob[];
}

export function RecentJobs({ jobs }: RecentJobsProps) {
  return (
    <div className="auth-card">
      <h4 className="mb-4 text-sm font-semibold text-slate-300">Recent Jobs</h4>
      <ul className="space-y-3">
        {jobs.map(job => {
          // Smart title fallback
          const displayTitle =
  job.title?.trim() && job.title.toLowerCase() !== "untitled"
    ? job.title.trim()
    : job.textPreview?.trim() ||
      (job.fileType?.toUpperCase()) ||
      "Untitled";

          return (
            <li
              key={job.id}
              className="flex items-center justify-between rounded-lg bg-[#0f1524] p-3"
            >
              {/* Left side: Source type + title */}
              <div className="flex items-center gap-3">
                <div className="text-slate-400">{sourceTypeMap[job.sourceType]}</div>
                <span className="text-sm font-medium text-slate-200">{displayTitle}</span>
              </div>

              {/* Right side: Verdict */}
              {job.verdict ? (
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-md ${verdictMap[job.verdict].className}`}
                >
                  {verdictMap[job.verdict].text.toUpperCase()}
                  {typeof job.confidence === 'number' ? ` (${(job.confidence * 100).toFixed(0)}%)` : ''}
                </span>
              ) : (
                <div className="text-slate-500">&mdash;</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
