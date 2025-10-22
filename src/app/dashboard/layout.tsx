// app/dashboard/layout.tsx
import { LeftSidebar } from "@/app/components/dashboard/LeftSidebar";
import { RightSidebar } from "@/app/components/dashboard/RightSidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-[#0B1120] text-slate-100 overflow-hidden">
      <LeftSidebar />
      <main className="flex-1 overflow-y-auto scrollbar-hide px-6 py-8 lg:px-10 bg-gradient-to-b from-[#0B1120] to-[#0E172E]">
        {children}
      </main>
      <RightSidebar />
    </div>
  );
}
