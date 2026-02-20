// app/profile/components/ProfileHeader.tsx
"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cardBase } from "../Theme";
import { useTranslations } from "next-intl"; // + i18n

interface ProfileHeaderProps {
  user: {
    avatar?: string;
    coverPhoto?: string;
    name: string;
    role: string;
    email: string;
  };
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  const t = useTranslations("profile"); // + i18n namespace
  const headerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!headerRef.current) return;
    gsap.fromTo(
      headerRef.current,
      { y: 16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.55, ease: "power2.out" }
    );
  }, []);

  return (
    <div
      ref={headerRef}
      className={`${cardBase} relative overflow-hidden border-2 border-l-green-200 border-r-amber-500/50 border-b-sky-200 border-t-blue-300 max-w-`}
    >
      {/* Optional cover */}
      {user.coverPhoto && (
        <div className="mb-6 h-28 w-full overflow-hidden rounded-xl">
          <Image
            src={user.coverPhoto}
            alt={t("coverAlt")} // + i18n key
            width={1200}
            height={160}
            className="h-28 w-full object-cover opacity-80"
            priority
          />
        </div>
      )}

      <div className="flex flex-col items-center gap-2">
        <div className="relative h-24 w-24">
          <Image
            width={96}
            height={96}
            src={`https://avatar.iran.liara.run/username?username=${encodeURI(
              user?.name || user?.email
            )}`}
            alt={user?.name ?? "User"}
            className="rounded-full object-cover ring-2 ring-sky-400/40"
            priority
          />
        </div>

        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">{user.name}</h1>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
          <span className="rounded-full bg-[#0f1524] px-3 py-1 text-sm font-semibold text-white/90 border border-white/10">
            {user.role}
          </span>
          <span className="rounded-full bg-[#0f1524] px-3 py-1 text-sm font-semibold text-white/90 border border-white/10">
            {user.email}
          </span>
        </div>
      </div>
    </div>
  );
}
