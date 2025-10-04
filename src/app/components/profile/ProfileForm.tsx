// app/profile/components/ProfileForm.tsx
"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { cardBase, inputBase, labelHint, primaryBtn } from "../Theme";
import { useTranslations } from "next-intl";

interface ProfileFormProps {
  user: { name: string; phone?: string };
}

export default function ProfileForm({ user }: ProfileFormProps) {
  const t = useTranslations("profile.form");
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const handleUpdate = async (data: { name: string; phone?: string }) => {
    const res = await fetch("/api/profile/update", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
    if (!res.ok) throw new Error("Update failed");
  };

  useGSAP(() => {
    if (!formRef.current) return;
    gsap.from(formRef.current.children, { y: 18, opacity: 0, stagger: 0.1, duration: 0.5, ease: "power2.out" });
  }, []);

  const glow = (el: HTMLInputElement, on: boolean) =>
    gsap.to(el, { borderColor: on ? "#60a5fa" : "#334155", boxShadow: on ? "0 0 8px #60a5fa" : "none", duration: 0.25, ease: "power1.out" });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await handleUpdate({ name, phone });
      setMsg(t("success"));
      setTimeout(() => setMsg(""), 2800);
    } catch {
      setMsg(t("failure"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form ref={formRef} onSubmit={onSubmit} className={`${cardBase} mt-8 max-w-3xl mx-auto`} noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-1">
          <span className="text-sm text-slate-300 font-semibold">{t("username")}</span>
          <input
            id="name"
            type="text"
            value={name}
            onFocus={(e) => glow(e.currentTarget, true)}
            onBlur={(e) => glow(e.currentTarget, false)}
            onChange={(e) => setName(e.target.value)}
            className={inputBase}
            required
            minLength={3}
            maxLength={30}
            autoComplete="username"
            spellCheck={false}
          />
        </label>
        <label className="grid gap-1">
          <span className={labelHint}>{t("phoneOptional")}</span>
          <input
            id="phone"
            type="tel"
            value={phone}
            onFocus={(e) => glow(e.currentTarget, true)}
            onBlur={(e) => glow(e.currentTarget, false)}
            onChange={(e) => setPhone(e.target.value)}
            className={inputBase}
            maxLength={15}
            autoComplete="tel"
            pattern="^[\\d\\s\\-+()]{0,15}$"
            spellCheck={false}
          />
        </label>
      </div>
      <div className="mt-6">
        <button type="submit" disabled={submitting} className={primaryBtn}>
          {submitting ? t("saving") : t("save")}
        </button>
      </div>
      {msg && <p className="mt-2 text-emerald-400 font-semibold select-none">{msg}</p>}
    </form>
  );
}
