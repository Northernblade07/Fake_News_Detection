// app/(auth)/register/page.tsx
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "react-toastify";
import OAuthButtons from "@/app/components/OAuthButtons";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail]   = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email: email.toLowerCase().trim(), password }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(json?.error ?? "Registration failed");
        return;
      }
      toast.success("OTP sent to your email");
      setTimeout(() => router.push(`/login?email=${encodeURIComponent(email)}`), 900);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <section className="rounded-2xl border border-brand-border bg-brand-card p-7 shadow-lg backdrop-blur">
        <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
        <p className="mt-1 text-sm text-slate-400">Join with email or continue with a provider.</p>

        <form onSubmit={onSubmit} className="mt-5 grid gap-3">
          <label className="grid gap-1">
            <span className="text-xs text-slate-400">Username</span>
            <input
              className="rounded-lg border border-brand-border bg-[#0f1524] px-3 py-2 text-slate-100 outline-none ring-0 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/40"
              type="text"
              required
              minLength={3}
              maxLength={32}
              value={username}
              onChange={(e) => setUsername(e.target.value.trim())}
              placeholder="jane_doe"
            />
            <span className="text-xs text-slate-500">3–32 characters; letters, numbers, underscore.</span>
          </label>

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
            <span className="text-xs text-slate-400">Password</span>
            <input
              className="rounded-lg border border-brand-border bg-[#0f1524] px-3 py-2 text-slate-100 outline-none ring-0 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/40"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-lg border-0 bg-gradient-to-r from-brand-blue to-brand-orange px-4 py-2 font-semibold text-black transition hover:brightness-105 disabled:opacity-60"
          >
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="mt-4">
          <OAuthButtons />
        </div>

        <div className="mt-4 text-right text-sm">
          <Link href="/login" className="text-brand-blue hover:text-brand-orange">
            Already have an account? Login
          </Link>
        </div>
      </section>
    </main>
  );
}
