// components/Navbar.tsx
"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTranslations } from "next-intl";
import { useSession, signIn, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import LanguageSwitcher from "@/app/components/LanguageSwitcher";
import PushClient from "../push/PushClient";

gsap.registerPlugin(useGSAP);

export default function Navbar() {
  const t = useTranslations("nav");
  const { data: session, status } = useSession();
  const pathname = usePathname();

  const barRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const activeUnderlineRef = useRef<HTMLSpanElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  // Active link helper
  const isActive = useCallback(
    (href: string) => (href === "/" ? pathname === "/" : pathname?.startsWith(href)),
    [pathname]
  );

  // Shared classes (kept gradients/colors exactly as yours for actions)
  const linkBase =
    "nav-link px-3 py-2 text-sm transition-all duration-300 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40 rounded-lg relative group";
  const activeCls = "text-white";
  const inactiveCls = "text-slate-300";

  const navLinks = useMemo(
    () => [
      { href: "/", label: "home" },
      { href: "/explore", label: "explore" },
    ],
    []
  );
  const authLinks = useMemo(
    () =>
      session
        ? [
            { href: "/dashboard", label: "dashboard" },
            { href: "/profile", label: "profile" },
          ]
        : [],
    [session]
  );

  // Mount animation + brand/links/actions stagger (reduced motion respected)
  useGSAP(
    () => {
      if (!barRef.current) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(
        barRef.current,
        { y: -28, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5 }
      )
        .fromTo(
          ".nav-brand",
          { y: -10, opacity: 0, scale: 0.98 },
          { y: 0, opacity: 1, scale: 1, duration: 0.4 },
          "-=0.25"
        )
        .fromTo(
          ".nav-link",
          { y: -8, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, stagger: 0.06 },
          "-=0.2"
        )
        .fromTo(
          ".nav-action",
          { y: -6, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.3, stagger: 0.05 },
          "-=0.2"
        );

      // Gentle brand pulse
      gsap.to(".brand-dot", {
        opacity: 0.8,
        repeat: -1,
        yoyo: true,
        duration: 3.2,
        ease: "sine.inOut",
      });
    },
    { scope: barRef }
  );

  // GSAP timeline for mobile drawer
  const drawerTl = useRef<gsap.core.Timeline | null>(null);
  useGSAP(
    () => {
      if (!drawerRef.current || !overlayRef.current) return;
      const tl = gsap.timeline({ paused: true });
      tl.fromTo(
        overlayRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.25, ease: "power3.out" },
        0
      )
        .fromTo(
          drawerRef.current,
          { xPercent: -100, opacity: 0.8 },
          { xPercent: 0, opacity: 1, duration: 0.35, ease: "power3.out" },
          0
        )
        .fromTo(
          ".mobile-nav-item",
          { x: -14, opacity: 0 },
          { x: 0, opacity: 1, duration: 0.25, stagger: 0.06 },
          "-=0.15"
        );
      drawerTl.current = tl;
    },
    { scope: barRef }
  );

  // Open/close drawer with animation
  useEffect(() => {
    if (!drawerTl.current || !overlayRef.current) return;
    if (open) {
      drawerTl.current.play(0);
      overlayRef.current.style.pointerEvents = "auto";
      document.body.style.overflow = "hidden";
      closeBtnRef.current?.focus();
    } else {
      drawerTl.current.reverse();
      overlayRef.current.style.pointerEvents = "none";
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

  // Active underline bar that follows current route
  const positionActiveUnderline = useCallback(() => {
    if (!navRef.current || !activeUnderlineRef.current) return;
    const links = Array.from(navRef.current.querySelectorAll<HTMLAnchorElement>("a.nav-link"));
    const activeEl = links.find((a) => a.getAttribute("aria-current") === "page");
    if (!activeEl) {
      gsap.to(activeUnderlineRef.current, { width: 0, duration: 0.2, ease: "power2.out" });
      return;
    }
    const navBox = navRef.current.getBoundingClientRect();
    const box = activeEl.getBoundingClientRect();
    const left = box.left - navBox.left;
    const width = box.width;
    gsap.to(activeUnderlineRef.current, {
      x: left,
      width,
      duration: 0.35,
      ease: "power3.out",
    });
  }, []);

  useEffect(() => {
    // after paint
    const id = requestAnimationFrame(positionActiveUnderline);
    const onResize = () => positionActiveUnderline();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(id);
      window.removeEventListener("resize", onResize);
    };
  }, [pathname, positionActiveUnderline, navLinks, authLinks]);

  // Scroll progress bar (top)
  useEffect(() => {
    const el = progressRef.current;
    if (!el) return;
    const onScroll = () => {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight || 1;
      const ratio = Math.min(1, Math.max(0, h.scrollTop / max));
      gsap.to(el, { scaleX: ratio, transformOrigin: "0% 50%", duration: 0.15, ease: "power1.out" });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sign-in / Sign-out handlers
  const handleSignIn = () => {
    setOpen(false);
    void signIn();
  };
  const handleSignOut = () => {
    setOpen(false);
    void signOut();
  };

  return (
    <header
      ref={barRef}
      className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0d1322]/80 shadow-[0_6px_24px_rgba(0,0,0,0.35)] backdrop-blur"
    >
      {/* Top scroll progress bar (keeps theme, subtle) */}
      <div
        ref={progressRef}
        aria-hidden
        className="h-0.5 w-full origin-left bg-gradient-to-r from-green-400 via-sky-300 to-amber-700"
        style={{ transform: "scaleX(0)" }}
      />

      <div className="relative mx-auto grid grid-cols-[1fr_auto_1fr] gap-3 max-w-[1480px] items-center justify-between px-4 py-3">
        {/* Brand (unchanged icon/gradient style) */}
        <Link href="/" className="nav-brand relative inline-flex items-center gap-2">
          <span className="brand-dot h-3 w-3 rounded-full bg-gradient-to-b from-green-400 via-sky-100 to-amber-800 shadow-[0_0_24px_rgba(56,189,248,0.45)]" />
          <span className="text-lg font-extrabold tracking-tight">{t("SatyaShield")}</span>
        </Link>

        {/* Desktop nav with hover underline + sliding active underline */}
        <nav ref={navRef} className="relative hidden md:flex items-center justify-center gap-2">
          {/* Active underline bar */}
          <span
            ref={activeUnderlineRef}
            aria-hidden
            className="pointer-events-none absolute -bottom-1 left-0 h-0.5 w-0 rounded bg-gradient-to-r from-sky-400 to-amber-400"
          />
          {navLinks.concat(authLinks).map(({ href, label }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`${linkBase} ${active ? activeCls : inactiveCls}`}
                prefetch
              >
                <span className="relative">
                  {t(label)}
                  <span
                    aria-hidden
                    className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-sky-400 to-amber-400 transition-all duration-300 ${
                      active ? "w-full" : "w-0 group-hover:w-full"
                    }`}
                  />
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Desktop actions (keep original gradient colors) */}
        <div className="hidden md:flex items-center justify-self-end gap-4">
          <div className="nav-action">
            <LanguageSwitcher />
          </div>
          {session && (
            <div className="nav-action">
              <PushClient />
            </div>
          )}
          {status === "loading" ? (
            <p className="nav-action text-slate-400 text-sm">Loading...</p>
          ) : session ? (
            <>
              <span className="nav-action text-slate-200 text-sm font-medium">
                {session.user?.name || session.user?.email?.split("@")?.[0]}
              </span>
              <button
                onClick={() => signOut()}
                className="nav-action rounded-md bg-gradient-to-r from-red-500 via-red-400 to-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:brightness-110 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40"
              >
                {t("logout")}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => signIn()}
                className="nav-action rounded-md hover:bg-[#0f1524] px-3 py-1.5 text-sm hover:text-sky-700 hover:border-sky-400/30 bg-gradient-to-l from-green-400 via-sky-200 to-amber-800 text-black font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
              >
                {t("login")}
              </button>
              <Link
                href="/register"
                className="nav-action rounded-md bg-gradient-to-r from-green-400 via-sky-200 to-amber-800 px-3 py-1.5 text-sm font-semibold text-[#0b0f1a] shadow-[0_6px_24px_rgba(56,189,248,0.25)] hover:brightness-110 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
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
            className="nav-action inline-flex items-end justify-center rounded-md border border-white/10 bg-[#0f1524] p-2 text-slate-200 hover:border-sky-400/30 hover:bg-[#111a2f] transition focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Mobile overlay (fixed pointer-events when open) */}
      <div
        ref={overlayRef}
        className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
        onClick={() => setOpen(false)}
        style={{ pointerEvents: "none" }}
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
            {navLinks.concat(authLinks).map(({ href, label }) => {
              const active = isActive(href);
              return (
                <li key={href} className="mobile-nav-item">
                  <Link
                    href={href}
                    onClick={() => setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={`block rounded-lg px-3 py-2 transition-all duration-300 ${
                      active
                        ? "bg-white/15 text-white border border-sky-400/30"
                        : "text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    <span className="relative">
                      {t(label)}
                      <span
                        aria-hidden
                        className={`absolute -bottom-1 left-0 h-0.5 bg-gradient-to-r from-sky-400 to-amber-400 transition-all duration-300 ${
                          active ? "w-full" : "w-0"
                        }`}
                      />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mobile-nav-item mt-4 border-t border-white/25 pt-4 space-y-3">
            <LanguageSwitcher />
            {session && <PushClient />}
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
