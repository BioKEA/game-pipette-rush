import { useEffect, useRef, useState } from "react";
import type { MicroGameProps } from "./types";
import { play } from "@/lib/audio";

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function LightCyclerGame({ duration, seed, onSuccess, onFail }: MicroGameProps) {
  const completedRef = useRef(false);
  const startRef = useRef(performance.now());
  const rngRef = useRef(mulberry32(seed));
  const requiredHits = 2;
  const sweepDuration = Math.min(1800, duration * 0.5);

  const [now, setNow] = useState(0);
  const [hits, setHits] = useState(0);
  const [feedback, setFeedback] = useState<"hit" | "miss" | null>(null);
  const [thresholdY, setThresholdY] = useState(() => 0.55 + rngRef.current() * 0.2);
  const [sweepStart, setSweepStart] = useState(0);

  useEffect(() => {
    let raf = 0;
    function tick() {
      setNow(performance.now() - startRef.current);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const hitsRef = useRef(hits);
  useEffect(() => {
    hitsRef.current = hits;
  });

  useEffect(() => {
    const t = setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      if (hitsRef.current >= requiredHits) onSuccess();
      else onFail();
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onSuccess, onFail]);

  // Sigmoid value at time t (0 to 1)
  function curveAt(t: number): number {
    const x = (t / sweepDuration) * 12 - 6;
    return 1 / (1 + Math.exp(-x));
  }

  const elapsed = now - sweepStart;
  const curveValue = curveAt(elapsed);

  // Reset sweep when curve completes
  useEffect(() => {
    if (elapsed > sweepDuration + 400) {
      setSweepStart(now + 200);
      setThresholdY(0.45 + rngRef.current() * 0.3);
    }
  }, [elapsed, sweepDuration, now]);

  function handleTap() {
    if (completedRef.current) return;
    const dist = Math.abs(curveValue - thresholdY);
    if (dist < 0.12 && elapsed > 200) {
      const newHits = hits + 1;
      setHits(newHits);
      setFeedback("hit");
      play("hit");
      setTimeout(() => setFeedback(null), 250);
      if (newHits >= requiredHits) {
        completedRef.current = true;
        setTimeout(() => onSuccess(), 250);
      } else {
        setSweepStart(now + 100);
        setThresholdY(0.45 + rngRef.current() * 0.3);
      }
    } else {
      setFeedback("miss");
      play("miss");
      setTimeout(() => setFeedback(null), 250);
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space") {
        e.preventDefault();
        handleTap();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Build path for the visible curve up to current time
  const samples = 40;
  const path: string[] = [];
  for (let i = 0; i <= samples; i++) {
    const tFrac = i / samples;
    if (tFrac > elapsed / sweepDuration) break;
    const v = curveAt(tFrac * sweepDuration);
    const x = tFrac * 100;
    const y = (1 - v) * 100;
    path.push(`${i === 0 ? "M" : "L"} ${x} ${y}`);
  }

  const cursorX = Math.min(100, (elapsed / sweepDuration) * 100);
  const cursorY = (1 - curveValue) * 100;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-6 select-none"
      onClick={handleTap}
    >
      <div className="absolute top-3 left-0 right-0 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-violet-400/70">
          LightCycler 480 II
        </p>
        <p className="text-sm text-white/80 mt-1">
          Tap when the curve crosses the threshold
        </p>
      </div>

      <div className="w-full max-w-md aspect-[4/3] relative bg-black/40 border border-white/10 rounded-md overflow-hidden mt-8">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 w-full h-full">
          {/* Grid */}
          {[0.25, 0.5, 0.75].map((g) => (
            <line
              key={g}
              x1="0"
              y1={g * 100}
              x2="100"
              y2={g * 100}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="0.3"
            />
          ))}
          {/* Hit-zone band */}
          <rect
            x="0"
            y={(1 - thresholdY - 0.12) * 100}
            width="100"
            height={0.24 * 100}
            fill="rgba(253,224,71,0.08)"
          />
          {/* Threshold line */}
          <line
            x1="0"
            y1={(1 - thresholdY) * 100}
            x2="100"
            y2={(1 - thresholdY) * 100}
            stroke="#fde047"
            strokeWidth="0.4"
            strokeDasharray="2 2"
          />
          {/* Curve */}
          <path
            d={path.join(" ")}
            stroke="#a78bfa"
            strokeWidth="0.8"
            fill="none"
            style={{ filter: "drop-shadow(0 0 2px #a78bfa)" }}
          />
          {/* Cursor */}
          {elapsed > 0 && elapsed < sweepDuration && (
            <circle
              cx={cursorX}
              cy={cursorY}
              r="1.4"
              fill="#fff"
              style={{ filter: "drop-shadow(0 0 3px #fff)" }}
            />
          )}
        </svg>

        <div className="absolute top-2 right-2 text-[9px] font-mono text-violet-400/70">
          Ct {(thresholdY * 40).toFixed(1)}
        </div>
        <div className="absolute bottom-2 left-2 text-[9px] font-mono text-white/40">
          fluorescence
        </div>

        {feedback === "hit" && (
          <div className="absolute inset-0 bg-emerald-400/20 animate-[flash_0.25s_ease-out] pointer-events-none" />
        )}
        {feedback === "miss" && (
          <div className="absolute inset-0 bg-rose-400/20 animate-[flash_0.25s_ease-out] pointer-events-none" />
        )}
      </div>

      <div className="mt-6 flex flex-col items-center gap-2">
        <div className="flex gap-1.5">
          {Array.from({ length: requiredHits }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-10 rounded-full ${
                i < hits ? "bg-violet-400" : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
          tap or space · {hits}/{requiredHits}
        </p>
      </div>

      <style>{`
        @keyframes flash { from { opacity: 1; } to { opacity: 0; } }
      `}</style>
    </div>
  );
}
