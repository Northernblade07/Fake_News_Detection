// lib/mockData.ts
import type { Detection, TimeseriesPoint } from '@/app/types';

export const recentDetections: Detection[] = [
  { id: '1', title: 'Political speech clip', type: 'Audio', status: 'Fake', date: new Date().toISOString(), confidence: 0.89 },
  { id: '2', title: 'Social media video', type: 'Video', status: 'Real', date: new Date().toISOString(), confidence: 0.97 },
  { id: '3', title: 'Economy article', type: 'URL', status: 'Pending', date: new Date().toISOString() },
  { id: '4', title: 'Press conference PDF', type: 'PDF', status: 'Fake', date: new Date().toISOString(), confidence: 0.92 },
];

export const detectionHistory: { name: string; detections: number }[] = [
  { name: 'Mon', detections: 12 },
  { name: 'Tue', detections: 19 },
  { name: 'Wed', detections: 25 },
  { name: 'Thu', detections: 22 },
  { name: 'Fri', detections: 30 },
  { name: 'Sat', detections: 21 },
  { name: 'Sun', detections: 15 },
];

export const weekSeries: TimeseriesPoint[] = [
  {date:'', label: 'S', count: 12 },
  { date:'', label: 'M', count: 16 },
  { date:'',label: 'T', count: 22 },
  {date:'', label: 'W', count: 18 },
  {date:'', label: 'T', count: 26 },
  {date:'', label: 'F', count: 20 },
  {date:'', label: 'S', count: 14 },
];
