"use client";

import { useState, useEffect, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";

interface Preferences {
  emailAlerts?: boolean | undefined;
  language?: string | undefined;
}

interface NotificationsPanelProps {
  userId: string;
  initialPreferences?: Preferences;
  locales?: string[];
}

export default function NotificationsPanel({
  userId,
  initialPreferences = { emailAlerts: true, language: "en" },
  locales = ["en", "hi", "bn", "mr", "te", "ta", "gu", "ur", "kn", "or", "pa", "ml"],
}: NotificationsPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [alerts, setAlerts] = useState(initialPreferences?.emailAlerts);
  const [lang, setLang] = useState(initialPreferences?.language);
  const [saving, setSaving] = useState(false);

  useGSAP(() => {
    if (!panelRef.current) return;
    gsap.from(panelRef.current.children, {
      opacity: 0,
      y: 20,
      stagger: 0.12,
      duration: 0.5,
      ease: "power2.out",
    });
  }, []);

  // Save preferences on change
  useEffect(() => {
    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        await fetch("/api/profile/update", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ preferences: { emailAlerts: alerts, language: lang }, userId }),
        });
      } catch (err) {
        console.error("Failed to update preferences", err);
      } finally {
        setSaving(false);
      }
    }, 500); // debounce 500ms

    return () => clearTimeout(timer);
  }, [alerts, lang, userId]);

  return (
    <section
      ref={panelRef}
      className="mt-10 p-6 rounded-2xl bg-[#0e1424]/80 shadow-lg max-w-md"
    >
      <h2 className="text-xl font-bold mb-5 text-gradient">Notifications & Preferences</h2>

      <label className="flex items-center gap-3 mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={alerts}
          onChange={() => setAlerts((v) => !v)}
          className="w-5 h-5 rounded border border-slate-600 bg-[#0f1524] accent-sky-400"
        />
        <span className="select-none text-slate-100 font-semibold">
          Email alerts on new detections
        </span>
      </label>

      <div>
        <label htmlFor="locale" className="block text-slate-400 font-semibold mb-1">
          Preferred Language
        </label>
        <select
          id="locale"
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="w-full rounded-lg bg-[#0f1524] border border-white/10 px-3 py-2 text-white focus:border-sky-400 focus:ring-2 focus:ring-sky-400/30 transition"
        >
          {locales.map((locale) => (
            <option key={locale} value={locale}>
              {locale.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {saving && <p className="mt-2 text-slate-300 text-sm select-none">Saving...</p>}
    </section>
  );
}
