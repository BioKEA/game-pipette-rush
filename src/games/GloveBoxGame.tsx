import { useEffect, useRef, useState } from "react";
import type { MicroGameProps } from "./types";
import { play } from "@/lib/audio";

export function GloveBoxGame({ duration, seed, onSuccess, onFail }: MicroGameProps) {
  const completedRef = useRef(false);
  const requiredHits = 2;
  const [hits, setHits] = useState(0);
  const [pointer, setPointer] = useState({ x: 0.5, y: 0.5 });
  const [smoothed, setSmoothed] = useState({ x: 0.5, y: 0.5 });
  const [target, setTarget] = useState({ x: 0.3, y: 0.4 });
  const [feedback, setFeedback] = useState<"hit" | "miss" | null>(null);
  const seedRef = useRef(seed);
  const pointerRef = useRef({ x: 0.5, y: 0.5 });
  const smoothedRef = useRef({ x: 0.5, y: 0.5 });
  const hitsRef = useRef(0);

  // Smoothed cursor follows pointer with lag — runs once on mount
  useEffect(() => {
    let raf = 0;
    function tick() {
      const p = pointerRef.current;
      const s = smoothedRef.current;
      const next = {
        x: s.x + (p.x - s.x) * 0.09,
        y: s.y + (p.y - s.y) * 0.09,
      };
      smoothedRef.current = next;
      setSmoothed(next);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    hitsRef.current = hits;
  }, [hits]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        if (hitsRef.current >= requiredHits) onSuccess();
        else onFail();
      }
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onSuccess, onFail]);

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    if (completedRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const p = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
    pointerRef.current = p;
    setPointer(p);
  }

  function handleClick() {
    if (completedRef.current) return;
    const s = smoothedRef.current;
    const dx = s.x - target.x;
    const dy = s.y - target.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 0.085) {
      const next = hits + 1;
      setHits(next);
      setFeedback("hit");
      play("hit");
      setTimeout(() => setFeedback(null), 250);
      if (next >= requiredHits) {
        completedRef.current = true;
        setTimeout(() => onSuccess(), 250);
      } else {
        seedRef.current = (seedRef.current * 9301 + 49297) % 233280;
        const r1 = (seedRef.current % 1000) / 1000;
        seedRef.current = (seedRef.current * 9301 + 49297) % 233280;
        const r2 = (seedRef.current % 1000) / 1000;
        setTarget({ x: 0.15 + r1 * 0.7, y: 0.15 + r2 * 0.7 });
      }
    } else {
      setFeedback("miss");
      play("miss");
      setTimeout(() => setFeedback(null), 250);
    }
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 select-none">
      <div className="absolute top-3 left-0 right-0 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-slate-300/70">
          Cleatech HEPA Glove Box
        </p>
        <p className="text-sm text-white/80 mt-1">
          Steady the sample onto the target
        </p>
      </div>

      <div
        className="relative bg-black/40 border-2 border-slate-300/30 rounded-lg overflow-hidden cursor-none touch-none"
        style={{ width: "min(560px, 90vw)", aspectRatio: "5/3" }}
        onPointerMove={handleMove}
        onPointerDown={handleClick}
      >
        {/* Glove port outlines */}
        <div className="absolute top-1/2 -translate-y-1/2 left-2 h-20 w-20 rounded-full border border-slate-300/20" />
        <div className="absolute top-1/2 -translate-y-1/2 right-2 h-20 w-20 rounded-full border border-slate-300/20" />

        {/* Target zone */}
        <div
          className="absolute h-12 w-12 rounded-full border-2 border-slate-300 -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${target.x * 100}%`,
            top: `${target.y * 100}%`,
            background: "rgba(203,213,225,0.1)",
            boxShadow: "0 0 16px rgba(203,213,225,0.5)",
          }}
        >
          <div className="absolute inset-2 rounded-full border border-slate-300/40" />
        </div>

        {/* Pointer (real mouse position, faint) */}
        <div
          className="absolute h-3 w-3 rounded-full bg-white/30 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${pointer.x * 100}%`, top: `${pointer.y * 100}%` }}
        />

        {/* Smoothed sample (the lagging cursor) */}
        <div
          className="absolute h-6 w-6 rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${smoothed.x * 100}%`,
            top: `${smoothed.y * 100}%`,
            background: "rgba(203,213,225,0.6)",
            border: "2px solid #cbd5e1",
            boxShadow: "0 0 12px rgba(203,213,225,0.8)",
          }}
        />

        {/* Connection line */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <line
            x1={`${pointer.x * 100}%`}
            y1={`${pointer.y * 100}%`}
            x2={`${smoothed.x * 100}%`}
            y2={`${smoothed.y * 100}%`}
            stroke="rgba(203,213,225,0.25)"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
        </svg>
      </div>

      <div className="mt-5 flex gap-1.5">
        {Array.from({ length: requiredHits }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-12 rounded-full transition-all ${
              i < hits ? "bg-slate-300" : "bg-white/10"
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
        click on target · {hits}/{requiredHits}
      </p>

      {feedback === "miss" && (
        <div className="absolute inset-0 bg-rose-400/15 animate-[flash_0.2s_ease-out] pointer-events-none" />
      )}

      <style>{`@keyframes flash { from { opacity: 1; } to { opacity: 0; } }`}</style>
    </div>
  );
}
