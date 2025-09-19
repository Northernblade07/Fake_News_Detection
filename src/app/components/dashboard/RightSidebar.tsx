// components/dashboard/RightSidebar.tsx
import { ProfileCard } from "@/app/components/ProfileCard";
import type { UserProfile } from "@/app/types";

export function RightSidebar({ user }: { user: UserProfile }) {
  return (
    <aside className="hidden scrollbar-hide xl:block w-80 border-l border-brand-border p-6 space-y-6">
      <ProfileCard user={user} />
      {/* Add other widgets here like 'Reminders' or 'Time Tracker' if needed */}
    </aside>
  );
}