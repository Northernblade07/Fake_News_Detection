// types/index.ts
export type Verdict = 'fake' | 'real' | 'unknown';
export type DetectionStatus = 'Real' | 'Fake' | 'Pending' | 'Error';
export type DetectionType = 'Text' | 'Audio' | 'Video' | 'PDF' | 'URL';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  plan?: 'free' | 'pro';
}

export interface DashboardStats {
  total: number;
  fake: number;
  real: number;
  unknown: number;
  running: number;
  pending: number;
}

export interface TimeseriesPoint {
    date: string; 
  label?: string; // e.g., S, M, T...
  count: number;
}

export interface Detection {
  id: string;
  title: string;
  type: DetectionType;
  status: DetectionStatus;
  date: string;
  confidence?: number;
}

export interface DetectionJob {
  id: string;
  sourceType: 'text' | 'url' | 'file';
  fileType?: 'image' | 'audio' | 'video' | 'pdf' | 'other';
  status: 'completed' | 'running' | 'pending';
  submittedAt: string;
  verdict?: Verdict;
  confidence?: number;
}
