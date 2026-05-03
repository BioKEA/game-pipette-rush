import { useEffect, useRef, useState } from "react";
import type { MicroGameProps } from "./types";

export function SpectroGame({ duration, onSuccess, onFail }: MicroGameProps) {
  const completedRef = useRef(false);
  const requiredOnTarget = 1100; // ms cumulative on-peak
  const tolerance = 0.07;
  const [cursorX, setCursorX] = useState(0.5);
  const [peakX, setPeakX] = useState(0.5);
  const [onTargetMs, setOnTargetMs] = useState(0);
  const startRef = useRef(performance.now());
  const cursorXRef = useRef(0.5);
  const peakXRef = useRef(0.5);

  // Move peak sinusoidally
  useEffect(() => {
    let raf = 0;
    function tick(t: number) {
      const elapsed = t - startRef.current;
      const slow = Math.sin(elapsed / 1300) * 0.3;
      const fast = Math.sin(elapsed / 400) * 0.05;
      const p = 0.5 + slow + fast;
      peakXRef.current = p;
      setPeakX(p);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Cumulative time-on-target accumulator (runs once on mount)
  useEffect(() => {
    const id = setInterval(() => {
      setOnTargetMs((prev) => {
        const dist = Math.abs(cursorXRef.current - peakXRef.current);
        const next = dist <= tolerance ? Math.min(requiredOnTarget, prev + 30) : Math.max(0, prev - 50);
        if (next >= requiredOnTarget && !completedRef.current) {
          completedRef.current = true;
          setTimeout(() => onSuccess(), 200);
        }
        return next;
      });
    }, 30);
    return () => clearInterval(id);
  }, [onSuccess]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onFail();
      }
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onFail]);

  function handleMove(e: React.PointerEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    cursorXRef.current = x;
    setCursorX(x);
  }

  const onTargetPct = (onTargetMs / requiredOnTarget) * 100;
  const dist = Math.abs(cursorX - peakX);
  const inZone = dist <= tolerance;

  return (
    <div className="absolute inset-0 flex flex-col items-center px-6 pt-16 select-none">
      <div className="absolute top-3 left-0 right-0 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-pink-400/70">
          Ultrospec 2100 Pro
        </p>
        <p className="text-sm text-white/80 mt-1">
          Track the absorbance peak
        </p>
      </div>

      <div
        className="w-full max-w-2xl h-72 relative bg-black/40 border border-white/10 rounded-md overflow-hidden cursor-crosshair"
        onPointerMove={handleMove}
      >
        {/* Spectrum gradient backdrop */}
        <div
          className="absolute inset-0 opacity-15"
          style={{
            background: "linear-gradient(to right, #6366f1, #06b6d4, #10b981, #facc15, #f97316, #ef4444)",
          }}
        />
        {/* Grid */}
        {[0.25, 0.5, 0.75].map((g) => (
          <div
            key={g}
            className="absolute inset-x-0 h-px bg-white/5"
            style={{ top: `${g * 100}%` }}
          />
        ))}
        {/* Absorbance curve as a peaked gaussian around peakX */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d={(() => {
              const pts: string[] = [];
              for (let i = 0; i <= 50; i++) {
                const x = i * 2;
                const xn = x / 100;
                const dx = (xn - peakX) / 0.08;
                const y = 90 - Math.exp(-dx * dx) * 75;
                pts.push(`${i === 0 ? "M" : "L"} ${x} ${y}`);
              }
              return pts.join(" ");
            })()}
            stroke="#f472b6"
            strokeWidth="1"
            fill="rgba(244,114,182,0.25)"
            style={{ filter: "drop-shadow(0 0 4px rgba(244,114,182,0.6))" }}
          />
        </svg>
        {/* Cursor line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 transition-none"
          style={{
            left: `${cursorX * 100}%`,
            background: inZone ? "#f472b6" : "rgba(255,255,255,0.7)",
            boxShadow: inZone ? "0 0 12px #f472b6" : undefined,
            transform: "translateX(-50%)",
          }}
        />
        {/* Reading label at top */}
        <p className="absolute top-2 left-3 text-[10px] font-mono text-pink-400/80">
          λ {Math.round(220 + cursorX * 580)} nm
        </p>
        <p className="absolute top-2 right-3 text-[10px] font-mono text-white/40">
          peak {Math.round(220 + peakX * 580)} nm
        </p>
      </div>

      <div className="mt-4 w-64 h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-pink-400 transition-all"
          style={{
            width: `${onTargetPct}%`,
            boxShadow: "0 0 8px #f472b6",
          }}
        />
      </div>
      <p className="mt-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
        on peak · {Math.round(onTargetPct)}%
      </p>
    </div>
  );
}
