// app/detect/page.tsx
"use client"
// import { Uploader } from '@/app/components/detect/Uploader';
import DetectionForm from '../components/DetectionForm';
// import DashboardHero from '../components/DashboardHero'; '../components/DashboardHero';
import DashboardHero from '../components/DashboardHero';

export default function DetectPage() {
  return (
    <main className="flex min-h-[70vh] flex-1 items-center justify-center px-6 py-2 scrollbar-hide">
      <div className="w-full max-w-3xl">
        <div className="mb-2 text-center">
         <DashboardHero/>
        </div>
        <DetectionForm />
      </div>
    </main>
  );
}
