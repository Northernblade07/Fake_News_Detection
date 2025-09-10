// components/OAuthButtons.tsx
"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { Github, Globe } from "lucide-react";

export default function OAuthButtons() {
  const [loading, setLoading] = useState<"google" | "github" | null>(null);

  const handleOAuth = async (provider: "google" | "github") => {
    setLoading(provider);
    try {
      await signIn(provider, { callbackUrl: "/" });
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="grid gap-3">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Google */}
        <button
          type="button"
          className="btn-outline flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50 disabled:opacity-50"
          disabled={!!loading}
          onClick={() => handleOAuth("google")}
        >
          <Globe className="h-4 w-4" />
          <span>
            {loading === "google" ? "Signing in..." : "Continue with Google"}
          </span>
        </button>

        {/* GitHub */}
        <button
          type="button"
          className="btn-outline flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50 disabled:opacity-50"
          disabled={!!loading}
          onClick={() => handleOAuth("github")}
        >
          <Github className="h-4 w-4" />
          <span>
            {loading === "github" ? "Signing in..." : "Continue with GitHub"}
          </span>
        </button>
      </div>

      {/* Divider */}
      <div className="relative mt-2 text-center text-sm text-slate-400">
        <span className="px-2 before:absolute before:left-0 before:top-1/2 before:h-px before:w-1/3 before:-translate-y-1/2 before:bg-slate-200 after:absolute after:right-0 after:top-1/2 after:h-px after:w-1/3 after:-translate-y-1/2 after:bg-slate-200">
          or continue with
        </span>
      </div>
    </div>
  );
}
