"use client";

export function Skeleton({
  className = "",
  rounded = "rounded-lg"
}: {
  className?: string;
  rounded?: string;
}) {
  return (
    <div
      className={`
        relative overflow-hidden bg-white/10
        ${rounded}
        before:absolute before:inset-0 before:-translate-x-full
        before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent
        before:animate-[slide_1.2s_infinite]
        ${className}
      `}
    />
  );
}
