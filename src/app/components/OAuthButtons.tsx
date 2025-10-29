"use client";

import { signIn } from "next-auth/react";
import { redirect } from "next/navigation";
import { useState } from "react";
// import { Github } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { IoLogoGithub } from "react-icons/io";

export default function OAuthButtons() {
  const [loading, setLoading] = useState<"google" | "github" | null>(null);

  async function handleOAuth(provider: "google" | "github") {
    setLoading(provider);
    try {
      await signIn(provider, { callbackUrl: "/" });
      console.log(provider)
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="grid gap-3">
      {/* Divider */}
      <div className="relative text-center text-sm text-slate-400">
        <span className="px-2 before:absolute before:left-0 before:top-1/2 before:h-px before:w-1/3 before:-translate-y-1/2 before:bg-white/10 after:absolute after:right-0 after:top-1/2 after:h-px after:w-1/3 after:-translate-y-1/2 after:bg-white/10">
          or continue with
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Google */}
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          disabled={!!loading}
          className={[
            "flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium",
            "border-white/10 bg-[#0f1524] text-slate-100",
            "hover:border-sky-400/30 hover:bg-[#111a2f] transition",
            "shadow-[0_6px_24px_rgba(0,0,0,0.35)] disabled:opacity-60",
          ].join(" ")}
          aria-label="Continue with Google"
        >
          <FcGoogle className="h-4 w-4 text-sky-300" />
          <span>{loading === "google" ? "Signing in..." : "Continue with Google"}</span>
        </button>

        {/* GitHub */}
        <button
          type="button"
          onClick={() => handleOAuth("github")}
          disabled={!!loading}
          className={[
            "flex items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium",
            "border-white/10 bg-[#0f1524] text-slate-100",
            "hover:border-sky-400/30 hover:bg-[#111a2f] transition",
            "shadow-[0_6px_24px_rgba(0,0,0,0.35)] disabled:opacity-60",
          ].join(" ")}
          aria-label="Continue with GitHub"
        >
          <IoLogoGithub className="h-4 w-4 text-slate-200" />
          <span>{loading === "github" ? "Signing in..." : "Continue with GitHub"}</span>
        </button>
      </div>
    </div>
  );
}
