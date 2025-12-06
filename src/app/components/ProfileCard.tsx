// components/ProfileCard.tsx
"use client";

import Link from "next/link";
import Image from "next/image";
import type { DefaultSession } from "next-auth";

type Props = {
  user: DefaultSession["user"] & {
    avatar?: string;
    coverPhoto?: string;
    role?: string;
  };
 
};

export function ProfileCard({ user }: Props) {
  return (
    <Link href="/profile" className="block">
      <div className="rounded-2xl border border-brand-border bg-brand-card p-5 shadow-lg cursor-pointer hover:bg-brand-card/80 transition">
        <div className="flex items-center justify-center gap-4">
          <Image
            width={56}
            height={56}
            src={
              user?.image ??
              `https://avatar.iran.liara.run/username?username=${encodeURI(
              user?.name || user?.email
            )}`
            }
            alt={user?.name ?? "User"}
            className="h-14 w-14 rounded-full object-cover ring-2 ring-brand-blue/50"
          />
          <div className="flex flex-col">
            <div className="text-lg font-medium text-slate-100 text-center ">
              {user?.name?? user?.email.split('@')[0]}
            </div>
            <div className="text-xs text-slate-400">{user?.email}</div>
          </div>
          {/* If you want a plan badge later, you can extend session with custom fields */}
        </div>
      </div>
    </Link>
  );
}
