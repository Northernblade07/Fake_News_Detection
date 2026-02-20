// app/detect/layout.tsx
import { LeftSidebar } from "@/components/dashboard/LeftSidebar";
import { RightSidebar } from "@/components/dashboard/RightSidebar";
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  
  return (
    <div className="flex h-screen w-full bg-brand-bg text-slate-100 no-scrollbar">
      <LeftSidebar />
      <main className="flex-1 scrollbar-hide">
        {children}
      </main >
      <RightSidebar />
    </div>
  );
}