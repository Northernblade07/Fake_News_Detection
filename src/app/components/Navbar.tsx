// components/Navbar.tsx
"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTranslations } from "next-intl";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";

gsap.registerPlugin(useGSAP);

export default function Navbar() {
  const t = useTranslations("nav");
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const barRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  // Active link helper
  const isActive = useCallback(
  (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href)),
  [pathname]
);


  // Shared classes
  const linkBase =
    "px-2 py-1 text-sm transition hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40 rounded";
  const activeCls = "text-white";
  const inactiveCls = "text-slate-300";

  // Sign-in / Sign-out handlers
  const handleSignIn = () => {
    setOpen(false);
    void signIn();
  };
  const handleSignOut = () => {
    setOpen(false);
    void signOut();
  };

  const navLinks = [
    { href: "/", label: "home" },
    { href: "/explore", label: "explore" },
  ];
  const authLinks = session
    ? [
        { href: "/dashboard", label: "dashboard" },
        { href: "/profile", label: "profile" },
      ]
    : [];

  // Animate header on mount
  useGSAP(() => {
    if (!barRef.current) return;
    gsap.fromTo(
      barRef.current,
      { y: -16, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, ease: "power2.out" }
    );
  }, { scope: barRef });

  // GSAP timeline for drawer
  const drawerTl = useRef<gsap.core.Timeline | null>(null);
  useGSAP(() => {
    if (!drawerRef.current || !overlayRef.current) return;
    const tl = gsap.timeline({ paused: true });
    tl.fromTo(
      drawerRef.current,
      { xPercent: -100 },
      { xPercent: 0, duration: 0.3, ease: "power3.out" },
      0
    );
    tl.fromTo(
      overlayRef.current,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.3, ease: "power3.out" },
      0
    );
    drawerTl.current = tl;
  }, { scope: barRef });

  // Open/close drawer with animation
  useEffect(() => {
    if (!drawerTl.current) return;
    if (open) {
      drawerTl.current.play(0);
      document.body.style.overflow = "hidden";
      closeBtnRef.current?.focus();
    } else {
      drawerTl.current.reverse();
      document.body.style.overflow = "";
    }
  }, [open]);

  // Close drawer on route change
  useEffect(() => setOpen(false), [pathname]);

  // Close drawer on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  return (
    <header
      ref={barRef}
      className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0d1322]/80  shadow-[0_6px_24px_rgba(0,0,0,0.35)]"
    >
      <div className="mx-auto grid grid-cols-[1fr_auto_1fr] gap-3 max-w-[1480px] items-center justify-between px-4 py-3">
        {/* Left: Brand */}
        <Link href="/" className="relative inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-gradient-to-b from-green-400 via-sky-100 to-amber-800 shadow-[0_0_24px_rgba(56,189,248,0.45)]" />
          <span className="text-lg font-extrabold tracking-tight">{t("SatyaShield")}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="relative hidden md:flex items-center justify-center gap-6">
          {navLinks.concat(authLinks).map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`${linkBase} ${isActive(href) ? activeCls : inactiveCls}`}
            >
              {t(label)}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
       <div className="hidden md:flex items-center justify-self-end gap-4">
          <LanguageSwitcher />
          {status === "loading" ? (
            <p className="text-slate-400 text-sm">Loading...</p>
          ) : session ? (
            <>
              <span className="text-slate-200 text-sm font-medium">
                {session.user?.name || session.user?.email?.split("@")}
              </span>
              <button
                onClick={() => signOut()}
                className="rounded-md bg-gradient-to-r from-red-500 via-red-400 to-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:brightness-110 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
              >
                {t("logout")}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => signIn()}
                className="rounded-md hover:bg-[#0f1524] px-3 py-1.5 text-sm hover:text-sky-700 hover:border-sky-400/30 bg-gradient-to-l from-green-400 via-sky-200 to-amber-800 text-black font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
              >
                {t("login")}
              </button>
              <Link
                href="/register"
                className="rounded-md bg-gradient-to-r from-green-400 via-sky-200 to-amber-800 px-3 py-1.5 text-sm font-semibold text-[#0b0f1a] shadow-[0_6px_24px_rgba(56,189,248,0.25)] hover:brightness-110 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
              >
                {t("register")}
              </Link>
            </>
          )}
        </div>
        {/* Mobile hamburger */}
        <div className="md:hidden absolute right-5">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open navigation"
            aria-expanded={open}
            aria-controls="mobile-nav"
            className="inline-flex items-end justify-center rounded-md border border-white/10 bg-[#0f1524] p-2 text-slate-200 hover:border-sky-400/30 hover:bg-[#111a2f] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40 left-0 "
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile overlay */}
      <div
        ref={overlayRef}
        className="md:hidden fixed inset-0 z-50 bg-black/6 pointer-events-none "
        onClick={() => setOpen(false)}
      />

      {/* Mobile drawer */}
      <aside
        id="mobile-nav"
        ref={drawerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-nav-title"
        className="md:hidden fixed left-0 top-0 z-60 h-screen w-[85%] max-w-[360px] border-r border-white/10 bg-[#0e1424] shadow-[0_10px_30px_rgba(0,0,0,0.45)]"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#0d1322]">
          <div className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-gradient-to-b from-green-400 via-sky-100 to-amber-800 shadow-[0_0_24px_rgba(56,189,248,0.45)]" />
            <h2 id="mobile-nav-title" className="text-base font-semibold tracking-tight">
              {t("SatyaShield")}
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="inline-flex items-center justify-center rounded-md border border-white/10 bg-[#0f1524] p-2 text-slate-200 hover:border-sky-400/30 hover:bg-[#111a2f] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="px-4 py-4">
          <ul className="space-y-1">
            {navLinks.concat(authLinks).map(({ href, label }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg px-3 py-2 ${
                    isActive(href) ? "bg-white/15 text-white" : "text-slate-400  hover:bg-white/5"
                  }`}
                >
                  {t(label)}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-white/25 pt-4 space-y-3">
            <LanguageSwitcher />
            {status === "loading" ? (
              <p className="text-slate-400 text-sm">Loading...</p>
            ) : session ? (
              <button
                onClick={handleSignOut}
                className="w-full rounded-md bg-gradient-to-r from-red-500 via-red-400 to-red-600 px-3 py-2 text-sm font-semibold text-white shadow hover:brightness-110 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
              >
                {t("logout")}
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSignIn}
                  className="flex-1 rounded-md hover:bg-[#0f1524] px-3 py-2 text-sm hover:text-sky-700 hover:border-sky-400/30 bg-gradient-to-l from-green-400 via-sky-200 to-amber-800 text-black font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
                >
                  {t("login")}
                </button>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="flex-1 text-center rounded-md bg-gradient-to-r from-green-400 via-sky-200 to-amber-800 px-3 py-2 text-sm font-semibold text-[#0b0f1a] shadow-[0_6px_24px_rgba(56,189,248,0.25)] hover:brightness-110 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
                >
                  {t("register")}
                </Link>
              </div>
            )}
          </div>
        </nav>
      </aside>
    </header>
  );
}
