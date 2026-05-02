import { useEffect, useRef, useState } from "react";
import type { MicroGameProps } from "./types";
import { play } from "@/lib/audio";

export function UVStratalinkerGame({ duration, seed, onSuccess, onFail }: MicroGameProps) {
  const completedRef = useRef(false);
  const requiredHits = 3;
  const [hits, setHits] = useState(0);
  const [position, setPosition] = useState(0); // 0..1, sweeps along arc
  const [zoneStart, setZoneStart] = useState(0.4);
  const [feedback, setFeedback] = useState<"hit" | "miss" | null>(null);
  const startRef = useRef(performance.now());
  const seedRef = useRef(seed);

  // Sweep loop
  useEffect(() => {
    let raf = 0;
    const period = 1700; // ms per sweep
    function tick(t: number) {
      const phase = ((t - startRef.current) % period) / period;
      // Triangle wave: 0 → 1 → 0
      setPosition(phase < 0.5 ? phase * 2 : 2 - phase * 2);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        if (hits >= requiredHits) onSuccess();
        else onFail();
      }
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onSuccess, onFail, hits]);

  const zoneSize = 0.12;
  const inZone = position >= zoneStart && position <= zoneStart + zoneSize;

  function fire() {
    if (completedRef.current) return;
    if (inZone) {
      const newHits = hits + 1;
      setHits(newHits);
      setFeedback("hit");
      play("hit");
      setTimeout(() => setFeedback(null), 200);
      if (newHits >= requiredHits) {
        completedRef.current = true;
        setTimeout(() => onSuccess(), 250);
      } else {
        // Move zone
        seedRef.current = (seedRef.current * 9301 + 49297) % 233280;
        setZoneStart(0.15 + (seedRef.current / 233280) * 0.6);
      }
    } else {
      setFeedback("miss");
      play("miss");
      setTimeout(() => setFeedback(null), 200);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space") {
        e.preventDefault();
        fire();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-6 select-none"
      onClick={fire}
    >
      <div className="absolute top-3 left-0 right-0 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-indigo-400/70">
          UV Stratalinker 2400
        </p>
        <p className="text-sm text-white/80 mt-1">
          Zap when the dose is in range
        </p>
      </div>

      {/* Linear UV dose meter */}
      <div className="w-80 max-w-full">
        <div className="relative h-12 bg-white/5 border border-white/10 rounded-lg overflow-hidden">
          {/* Tick marks */}
          {Array.from({ length: 11 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-white/10"
              style={{ left: `${i * 10}%` }}
            />
          ))}
          {/* Green zone */}
          <div
            className="absolute top-1 bottom-1 rounded"
            style={{
              left: `${zoneStart * 100}%`,
              width: `${zoneSize * 100}%`,
              background: "rgba(129,140,248,0.3)",
              border: "2px solid #818cf8",
              boxShadow: "0 0 12px rgba(129,140,248,0.6)",
            }}
          />
          {/* Cursor */}
          <div
            className="absolute top-0 bottom-0 w-1 transition-none"
            style={{
              left: `${position * 100}%`,
              background: inZone ? "#818cf8" : "#fff",
              boxShadow: inZone ? "0 0 12px #818cf8" : "0 0 6px #fff",
              transform: "translateX(-50%)",
            }}
          />
        </div>
        <div className="flex justify-between text-[8px] font-mono text-white/40 mt-1 uppercase tracking-widest">
          <span>0 mJ/cm²</span>
          <span>1200 mJ/cm² ← target</span>
          <span>3000 mJ/cm²</span>
        </div>
      </div>

      <div className="mt-8 flex gap-1.5">
        {Array.from({ length: requiredHits }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-12 rounded-full transition-all ${
              i < hits ? "bg-indigo-400" : "bg-white/10"
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
        click or space · {hits}/{requiredHits}
      </p>

      {feedback === "hit" && (
        <div className="absolute inset-0 bg-indigo-400/20 animate-[flash_0.2s_ease-out] pointer-events-none" />
      )}
      {feedback === "miss" && (
        <div className="absolute inset-0 bg-rose-400/15 animate-[flash_0.2s_ease-out] pointer-events-none" />
      )}

      <style>{`@keyframes flash { from { opacity: 1; } to { opacity: 0; } }`}</style>
    </div>
  );
}
