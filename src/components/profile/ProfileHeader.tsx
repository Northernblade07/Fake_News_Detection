// app/profile/components/ProfileHeader.tsx
"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cardBase } from "../Theme";
import { useTranslations } from "next-intl";

interface ProfileHeaderProps {
  user: {
    avatar?: string | undefined | null;
    picture?: string;
    image?: string;
    coverPhoto?: string;
    name: string;
    role: string;
    email: string;
  };
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  const t = useTranslations("profile");
  const headerRef = useRef<HTMLDivElement>(null);

  const avatarSrc =
    user.avatar ||
    user.picture ||
    user.image ||
    `https://avatar.iran.liara.run/username?username=${encodeURIComponent(
      user.name || user.email
    )}`;

    // console.log(avatarSrc)

  useGSAP(
    () => {
      if (!headerRef.current) return;

      const ctx = gsap.context(() => {
        const tl = gsap.timeline({
          defaults: { ease: "power2.out" },
        });

        // card entrance
        tl.from(headerRef.current, {
          y: 16,
          opacity: 0,
          duration: 0.55,
        });

        // stagger children safely INSIDE component only
        tl.from(
          "[data-animate]",
          {
            y: 14,
            opacity: 0,
            duration: 0.45,
            stagger: 0.08,
          },
          "-=0.25"
        );
      }, headerRef);

      return () => ctx.revert();
    },
    { scope: headerRef }
  );

  return (
    <div
      ref={headerRef}
      className={`${cardBase} relative overflow-hidden border-2 border-l-green-200 border-r-amber-500/50 border-b-sky-200 border-t-blue-300`}
    >
      {/* Cover */}
      {user.coverPhoto && (
        <div className="mb-6 h-28 w-full overflow-hidden rounded-xl">
          <Image
            src={user.coverPhoto}
            alt={t("coverAlt")}
            width={1200}
            height={160}
            className="h-28 w-full object-cover opacity-80"
            priority
          />
        </div>
      )}

      <div className="flex flex-col items-center gap-2">
        {/* ✅ PERFECTLY CENTERED AVATAR */}
        <div
          data-animate
          className="relative h-24 w-24 rounded-full overflow-hidden ring-2 ring-sky-400/40"
        >
         <Image
  src={avatarSrc}
  alt={user.name ?? "User"}
  fill
  sizes="96px"
  unoptimized
  className="object-cover"
  priority
/>
        </div>

        <h1
          data-animate
          className="mt-2 text-2xl font-extrabold tracking-tight"
        >
          {user.name}
        </h1>

        <div
          data-animate
          className="mt-1 flex flex-wrap items-center justify-center gap-2"
        >
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