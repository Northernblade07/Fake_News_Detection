"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import OAuthButtons from "@/app/components/OAuthButtons";
import { cardBase, inputBase, labelHint, primaryBtn, linkAccent } from "@/app/components/Theme";
import gsap from "gsap";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail]   = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const cardRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" }
    );
  }, []);

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
      if (!res.ok) { toast.error(json?.error ?? "Registration failed"); return; }
      toast.success("OTP sent to your email");
      setTimeout(() => router.push(`/login?email=${encodeURIComponent(email)}`), 900);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-20">
      <section ref={cardRef} className={cardBase}>
        <h1 className="text-3xl font-extrabold tracking-tight">Create your account</h1>
        <p className="mt-2 text-sm text-slate-400">Join with email or continue with a provider.</p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
          <label className="grid gap-1">
            <span className={labelHint}>Username</span>
            <input
              className={inputBase}
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
            <span className={labelHint}>Email</span>
            <input
              className={inputBase}
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase().trim())}
              placeholder="you@email.com"
            />
          </label>

          <label className="grid gap-1">
            <span className={labelHint}>Password</span>
            <input
              className={inputBase}
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>

          <button type="submit" disabled={submitting} className={primaryBtn}>
            {submitting ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="mt-6">
          <OAuthButtons />
        </div>

        <div className="mt-6 text-right text-sm">
          <Link href="/login" className={linkAccent}>
            Already have an account? Login
          </Link>
        </div>
      </section>
    </main>
  );
}
