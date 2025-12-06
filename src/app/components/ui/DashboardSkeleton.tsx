"use client";

import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";
import { Skeleton } from "@/app/components/ui/Skeleton";
import { CardSkeleton } from "@/app/components/ui/CardSkeleton";

export default function DashboardSkeleton() {
  const ref = useRef<HTMLDivElement | null>(null);

  useGSAP(() => {
    const items = ref.current?.querySelectorAll(".sk-item");

    gsap.from(items || [], {
      y: 18,
      opacity: 0,
      duration: 0.5,
      ease: "power2.out",
      stagger: 0.08
    });
  }, []);

  return (
    <div ref={ref} className="p-4 space-y-8">

      {/* HEADER */}
      <div className="sk-item space-y-2">
        <Skeleton className="h-8 w-56 rounded-md" />
        <Skeleton className="h-4 w-72 rounded-md" />
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="sk-item">
            <CardSkeleton height="h-20" lines={2} />
          </div>
        ))}
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="sk-item lg:col-span-2">
          <div className="rounded-2xl border border-white/10 bg-[#0e1424]/80 p-6 shadow-xl backdrop-blur">
            <Skeleton className="h-5 w-28 mb-4" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>

        {/* Donut */}
        <div className="sk-item">
          <div className="rounded-2xl border border-white/10 bg-[#0e1424]/80 p-6 shadow-xl backdrop-blur">
            <Skeleton className="h-5 w-20 mb-4" />
            <Skeleton className="h-64 w-full rounded-full" />
          </div>
        </div>
      </div>

      {/* RECENT JOBS */}
      <div className="sk-item">
        <div className="rounded-2xl border border-white/10 bg-[#0e1424]/80 p-6 shadow-xl backdrop-blur">
          <Skeleton className="h-5 w-40 mb-4" />

          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-14 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
