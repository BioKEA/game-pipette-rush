import { useEffect, useRef, useState } from "react";
import type { MicroGameProps } from "./types";
import { play } from "@/lib/audio";

const COLS = 8;
const ROWS = 6;
const TOTAL = COLS * ROWS;

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function QIAgilityGame({ duration, seed, onSuccess, onFail }: MicroGameProps) {
  const targetCount = 3;
  const completedRef = useRef(false);
  const rngRef = useRef(mulberry32(seed));
  const [tipX, setTipX] = useState(50);
  const [target, setTarget] = useState(() => Math.floor(rngRef.current() * TOTAL));
  const [hits, setHits] = useState(0);
  const [feedback, setFeedback] = useState<"hit" | "miss" | null>(null);
  const cooldownUntilRef = useRef(0);
  const tipRef = useRef<HTMLDivElement>(null);
  const plateRef = useRef<HTMLDivElement>(null);

  // Tip oscillation
  useEffect(() => {
    let raf = 0;
    let start = performance.now();
    const period = 2400;
    function tick(t: number) {
      const phase = ((t - start) % period) / period;
      const x = 50 + 47 * Math.sin(phase * Math.PI * 2);
      setTipX(x);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onFail();
      }
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onFail]);

  function handleDispense() {
    if (completedRef.current) return;
    if (performance.now() < cooldownUntilRef.current) return;
    const tipEl = tipRef.current;
    const plateEl = plateRef.current;
    if (!tipEl || !plateEl) return;
    const targetEl = plateEl.querySelector<HTMLElement>(`[data-well="${target}"]`);
    if (!targetEl) return;
    const tipRect = tipEl.getBoundingClientRect();
    const wellRect = targetEl.getBoundingClientRect();
    const tipCenter = tipRect.left + tipRect.width / 2;
    const wellCenter = wellRect.left + wellRect.width / 2;
    const dist = Math.abs(tipCenter - wellCenter);
    const tolerance = wellRect.width * 0.85;
    if (dist <= tolerance) {
      cooldownUntilRef.current = performance.now() + 150;
      const newHits = hits + 1;
      setHits(newHits);
      setFeedback("hit");
      play("hit");
      setTimeout(() => setFeedback(null), 200);
      if (newHits >= targetCount) {
        completedRef.current = true;
        setTimeout(() => onSuccess(), 200);
      } else {
        let next = Math.floor(rngRef.current() * TOTAL);
        if (next === target) next = (next + 1) % TOTAL;
        setTarget(next);
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
        handleDispense();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-6 touch-none"
      onPointerDown={handleDispense}
    >
      <div className="absolute top-3 left-0 right-0 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-400/70">
          QIAgility
        </p>
        <p className="text-sm text-white/80 mt-1">
          Tap when the tip is over the lit well
        </p>
      </div>

      <div className="relative w-full max-w-md mt-6 select-none pt-14">
        {/* 96-well plate */}
        <div className="bg-white/[0.02] border border-white/10 rounded-md p-3">
          <div
            ref={plateRef}
            className="relative grid gap-1.5"
            style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}
          >
            {/* Vertical alignment beam from tip down through plate */}
            <div
              className="absolute z-0 pointer-events-none"
              style={{
                left: `${tipX}%`,
                top: "-50px",
                bottom: "0",
                width: "2px",
                transform: "translateX(-50%)",
                background: "linear-gradient(to bottom, rgba(52,211,153,0.5), rgba(52,211,153,0.05))",
              }}
            />

            {/* Pipette tip */}
            <div
              className="absolute z-10 flex flex-col items-center"
              style={{ left: `${tipX}%`, top: "-50px", transform: "translateX(-50%)", width: "12px" }}
            >
              <div className="h-12 w-2 bg-gradient-to-b from-emerald-300 to-emerald-500 rounded-t shadow-[0_0_12px_rgba(52,211,153,0.6)]" />
              <div
                className="h-3 w-3 bg-emerald-300 rounded-b shadow-[0_0_10px_rgba(52,211,153,0.9)]"
                style={{ clipPath: "polygon(0 0, 100% 0, 50% 100%)" }}
              />
              {/* Invisible 1px drop-point used for hit detection */}
              <div ref={tipRef} style={{ width: "1px", height: "1px" }} />
            </div>

            {/* Drop trail */}
            {feedback === "hit" && (
              <div
                className="absolute z-10 pointer-events-none"
                style={{ left: `${tipX}%`, top: "-4px", transform: "translateX(-50%)" }}
              >
                <div className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(52,211,153,1)] animate-ping" />
              </div>
            )}

            {Array.from({ length: TOTAL }).map((_, i) => {
              const isTarget = i === target;
              const inTargetCol = i % COLS === target % COLS;
              const targetCol = target % COLS;
              const targetCenterPct = ((targetCol + 0.5) / COLS) * 100;
              const tipOverTarget = isTarget && Math.abs(tipX - targetCenterPct) < (100 / COLS) * 0.6;
              return (
                <div
                  key={i}
                  data-well={i}
                  className={`aspect-square rounded-full border ${
                    isTarget
                      ? tipOverTarget
                        ? "bg-emerald-300/70 border-emerald-200 shadow-[0_0_22px_rgba(52,211,153,1)]"
                        : "bg-emerald-400/40 border-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.7)] animate-pulse"
                      : inTargetCol
                      ? "bg-emerald-400/[0.07] border-emerald-400/25"
                      : "bg-white/[0.02] border-white/10"
                  }`}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        <div className="flex gap-1.5">
          {Array.from({ length: targetCount }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-8 rounded-full ${
                i < hits ? "bg-emerald-400" : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
          tap or space · {hits}/{targetCount}
        </p>
      </div>

      {feedback === "miss" && (
        <div className="absolute inset-0 pointer-events-none border-2 border-rose-400/40 animate-[flash_0.2s_ease-out]" />
      )}

      <style>{`
        @keyframes flash { from { opacity: 1; } to { opacity: 0; } }
      `}</style>
    </div>
  );
}
