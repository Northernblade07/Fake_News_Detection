// app/(auth)/forgot-password/page.tsx
"use client";

import { useState } from "react";
import { toast } from "react-toastify";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase().trim() }),
      });
      toast.success("If the account exists, an email has been sent");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <section className="rounded-2xl border border-brand-border bg-brand-card p-7 shadow-lg backdrop-blur">
        <h1 className="text-2xl font-bold tracking-tight">Reset your password</h1>
        <p className="mt-1 text-sm text-slate-400">Enter your email to receive a reset code.</p>

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

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg border-0 bg-gradient-to-r from-brand-blue to-brand-orange px-4 py-2 font-semibold text-black transition hover:brightness-105 disabled:opacity-60"
          >
            {submitting ? "Sending..." : "Send reset code"}
          </button>
        </form>
      </section>
    </main>
  );
}
