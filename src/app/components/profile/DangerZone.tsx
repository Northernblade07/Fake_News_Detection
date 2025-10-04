// app/profile/components/DangerZone.tsx
"use client";

import { useState, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cardBase, primaryBtn } from "../Theme";
import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";

interface DangerZoneProps { userId: string }

export default function DangerZone({ userId }: DangerZoneProps) {
  const t = useTranslations("profile.danger");
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!modalRef.current) return;
    gsap.to(modalRef.current, {
      scale: confirm ? 1 : 0.94,
      opacity: confirm ? 1 : 0,
      duration: confirm ? 0.4 : 0.25,
      ease: confirm ? "power3.out" : "power2.in",
    });
  }, [confirm]);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await fetch("/api/profile/delete", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
      await signOut({ redirect: true, callbackUrl: "/" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/profile/download", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId }) });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `account-data-${userId}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await handleDelete();
    } catch {
      if (!modalRef.current) return;
      gsap.fromTo(modalRef.current, { x: -10 }, { x: 10, duration: 0.09, yoyo: true, repeat: 5 });
    }
  };

  return (
    <section className={`${cardBase} mt-12 border-amber-400/30`}>
      <h2 className="text-xl font-bold text-amber-300 mb-4">{t("title")}</h2>

      <div className="grid gap-3 sm:grid-cols-3">
        <button onClick={() => setConfirm(true)} className={`${primaryBtn} bg-amber-400 text-[#0b0f1a]`} disabled={loading}>
          {t("delete")}
        </button>
        <button onClick={handleDownload} className={primaryBtn} disabled={loading}>
          {t("download")}
        </button>
        <button onClick={() => signOut({ redirect: true, callbackUrl: "/" })} className={primaryBtn} disabled={loading}>
          {t("logout")}
        </button>
      </div>

      {confirm && (
        <div ref={modalRef} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-sm rounded-xl border border-amber-400 bg-[#0b0f1a] p-6 text-center shadow-xl">
            <p className="mb-6 text-lg font-semibold text-white">{t("confirmText")}</p>
            <div className="flex justify-around gap-4">
              <button onClick={handleDeleteConfirm} className={`${primaryBtn} bg-amber-400 text-[#0b0f1a]`} disabled={loading}>
                {t("confirm")}
              </button>
              <button onClick={() => setConfirm(false)} className={`${primaryBtn} bg-slate-700`} disabled={loading}>
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
