// components/ui/ProfileCard.tsx
import type { UserProfile } from '@/app/types';
import Image from 'next/image';

type Props = { user: UserProfile };

export function ProfileCard({ user }: Props) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-card p-5 shadow-lg">
      <div className="flex items-center gap-4">
        <Image width={56} height={56}
          src={user.avatarUrl ?? `https://api.dicebear.com/8.x/initials/svg?seed=${user.name}`}
          alt={user.name}
          className="h-14 w-14 rounded-full object-cover ring-2 ring-brand-blue/50"
        />
        <div>
          <div className="text-lg font-medium text-slate-100">{user.name}</div>
          <div className="text-xs text-slate-400">{user.email}</div>
        </div>
        <span className="ml-auto rounded-full bg-brand-blue/10 px-3 py-1 text-xs font-semibold text-brand-blue">
          {user.plan?.toUpperCase()}
        </span>
      </div>
    </div>
  );
}