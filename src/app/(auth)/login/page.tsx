// app/(auth)/login/page.tsx
"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "react-toastify";
import OAuthButtons from "@/app/components/OAuthButtons";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState(search.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (!res) {
        toast.error("Unexpected error");
        return;
      }
      if (res.error) {
        toast.error(res.error);
        return;
      }
      toast.success("Signed in successfully");
      router.push("/");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16">
      <section className="rounded-2xl border border-brand-border bg-brand-card p-7 shadow-lg backdrop-blur">
        <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
        <p className="mt-1 text-sm text-slate-400">Sign in to continue with your account.</p>

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
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-4">
          <OAuthButtons />
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <Link href="/(auth)/password/forgot" className="text-brand-blue hover:text-brand-orange">
            Forgot password?
          </Link>
          <Link href="/register" className="text-brand-blue hover:text-brand-orange">
            New user? Register
          </Link>
        </div>
      </section>
    </main>
  );
}
