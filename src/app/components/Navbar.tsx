// components/Navbar.tsx
"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useTranslations } from "next-intl";
import { useSession, signIn, signOut } from "next-auth/react";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";

export default function Navbar() {
  const t = useTranslations("nav");
  const { data: session, status } = useSession(); // 👈 Auth.js hook
  const barRef = useRef<HTMLElement>(null);
  const underlineRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!barRef.current) return;
    gsap.fromTo(
      barRef.current,
      { y: -16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, ease: "power2.out" }
    );
  }, []);

  return (
    <header
      ref={barRef}
      className="sticky w-full top-0 z-50 border-b border-white/10 bg-[#0d1322]/80 backdrop-blur shadow-[0_6px_24px_rgba(0,0,0,0.35)]"
    >
      <div className="mx-auto flex max-w-8xl items-center justify-around px-4 py-3">
        {/* Logo */}
        <Link href="/" className="relative inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-gradient-to-b from-green-400 via-sky-100 to-amber-800 shadow-[0_0_24px_rgba(56,189,248,0.45)]" />
          <span className="text-lg font-extrabold tracking-tight">
            {t("SatyaShield")}
          </span>
        </Link>

        {/* Nav links */}
        <nav className="relative hidden items-center gap-6 md:flex mx-10">
          <Link href="/" className="text-slate-300 hover:text-white">
            {t("home")}
          </Link>
          <Link href="/explore" className="text-slate-300 hover:text-white">
            {t("explore")}
          </Link>
          {session && (
            <>
              <Link href="/dashboard" className="text-slate-300 hover:text-white">
                {t("dashboard")}
              </Link>
              <Link href="/profile" className="text-slate-300 hover:text-white">
                {t("profile")}
              </Link>
            </>
          )}
          <span
            ref={underlineRef}
            className="pointer-events-none absolute -bottom-1 left-0 block h-0.5 w-0 rounded-full bg-gradient-to-r from-green-400 via-sky-100 to-amber-800"
          />
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <LanguageSwitcher />

          <div className="hidden items-center gap-2 md:flex">
            {status === "loading" ? (
              <p className="text-slate-400 text-sm">Loading...</p>
            ) : session ? (
              <>
                <span className="text-slate-200 flex flex-wrap  text-sm font-medium">
                  {session.user?.name || session.user?.email.split('@')[0]}
                </span>
                <button
                  onClick={() => signOut()}
                  className="rounded-md bg-gradient-to-r from-red-500 via-red-400 to-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:brightness-110 transition"
                >
                  {t("logout")}
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => signIn()}
                  className="rounded-md hover:bg-[#0f1524] px-3 py-1.5 text-sm hover:text-sky-700 hover:border-sky-400/30 bg-gradient-to-l from-green-400 via-sky-200 to-amber-800 text-black font-semibold transition"
                >
                  {t("login")}
                </button>
                <Link
                  href="/register"
                  className="rounded-md bg-gradient-to-r from-green-400 via-sky-200 to-amber-800 px-3 py-1.5 text-sm font-semibold text-[#0b0f1a] shadow-[0_6px_24px_rgba(56,189,248,0.25)] hover:brightness-110 transition"
                >
                  {t("register")}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
