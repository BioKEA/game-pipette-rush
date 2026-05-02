import { useEffect, useRef, useState } from "react";
import type { MicroGameProps } from "./types";
import { play } from "@/lib/audio";

type Base = "A" | "T" | "C" | "G";
const BASES: Base[] = ["A", "T", "C", "G"];
const BASE_COLOR: Record<Base, string> = {
  A: "#fcd34d",
  T: "#34d399",
  C: "#22d3ee",
  G: "#fb7185",
};

interface Glyph {
  id: number;
  base: Base;
  spawnedAt: number;
  hit: "pending" | "good" | "miss";
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function PromethionGame({ duration, seed, onSuccess, onFail }: MicroGameProps) {
  const totalGlyphs = 7;
  const requiredHits = 5;
  const travelTime = Math.min(2200, duration * 0.55);
  const completedRef = useRef(false);
  const startRef = useRef(performance.now());

  const [glyphs] = useState<Glyph[]>(() => {
    const rng = mulberry32(seed);
    const spread = duration - travelTime - 600;
    return Array.from({ length: totalGlyphs }, (_, i) => ({
      id: i,
      base: BASES[Math.floor(rng() * BASES.length)],
      spawnedAt: 200 + (i * spread) / totalGlyphs,
      hit: "pending" as const,
    }));
  });
  const [glyphState, setGlyphState] = useState<Record<number, "pending" | "good" | "miss">>(
    () => Object.fromEntries(glyphs.map((g) => [g.id, "pending" as const]))
  );
  const [now, setNow] = useState(0);
  const [activeBase, setActiveBase] = useState<Base | null>(null);
  const hits = Object.values(glyphState).filter((s) => s === "good").length;

  useEffect(() => {
    let raf = 0;
    function tick() {
      setNow(performance.now() - startRef.current);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Mark misses
  useEffect(() => {
    setGlyphState((prev) => {
      let changed = false;
      const next = { ...prev };
      glyphs.forEach((g) => {
        if (next[g.id] === "pending") {
          const arrival = g.spawnedAt + travelTime;
          if (now > arrival + 220) {
            next[g.id] = "miss";
            changed = true;
          }
        }
      });
      return changed ? next : prev;
    });
  }, [now, glyphs, travelTime]);

  const hitsRef = useRef(hits);
  useEffect(() => {
    hitsRef.current = hits;
  });
  const scheduledRef = useRef(false);

  useEffect(() => {
    if (scheduledRef.current || completedRef.current) return;
    const wonNow = hits >= requiredHits;
    const allDone = glyphs.every((g) => glyphState[g.id] !== "pending");
    if (!wonNow && !allDone) return;
    scheduledRef.current = true;
    const win = wonNow;
    setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      if (win) onSuccess();
      else onFail();
    }, 250);
  }, [hits, glyphState, glyphs, onSuccess, onFail]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      if (hitsRef.current >= requiredHits) onSuccess();
      else onFail();
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onSuccess, onFail]);

  function tryHit(base: Base) {
    if (completedRef.current) return;
    setActiveBase(base);
    setTimeout(() => setActiveBase(null), 120);
    setGlyphState((prev) => {
      let bestId = -1;
      let bestDist = Infinity;
      glyphs.forEach((g) => {
        if (prev[g.id] !== "pending" || g.base !== base) return;
        const arrival = g.spawnedAt + travelTime;
        const dist = Math.abs(now - arrival);
        if (dist < 260 && dist < bestDist) {
          bestDist = dist;
          bestId = g.id;
        }
      });
      if (bestId === -1) {
        play("miss");
        return prev;
      }
      play("hit");
      return { ...prev, [bestId]: "good" };
    });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const k = e.key.toUpperCase();
      if (k === "A" || k === "T" || k === "C" || k === "G") {
        tryHit(k as Base);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="text-center pt-2 pb-2">
        <p className="text-[10px] uppercase tracking-[0.3em] text-amber-300/70">
          Promethion 2 · Flow cell A
        </p>
        <p className="text-sm text-white/80 mt-1">Match each base as it lands</p>
      </div>

      <div className="flex-1 relative px-4">
        <div className="absolute top-2 bottom-32 left-1/2 -translate-x-1/2 w-full max-w-md bg-white/[0.02] border border-white/10 rounded-md overflow-hidden">
          {/* Hit zone line */}
          <div className="absolute inset-x-0 bottom-8 h-px bg-amber-300/60 shadow-[0_0_8px_rgba(252,211,77,0.6)]">
            <div className="absolute inset-x-0 -top-6 h-6 bg-gradient-to-t from-amber-300/15 to-transparent" />
          </div>
          {/* Helix decoration */}
          <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 200" preserveAspectRatio="none">
            <path
              d="M 30 0 Q 70 50, 30 100 Q -10 150, 30 200"
              stroke="white"
              strokeWidth="0.3"
              fill="none"
            />
            <path
              d="M 70 0 Q 30 50, 70 100 Q 110 150, 70 200"
              stroke="white"
              strokeWidth="0.3"
              fill="none"
            />
          </svg>

          {/* Falling glyphs */}
          {glyphs.map((g) => {
            const elapsed = now - g.spawnedAt;
            if (elapsed < 0) return null;
            const progress = elapsed / travelTime;
            if (progress > 1.3) return null;
            const state = glyphState[g.id];
            const top = `calc(${progress * 100}% - 24px)`;
            const opacity = state === "miss" ? 0.15 : state === "good" ? 0 : 1;
            // Each glyph in its own column
            const colIdx = g.id % 4;
            const left = `${(colIdx + 0.5) * 25}%`;
            return (
              <div
                key={g.id}
                className="absolute font-mono font-bold text-2xl flex items-center justify-center transition-opacity"
                style={{
                  top,
                  left,
                  width: "44px",
                  height: "44px",
                  transform: "translateX(-50%)",
                  color: BASE_COLOR[g.base],
                  textShadow: `0 0 12px ${BASE_COLOR[g.base]}`,
                  opacity,
                  border: `1px solid ${BASE_COLOR[g.base]}40`,
                  borderRadius: "6px",
                  background: `${BASE_COLOR[g.base]}10`,
                }}
              >
                {g.base}
              </div>
            );
          })}
        </div>

        {/* Buttons */}
        <div className="absolute bottom-12 left-4 right-4">
          <div className="grid grid-cols-4 gap-2 max-w-md mx-auto">
            {BASES.map((b) => (
              <button
                key={b}
                onPointerDown={() => tryHit(b)}
                className="py-3 rounded font-mono font-bold text-xl transition-all active:scale-95"
                style={{
                  backgroundColor: `${BASE_COLOR[b]}${activeBase === b ? "40" : "20"}`,
                  border: `2px solid ${BASE_COLOR[b]}`,
                  color: BASE_COLOR[b],
                  boxShadow: activeBase === b
                    ? `0 0 24px ${BASE_COLOR[b]}`
                    : `0 0 10px ${BASE_COLOR[b]}30`,
                }}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        <div className="absolute bottom-2 left-0 right-0 text-center">
          <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
            {hits}/{requiredHits} reads
          </p>
        </div>
      </div>
    </div>
  );
}
