// app/profile/layout.tsx
import { LeftSidebar } from "@/components/dashboard/LeftSidebar";
import { RightSidebar } from "@/components/dashboard/RightSidebar";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-full w-full bg-brand-bg text-slate-100">
      <LeftSidebar />
      <main className="flex-1 scrollbar-hide p-6 lg:p-8">
        {children}
      </main>
      <RightSidebar/>
    </div>
  );
}