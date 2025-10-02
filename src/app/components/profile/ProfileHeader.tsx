"use client";

import { useRef } from "react";
import Image from "next/image";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

interface ProfileHeaderProps {
  user: {
    avatar?: string;
    coverPhoto?: string;
    name: string;
    role: string;
  };
}

export default function ProfileHeader({ user }: ProfileHeaderProps) {
  const headerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!headerRef.current) return;
    gsap.fromTo(
      headerRef.current,
      { opacity: 0, scale: 0.85 },
      { opacity: 1, scale: 1, duration: 1, ease: "power3.out" }
    );
  }, []);

  return (
    <div
      ref={headerRef}
      className="relative flex flex-col items-center pt-6 pb-10 rounded-2xl shadow-[0_8px_20px_rgba(255,255,255,0.15)] bg-gradient-to-r from-sky-400 via-sky-500 to-amber-400 text-[#0b0f1a]"
    >
      {user.coverPhoto && (
        <div className="absolute top-0 left-0 w-full h-28 rounded-t-2xl overflow-hidden opacity-70">
          <Image
            src={user.coverPhoto}
            alt="Cover Photo"
            fill
            style={{ objectFit: "cover" }}
            priority
          />
        </div>
      )}

      <div className="relative w-24 h-24 mt-12">
        <Image
          src={user.avatar ?? "/default-avatar.png"}
          alt="User Avatar"
          width={96}
          height={96}
          className="rounded-full border-4 border-[#0b0f1a] shadow-lg object-cover"
          priority
        />
      </div>

      <h1 className="mt-4 text-3xl font-extrabold drop-shadow-md">{user.name}</h1>
      <span className="mt-1 px-3 py-1 rounded-full bg-[#0b0f1a]/90 font-semibold tracking-wide">
        {user.role}
      </span>
    </div>
  );
}
