// components/landing/Footer.tsx
"use client";

import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTranslations } from "next-intl";
import {
  Github,
  Twitter,
  Linkedin,
  Youtube,
  Mail,
  ArrowUpRight,
  Shield,
  Globe,
} from "lucide-react";

gsap.registerPlugin(useGSAP);

export default function Footer() {
  const t = useTranslations("footer");
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        scrollTrigger: {
          trigger: scope.current,
          start: "top bottom-=100",
          toggleActions: "play none none reverse"
        }
      });

      tl.fromTo(
        ".footer-wrap",
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1 }
      )
      .fromTo(
        ".footer-brand",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8 },
        "-=0.5"
      )
      .fromTo(
        ".footer-col",
        { y: 25, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, stagger: 0.1 },
        "-=0.4"
      )
      .fromTo(
        ".social-icon",
        { y: 15, opacity: 0, scale: 0.8 },
        { y: 0, opacity: 1, scale: 1, duration: 0.5, stagger: 0.08 },
        "-=0.3"
      )
      .fromTo(
        ".footer-bottom",
        { y: 10, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6 },
        "-=0.2"
      );

      // Continuous animations
      gsap.to(".footer-glow", {
        opacity: 0.8,
        repeat: -1,
        yoyo: true,
        duration: 4,
        ease: "sine.inOut",
      });

      gsap.to(".social-icon", {
        y: -4,
        repeat: -1,
        yoyo: true,
        duration: 2.5,
        stagger: 0.2,
        ease: "sine.inOut",
      });
    },
    { scope }
  );

  const nav = [
    {
      heading: t("product.heading"),
      links: [
        { href: "/dashboard", label: t("product.dashboard") },
        { href: "/explore", label: t("product.explore") },
        { href: "/detect", label: t("product.features") },
        { href: "/profile", label: t("product.news") },
      ],
    },
    {
      heading: t("resources.heading"),
      links: [
        { href: "/docs", label: t("resources.docs") },
        { href: "/guides", label: t("resources.guides") },
        { href: "/changelog", label: t("resources.changelog") },
      ],
    },
    {
      heading: t("company.heading"),
      links: [
        { href: "/about", label: t("company.about") },
        { href: "/contact", label: t("company.contact") },
        { href: "/careers", label: t("company.careers") },
      ],
    },
    {
      heading: t("legal.heading"),
      links: [
        { href: "/terms", label: t("legal.terms") },
        { href: "/privacy", label: t("legal.privacy") },
      ],
    },
  ];

  const socials = [
    { 
      icon: Github, 
      label: "GitHub", 
      href: "#",
      color: "hover:text-gray-300 hover:border-gray-400/30"
    },
    { 
      icon: Twitter, 
      label: "Twitter/X", 
      href: "#",
      color: "hover:text-blue-400 hover:border-blue-400/30"
    },
    { 
      icon: Linkedin, 
      label: "LinkedIn", 
      href: "#",
      color: "hover:text-blue-500 hover:border-blue-500/30"
    },
    { 
      icon: Youtube, 
      label: "YouTube", 
      href: "#",
      color: "hover:text-red-400 hover:border-red-400/30"
    },
    { 
      icon: Mail, 
      label: t("cta.email"), 
      href: "/contact",
      color: "hover:text-amber-300 hover:border-amber-400/30"
    },
  ];

  return (
    <footer ref={scope} className="w-full mt-20">
      <div className="footer-wrap relative mx-auto max-w-8xl px-6 py-16 rounded-3xl border border-white/10 bg-[#0e1424]/95 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur">
        
        {/* Enhanced Background Effects
        <div
          aria-hidden
          className="footer-glow absolute -top-20 left-1/4 h-60 w-80 bg-gradient-to-r from-sky-400/25 via-white/15 to-amber-400/25 blur-4xl rounded-full"
        /> */}
        <div
          aria-hidden
          className="absolute bottom-10 right-1/3 h-40 w-40 bg-gradient-to-r from-amber-400/15 to-sky-400/15 blur-3xl rounded-full animate-pulse-slow"
        />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Brand Section - Enhanced */}
          <div className="footer-brand lg:col-span-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <Image
                src="/icons-192x192.png" // provide a small mark; or remove Image if not available
                alt=""
                width={36}
                height={36}
                className="rounded-lg ring-1 ring-white/10"
              />
              <span className="text-xl font-extrabold tracking-tight">
                {t("SatyaShield")}
              </span>
            </Link>
            
            <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-8">
              {t("tagline")}
            </p>

            {/* Enhanced Social Links */}
            <div className="flex space-x-3">
              {socials.map(({ icon: Icon, label, href, color }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className={`social-icon group flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-[#0f1524] text-slate-400 transition-all duration-300 ${color} hover:shadow-lg hover:shadow-sky-500/10 hover:scale-110`}
                >
                  <Icon className="h-5 w-5 transition-transform group-hover:scale-110" />
                </Link>
              ))}
            </div>
          </div>

          {/* Navigation Columns - Enhanced */}
          <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {nav.map((col) => (
              <nav key={col.heading} className="footer-col">
                <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-6">
                  {col.heading}
                </h4>
                <ul className="space-y-4">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <Link
                        href={l.href}
                        className="group inline-flex items-center gap-2 text-sm text-slate-400 hover:text-sky-300 transition-all duration-300 hover:translate-x-1"
                      >
                        <span className="relative">
                          {l.label}
                          <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-sky-400 to-amber-400 transition-all duration-300 group-hover:w-full" />
                        </span>
                        <ArrowUpRight className="h-4 w-4 opacity-0 -translate-y-0.5 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        {/* Enhanced Bottom Bar */}
        <div className="footer-bottom relative z-10 mt-16 pt-8 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-slate-500">
              © {new Date().getFullYear()} Fake News Detection. {t("rights")}
            </p>
            
            <div className="flex items-center space-x-6 text-sm text-slate-500">
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-sky-400" />
                <span>Global Coverage</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-4 w-4 text-emerald-400" />
                <span>Enterprise Security</span>
              </div>
            </div>
            
            <div className="flex items-center gap-6 text-xs text-slate-400">
              <Link 
                href="/privacy" 
                className="hover:text-sky-300 transition-colors duration-200"
              >
                {t("legal.privacy")}
              </Link>
              <span className="text-slate-600">•</span>
              <Link 
                href="/terms" 
                className="hover:text-sky-300 transition-colors duration-200"
              >
                {t("legal.terms")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}