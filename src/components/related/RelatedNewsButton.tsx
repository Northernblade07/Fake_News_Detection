"use client";

import { useState } from "react";
import RelatedNewsModal from "./RelatedNewsModal";

type Props = {
  title?: string;
  summary?: string;
  lang?: string;
  region?: string;
};

export default function RelatedNewsButton({ title, summary, lang = "en", region = "in" }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-6 w-full rounded-xl px-5 py-3 font-semibold 
        bg-gradient-to-r from-sky-400 via-sky-500 to-amber-400 
        text-[#0b0f1a] shadow-[0_6px_30px_rgba(56,189,248,0.25)]
        hover:brightness-110 transition"
      >
        Show Related News
      </button>

      {open && (
        <RelatedNewsModal
          title={title}
          summary={summary}
          lang={lang}
          region={region}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
