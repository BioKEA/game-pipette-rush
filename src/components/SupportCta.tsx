import { useState } from "react";
import { play } from "@/lib/audio";

interface Props {
  onDismiss: () => void;
}

const SHARE_URL = "https://www.calalive.org/get-involved";

export function SupportCta({ onDismiss }: Props) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    play("click");
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(SHARE_URL).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      });
    }
  }

  function handleOpen() {
    play("click");
    if (typeof window !== "undefined") {
      window.open(SHARE_URL, "_blank", "noopener,noreferrer");
    }
  }

  function handleSkip() {
    play("click");
    onDismiss();
  }

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0a0e1a]/85 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]"
      onClick={onDismiss}
    >
      <div
        className="relative max-w-md w-full bg-[#0a0e1a] border-2 border-cyan-400/40 rounded-2xl p-7 shadow-[0_0_60px_rgba(34,211,238,0.4)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative orbital marks */}
        <div className="absolute -top-2 left-6 right-6 flex justify-between pointer-events-none">
          <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.9)]" />
          <div className="h-1 w-1 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.9)]" />
          <div className="h-1.5 w-1.5 rounded-full bg-cyan-400/60 shadow-[0_0_8px_rgba(34,211,238,0.7)]" />
        </div>

        <p className="text-[10px] uppercase tracking-[0.4em] text-cyan-400/70 mb-2">
          From the lab
        </p>
        <h2 className="text-2xl font-light leading-tight">
          Looks like you're hooked.
        </h2>

        <p className="text-sm text-white/70 mt-4 leading-relaxed">
          The pipeline you're racing here is real work. People in California
          are using exactly this kind of eDNA and barcoding to catalog the
          biodiversity in your watersheds, parks, and shorelines.
        </p>
        <p className="text-sm text-white/70 mt-3 leading-relaxed">
          If the vibe is landing, send{" "}
          <span className="font-semibold text-white">one friend</span> the link
          below. That's it.
        </p>

        <div className="mt-5 bg-white/[0.04] border border-cyan-400/30 rounded-lg px-3 py-3 font-mono text-xs text-cyan-300 break-all">
          calalive.org/get-involved
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            onClick={handleCopy}
            className="bg-cyan-400 text-[#0a0e1a] font-bold py-2.5 rounded text-xs uppercase tracking-widest hover:bg-cyan-300 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
          >
            {copied ? "✓ copied" : "Copy link"}
          </button>
          <button
            onClick={handleOpen}
            className="bg-white/5 hover:bg-white/10 border border-white/15 py-2.5 rounded text-xs uppercase tracking-widest"
          >
            Open ↗
          </button>
        </div>

        <button
          onClick={handleSkip}
          className="block mx-auto mt-3 text-[10px] uppercase tracking-widest text-white/50 hover:text-white py-2"
        >
          Maybe later
        </button>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
      `}</style>
    </div>
  );
}
