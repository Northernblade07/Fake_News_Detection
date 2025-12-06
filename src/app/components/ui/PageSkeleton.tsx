"use client";

import { Skeleton } from "./Skeleton";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useRef } from "react";

export function PageSkeleton() {
  const ref = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    gsap.from(ref.current?.children || [], {
      opacity: 0,
      y: 20,
      duration: 0.4,
      stagger: 0.06,
      ease: "power2.out"
    });
  }, []);

  return (
    <div ref={ref} className="space-y-4 p-6">
      <Skeleton className="h-8 w-52" />
      <Skeleton className="h-4 w-96" />

      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
      </div>

      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}
