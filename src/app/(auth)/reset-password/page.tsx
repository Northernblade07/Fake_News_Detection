// app/(auth)/reset-password/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { KeyRound, ShieldCheck } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState(search.get("email") ?? "");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          otp: otp.trim(),
          newPassword: password,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error ?? "Reset failed");
        return;
        }
      toast.success("Password reset successful");
      setTimeout(() => router.push(`/login?email=${encodeURIComponent(email)}`), 900);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <section className="rounded-2xl border border-brand-border bg-brand-card p-7 shadow-lg backdrop-blur">
        <div className="mb-2 flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brand-blue" />
          <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
        </div>
        <p className="text-sm text-slate-400">
          Enter the verification code sent to your email, then choose a new password.
        </p>

        <form onSubmit={onSubmit} className="mt-5 grid gap-3">
          <label className="grid gap-1">
            <span className="text-xs text-slate-400">Email</span>
            <input
              className="rounded-lg border border-brand-border bg-[#0f1524] px-3 py-2 text-slate-100 outline-none ring-0 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/40"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
              placeholder="you@email.com"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-slate-400">OTP Code</span>
            <input
              className="rounded-lg border border-brand-border bg-[#0f1524] px-3 py-2 text-slate-100 outline-none ring-0 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/40"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="6-digit code"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-slate-400">New password</span>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                className="w-full rounded-lg border border-brand-border bg-[#0f1524] px-9 py-2 text-slate-100 outline-none ring-0 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/40"
                type="password"
                minLength={8}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </label>

          <label className="grid gap-1">
            <span className="text-xs text-slate-400">Confirm new password</span>
            <input
              className="rounded-lg border border-brand-border bg-[#0f1524] px-3 py-2 text-slate-100 outline-none ring-0 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/40"
              type="password"
              minLength={8}
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg border-0 bg-gradient-to-r from-brand-blue to-brand-orange px-4 py-2 font-semibold text-black transition hover:brightness-105 disabled:opacity-60"
          >
            {submitting ? "Resetting..." : "Reset password"}
          </button>
        </form>
      </section>
    </main>
  );
}
