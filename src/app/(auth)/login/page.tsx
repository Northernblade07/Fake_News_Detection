"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "react-toastify";
import OAuthButtons from "@/app/components/OAuthButtons";
import { cardBase, inputBase, labelHint, primaryBtn, linkAccent } from "@/app/components/Theme";
import gsap from "gsap";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState(search.get("email") ?? "");
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
      const res = await signIn("credentials", { email, password, redirect: false });
      if (!res) { toast.error("Unexpected error"); return; }
      if (res.error) { toast.error(res.error); return; }
      toast.success("Signed in successfully");
      router.push("/");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-20">
      <section ref={cardRef} className={cardBase}>
        <h1 className="text-3xl font-extrabold tracking-tight">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-400">Sign in to continue with the platform.</p>

        <form onSubmit={onSubmit} className="mt-6 grid gap-4">
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
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-6">
          <OAuthButtons />
        </div>

        <div className="mt-6 flex items-center justify-between text-sm">
          <Link href="/forgot-password" className={linkAccent}>
            Forgot password?
          </Link>
          <Link href="/register" className={linkAccent}>
            New user? Register
          </Link>
        </div>
      </section>
    </main>
  );
}
