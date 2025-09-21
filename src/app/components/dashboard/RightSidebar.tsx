// components/dashboard/RightSidebar.tsx
"use client";

import { ProfileCard } from "@/app/components/ProfileCard";
import { useSession } from "next-auth/react";

export function RightSidebar() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <aside className="hidden xl:block w-80 border-l border-brand-border p-6">
        <p className="text-slate-400">Loading...</p>
      </aside>
    );
  }

  if (!session?.user) {
    return (
      <aside className="hidden xl:block w-80 border-l border-brand-border p-6">
        <p className="text-slate-400">Not signed in</p>
      </aside>
    );
  }

  return (
    <aside className="hidden scrollbar-hide xl:block w-80 border-l border-brand-border p-6 space-y-6">
      <ProfileCard user={session.user} />
    </aside>
  );
}
