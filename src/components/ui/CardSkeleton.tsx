"use client";

import { Skeleton } from "./Skeleton";

export function CardSkeleton({
  lines = 3,
  height = "h-32"
}: {
  lines?: number;
  height?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0e1424]/80 
      p-6 shadow-[0_10px_40px_rgba(0,0,0,0.45)] backdrop-blur space-y-4">

      {/* Title */}
      <Skeleton className="h-5 w-32" />

      {/* Content */}
      <div className={`flex flex-col gap-3 ${height}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    </div>
  );
}
