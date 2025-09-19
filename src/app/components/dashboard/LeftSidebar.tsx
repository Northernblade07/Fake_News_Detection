// components/dashboard/LeftSidebar.tsx
'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldHalf, LayoutGrid, ScanLine, User, Settings } from "lucide-react";
import clsx from 'clsx';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
  { name: 'Detect', href: '/detect', icon: ScanLine },
  { name: 'Profile', href: '/dashboard/profile', icon: User },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function LeftSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-64 border-r border-brand-border p-6">
      <div className="flex items-center gap-3 mb-10">
        <ShieldHalf className="h-8 w-8 text-brand-blue" />
        <h1 className="text-xl font-bold">SatyaShield</h1>
      </div>
      <nav className="flex flex-col gap-2">
        {navItems.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={clsx(
              "flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors",
              {
                'bg-brand-blue text-black': pathname === item.href,
                'text-slate-300 hover:bg-brand-card hover:text-slate-100': pathname !== item.href,
              }
            )}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-auto">
         {/* You can add something like a logout button here later */}
      </div>
    </aside>
  );
}