// app/profile/components/DangerZone.tsx
"use client";

import { useState, useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { primaryBtn } from "../Theme";

interface DangerZoneProps {
  onDelete: () => Promise<void>;
  onDownload: () => Promise<void>;
  onLogout: () => Promise<void>;
}

export default function DangerZone({ onDelete, onDownload, onLogout }: DangerZoneProps) {
  const [confirm, setConfirm] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!modalRef.current) return;
    if (confirm) {
      gsap.fromTo(
        modalRef.current,
        { scale: 0.9, opacity: 0 },
        { scale: 1, opacity: 1, duration: 0.4, ease: "power3.out" }
      );
    } else {
      gsap.to(modalRef.current, { scale: 0.9, opacity: 0, duration: 0.3 });
    }
  }, [confirm]);

  async function handleDeleteConfirm() {
    try {
      await onDelete();
    } catch {
      // Shake modal on failure
      if (!modalRef.current) return;
      gsap.fromTo(
        modalRef.current,
        { x: -10 },
        { x: 10, duration: 0.1, yoyo: true, repeat: 5 }
      );
    }
  }

  return (
    <section className="mt-16 p-6 rounded-2xl bg-[#331800]/80 border-2 border-amber-400 max-w-md mx-auto">
      <h2 className="text-xl font-bold text-amber-400 mb-6">Danger Zone</h2>

      <button
        onClick={() => setConfirm(true)}
        className={`${primaryBtn} bg-amber-400 w-full mb-4`}
      >
        Delete Account
      </button>
      <button
        onClick={onDownload}
        className={`${primaryBtn} w-full mb-4`}
      >
        Download Account Data
      </button>
      <button
        onClick={onLogout}
        className={`${primaryBtn} w-full`}
      >
        Logout
      </button>

      {confirm && (
        <div
          ref={modalRef}
          className="fixed inset-0 flex items-center justify-center bg-black/80 z-50"
        >
          <div className="bg-[#0b0f1a] rounded-lg p-6 max-w-sm w-full text-center shadow-lg border border-amber-400">
            <p className="mb-6 text-lg font-semibold text-white">
              Are you sure you want to delete your account? This action is irreversible.
            </p>
            <div className="flex justify-around gap-4">
              <button
                onClick={handleDeleteConfirm}
                className={`${primaryBtn} bg-amber-400`}
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setConfirm(false)}
                className={`${primaryBtn} bg-slate-700`}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
