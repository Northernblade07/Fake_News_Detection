// app/types/index.ts

// ---------------------------------------------
// General types
// ---------------------------------------------
export type Verdict = 'fake' | 'real' | 'unknown';
export type DetectionStatus = 'pending' | 'processing' | 'done' | 'error';
export type SourceType = 'text' | 'url' | 'file';
export type FileType = 'image' | 'video' | 'audio' | 'pdf' | 'other';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  plan?: 'free' | 'pro';
}

// ---------------------------------------------
// Dashboard statistics (from /api/dashboard/stats)
// ---------------------------------------------
export interface DashboardStats {
  total: number;        // total detections
  fake: number;         // number of fake verdicts
  real: number;         // number of real verdicts
  unknown: number;      // number of unknown verdicts
  running: number;      // processing analyses
  pending: number;      // pending analyses
}

// ---------------------------------------------
// Timeseries data for analytics charts
// ---------------------------------------------
export interface TimeseriesPoint {
  date: string;         // e.g., 'Mon', 'Tue', or full ISO date
  count: number;        // number of detections
  label?: string;       // optional shorthand for chart labels
}

// ---------------------------------------------
// Detection object returned from NewsDetection model
// ---------------------------------------------
export interface Detection {
  id: string;                // NewsDetection _id
  title?: string;            // optional news title
  type: SourceType;           // 'text' | 'file' | 'url'
  fileType?: FileType;        // only for file type
  status: DetectionStatus;    // 'pending' | 'processing' | 'done' | 'error'
  submittedAt: string;        // createdAt
  verdict?: Verdict;          // result label
  confidence?: number;        // result probability
  hasMedia?: boolean;         // if media exists
}

// ---------------------------------------------
// Detection job shown on dashboard recent jobs
// ---------------------------------------------
export interface DetectionJob {
  id: string;   
  title:string;
  textPreview:string           // DetectionLog _id
  sourceType: SourceType;
  fileType?: string;
  status: 'completed' | 'running' | 'pending';
  submittedAt: string;        // DetectionLog createdAt
  verdict?: Verdict;
  confidence?: number;
}
