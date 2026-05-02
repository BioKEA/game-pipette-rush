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

interface BandPattern {
  bands: number[]; // y positions 0..1
}

function makePattern(rng: () => number): BandPattern {
  const count = 3 + Math.floor(rng() * 2);
  const bands: number[] = [];
  for (let i = 0; i < count; i++) {
    bands.push(0.1 + rng() * 0.8);
  }
  return { bands: bands.sort() };
}

function patternDistance(a: BandPattern, b: BandPattern): number {
  if (a.bands.length !== b.bands.length) return 1;
  let total = 0;
  for (let i = 0; i < a.bands.length; i++) {
    total += Math.abs(a.bands[i] - b.bands[i]);
  }
  return total;
}

export function QIAxcelGame({ duration, seed, onSuccess, onFail }: MicroGameProps) {
  const completedRef = useRef(false);
  const rngRef = useRef(mulberry32(seed));
  const [picked, setPicked] = useState<number | null>(null);
  const dataRef = useRef<{ unknown: BandPattern; lanes: BandPattern[]; correctIdx: number } | null>(null);
  if (!dataRef.current) {
    const rng = rngRef.current;
    const correctIdx = Math.floor(rng() * 4);
    const correct = makePattern(rng);
    // Generate decoys with at least 0.2 distance from the correct pattern
    const lanes: BandPattern[] = [];
    for (let i = 0; i < 4; i++) {
      if (i === correctIdx) {
        lanes.push(correct);
        continue;
      }
      let candidate = makePattern(rng);
      for (let tries = 0; tries < 10 && patternDistance(candidate, correct) < 0.25; tries++) {
        candidate = makePattern(rng);
      }
      lanes.push(candidate);
    }
    dataRef.current = { unknown: correct, lanes, correctIdx };
  }
  const data = dataRef.current;

  useEffect(() => {
    const t = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onFail();
      }
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onFail]);

  function pick(idx: number) {
    if (completedRef.current || picked !== null) return;
    setPicked(idx);
    completedRef.current = true;
    if (idx === data.correctIdx) {
      play("hit");
      setTimeout(() => onSuccess(), 600);
    } else {
      play("miss");
      setTimeout(() => onFail(), 600);
    }
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center px-6 py-3 select-none">
      <p className="text-[10px] uppercase tracking-[0.3em] text-green-400/70">
        QIAxcel Advanced
      </p>
      <p className="text-sm text-white/80 mt-1">
        Match the unknown lane
      </p>

      {/* Unknown above, references in a single row below */}
      <div className="mt-5 flex flex-col items-center gap-4">
        <BandLane
          label="unknown"
          pattern={data.unknown}
          isUnknown
        />

        <div className="text-white/30 text-xl">≈</div>

        <div className="flex gap-4">
          {data.lanes.map((p, i) => {
            const isCorrect = i === data.correctIdx;
            const wrongPick = picked === i && !isCorrect;
            const correctPick = picked !== null && isCorrect;
            return (
              <button
                key={i}
                onClick={() => pick(i)}
                disabled={picked !== null}
                className="transition-all"
                style={{
                  opacity: picked !== null && !isCorrect && i !== picked ? 0.3 : 1,
                }}
              >
                <BandLane
                  label={`ref ${i + 1}`}
                  pattern={p}
                  highlight={correctPick ? "correct" : wrongPick ? "wrong" : null}
                />
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-5 text-[10px] font-mono text-white/40 uppercase tracking-widest">
        click a reference lane that matches
      </p>
    </div>
  );
}

function BandLane({
  label,
  pattern,
  isUnknown,
  highlight,
}: {
  label: string;
  pattern: BandPattern;
  isUnknown?: boolean;
  highlight?: "correct" | "wrong" | null;
}) {
  const borderColor = highlight === "correct"
    ? "#34d399"
    : highlight === "wrong"
    ? "#fb7185"
    : isUnknown
    ? "rgba(255,255,255,0.4)"
    : "rgba(74,222,128,0.4)";
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-14 h-48 border-2 rounded bg-black/40 overflow-hidden"
        style={{
          borderColor,
          boxShadow:
            highlight === "correct"
              ? "0 0 18px rgba(52,211,153,0.6)"
              : highlight === "wrong"
              ? "0 0 18px rgba(251,113,133,0.6)"
              : undefined,
        }}
      >
        {/* Lane gradient backdrop */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(74,222,128,0.04), transparent)",
          }}
        />
        {/* Bands */}
        {pattern.bands.map((y, i) => (
          <div
            key={i}
            className="absolute left-1 right-1 h-1.5 rounded-sm"
            style={{
              top: `${y * 100}%`,
              background: isUnknown
                ? "linear-gradient(to right, rgba(255,255,255,0.7), rgba(255,255,255,0.95), rgba(255,255,255,0.7))"
                : "linear-gradient(to right, rgba(74,222,128,0.6), rgba(74,222,128,0.95), rgba(74,222,128,0.6))",
              boxShadow: isUnknown
                ? "0 0 6px rgba(255,255,255,0.6)"
                : "0 0 6px rgba(74,222,128,0.6)",
            }}
          />
        ))}
      </div>
      <p className="text-[9px] font-mono uppercase tracking-widest text-white/50 mt-1.5">
        {label}
      </p>
    </div>
  );
}
