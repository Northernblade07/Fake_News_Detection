// app/dashboard/layout.tsx
import { LeftSidebar } from "@/app/components/dashboard/LeftSidebar";
import { RightSidebar } from "@/app/components/dashboard/RightSidebar";
import type { UserProfile } from "@/app/types";

// In a real app, this would be fetched from your authentication context
const mockUser: UserProfile = {
  id: 'u_1',
  name: 'Alex Rivera',
  email: 'alex.r@satyashield.com',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-brand-bg text-slate-100">
      <LeftSidebar />
      <main className="flex-1 scrollbar-hide p-6 lg:p-8">
        {children}
      </main>
      <RightSidebar/>
    </div>
  );
}