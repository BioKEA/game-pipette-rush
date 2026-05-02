import { useEffect, useRef, useState } from "react";
import type { MicroGameProps } from "./types";
import { play } from "@/lib/audio";

const COLORS = [
  { id: "red", hex: "#f87171", glow: "rgba(248,113,113,0.7)" },
  { id: "green", hex: "#4ade80", glow: "rgba(74,222,128,0.7)" },
  { id: "blue", hex: "#60a5fa", glow: "rgba(96,165,250,0.7)" },
  { id: "amber", hex: "#fbbf24", glow: "rgba(251,191,36,0.7)" },
];

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function QubitGame({ duration, seed, onSuccess, onFail }: MicroGameProps) {
  const completedRef = useRef(false);
  const [sequence] = useState(() => {
    const rng = mulberry32(seed);
    return Array.from({ length: 4 }, () => Math.floor(rng() * COLORS.length));
  });
  const [phase, setPhase] = useState<"showing" | "input" | "wrong">("showing");
  const [showIdx, setShowIdx] = useState(0);
  const [flash, setFlash] = useState<number | null>(null);
  const [input, setInput] = useState<number[]>([]);

  // Show sequence on mount
  useEffect(() => {
    if (phase !== "showing") return;
    if (showIdx >= sequence.length) {
      const t = setTimeout(() => setPhase("input"), 250);
      return () => clearTimeout(t);
    }
    setFlash(sequence[showIdx]);
    play("click");
    const t1 = setTimeout(() => setFlash(null), 380);
    const t2 = setTimeout(() => setShowIdx((i) => i + 1), 540);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [phase, showIdx, sequence]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onFail();
      }
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onFail]);

  function pressColor(idx: number) {
    if (completedRef.current || phase !== "input") return;
    setFlash(idx);
    setTimeout(() => setFlash(null), 200);
    const expected = sequence[input.length];
    if (idx !== expected) {
      play("miss");
      setPhase("wrong");
      completedRef.current = true;
      setTimeout(() => onFail(), 600);
      return;
    }
    play("hit");
    const next = [...input, idx];
    setInput(next);
    if (next.length >= sequence.length) {
      completedRef.current = true;
      setTimeout(() => onSuccess(), 400);
    }
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 select-none">
      <div className="absolute top-3 left-0 right-0 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-red-400/70">
          Qubit 4 Fluorometer
        </p>
        <p className="text-sm text-white/80 mt-1">
          {phase === "showing" ? "Watch the fluorescence sequence" : "Repeat the sequence"}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 w-72 h-72">
        {COLORS.map((c, i) => {
          const lit = flash === i;
          return (
            <button
              key={c.id}
              onClick={() => pressColor(i)}
              disabled={phase !== "input"}
              className="rounded-2xl border-2 transition-all"
              style={{
                background: lit ? c.hex : `${c.hex}20`,
                borderColor: lit ? "#fff" : `${c.hex}80`,
                boxShadow: lit ? `0 0 40px ${c.glow}` : `0 0 14px ${c.glow}33`,
                opacity: phase === "input" ? 1 : lit ? 1 : 0.5,
                transform: lit ? "scale(1.05)" : undefined,
              }}
            >
              <div className="w-full h-full flex items-center justify-center">
                <div
                  className="rounded-full transition-all"
                  style={{
                    width: lit ? "60%" : "40%",
                    aspectRatio: "1",
                    background: c.hex,
                    opacity: lit ? 1 : 0.4,
                  }}
                />
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-5 flex gap-1.5">
        {sequence.map((_, i) => (
          <div
            key={i}
            className={`h-2 w-12 rounded-full transition-all ${
              i < input.length
                ? "bg-red-400"
                : phase === "showing" && i < showIdx
                ? "bg-white/40"
                : "bg-white/10"
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
        {phase === "showing" ? "memorize" : phase === "wrong" ? "wrong sequence" : `${input.length}/${sequence.length}`}
      </p>
    </div>
  );
}
