// app/profile/components/ProfileForm.tsx
"use client";

import { useRef, useState, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { inputBase, labelHint, primaryBtn } from "../Theme";

interface ProfileFormProps {
  user: { name: string; phone?: string };
  onUpdate: (data: { name: string; phone?: string }) => Promise<void>;
}

export default function ProfileForm({ user, onUpdate }: ProfileFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  useGSAP(() => {
    if (!formRef.current) return;
    gsap.from(formRef.current.children, {
      y: 20,
      opacity: 0,
      stagger: 0.15,
      duration: 0.5,
      ease: "power2.out",
    });
  }, []);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    gsap.to(e.currentTarget, {
      borderColor: "#60a5fa",
      boxShadow: "0 0 8px #60a5fa",
      duration: 0.3,
      ease: "power1.out",
    });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    gsap.to(e.currentTarget, {
      borderColor: "#334155",
      boxShadow: "none",
      duration: 0.3,
      ease: "power1.out",
    });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onUpdate({ name, phone });
      setSuccessMsg("Profile updated successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err) {
      // handle error as needed
      setSuccessMsg("Failed to update profile");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      className="mt-8 space-y-6 bg-[#0e1424]/80 p-6 rounded-2xl shadow-xl"
      noValidate
    >
      <div>
        <label htmlFor="name" className="block text-slate-400 mb-1 font-semibold">
          Username
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={(e) => setName(e.target.value)}
          className={inputBase}
          required
          minLength={3}
          maxLength={30}
          autoComplete="username"
          spellCheck={false}
        />
      </div>

      <div>
        <label htmlFor="phone" className={labelHint + " mb-1 block"}>
          Phone (optional)
        </label>
        <input
          id="phone"
          type="tel"
          value={phone}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onChange={(e) => setPhone(e.target.value)}
          className={inputBase}
          maxLength={15}
          autoComplete="tel"
          pattern="^[\d\s\-+()]{0,15}$"
          spellCheck={false}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className={primaryBtn + (submitting ? " opacity-60 cursor-not-allowed" : "")}
      >
        {submitting ? "Saving..." : "Save Changes"}
      </button>

      {successMsg && (
        <p className="mt-2 text-emerald-400 font-semibold select-none">{successMsg}</p>
      )}
    </form>
  );
}
