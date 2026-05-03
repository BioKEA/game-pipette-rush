import { useEffect, useRef, useState } from "react";
import type { MicroGameProps } from "./types";
import { play } from "@/lib/audio";

const COLORS = [
  { id: "red", hex: "#f87171" },
  { id: "amber", hex: "#fbbf24" },
  { id: "lime", hex: "#a3e635" },
  { id: "cyan", hex: "#22d3ee" },
  { id: "violet", hex: "#a78bfa" },
];

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function GelGame({ duration, seed, onSuccess, onFail }: MicroGameProps) {
  const completedRef = useRef(false);
  const layout = useRef<{ samples: number[]; wells: number[] } | null>(null);
  if (!layout.current) {
    const rng = mulberry32(seed);
    const wells = [0, 1, 2, 3, 4]; // wells in fixed color order
    // Fisher-Yates shuffle for the sample order
    const samples = [...wells];
    for (let i = samples.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [samples[i], samples[j]] = [samples[j], samples[i]];
    }
    // Guarantee a non-identity permutation so the puzzle is never trivial
    if (samples.every((v, idx) => v === idx)) {
      [samples[0], samples[1]] = [samples[1], samples[0]];
    }
    layout.current = { samples, wells };
  }
  const data = layout.current;
  const [placed, setPlaced] = useState<Record<number, number>>({}); // sampleIdx → wellIdx
  const [dragging, setDragging] = useState<number | null>(null);
  const [wrongWell, setWrongWell] = useState<number | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onFail();
      }
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onFail]);

  function pickSample(idx: number) {
    if (completedRef.current) return;
    if (placed[idx] !== undefined) return;
    setDragging(idx === dragging ? null : idx);
    play("click");
  }

  function dropOnWell(wellIdx: number) {
    if (completedRef.current || dragging === null) return;
    const sampleColor = data.samples[dragging];
    const wellColor = data.wells[wellIdx];
    // Each well can only hold one sample
    const wellOccupied = Object.values(placed).includes(wellIdx);
    if (wellOccupied) return;
    if (sampleColor !== wellColor) {
      // Wrong color — flash feedback, but keep the sample selected so the player can retry
      play("miss");
      setWrongWell(wellIdx);
      setTimeout(() => setWrongWell(null), 350);
      return;
    }
    play("hit");
    const next = { ...placed, [dragging]: wellIdx };
    setPlaced(next);
    setDragging(null);
    if (Object.keys(next).length >= data.samples.length) {
      completedRef.current = true;
      setTimeout(() => onSuccess(), 400);
    }
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center px-6 py-3 select-none">
      <p className="text-[10px] uppercase tracking-[0.3em] text-stone-300/70">
        Owl Gel Electrophoresis
      </p>
      <p className="text-sm text-white/80 mt-1">
        Drop each sample into its color-matched well
      </p>

      {/* Sample tray (top) */}
      <div className="mt-6">
        <p className="text-[9px] uppercase tracking-widest text-white/40 mb-2 text-center">
          samples (loaded in random order)
        </p>
        <div className="flex gap-3">
          {data.samples.map((colorIdx, i) => {
            const isPlaced = placed[i] !== undefined;
            const isDragging = dragging === i;
            const c = COLORS[colorIdx];
            return (
              <button
                key={i}
                onClick={() => pickSample(i)}
                disabled={isPlaced}
                className={`relative h-16 w-9 rounded-b-lg border-2 transition-all ${
                  isPlaced ? "opacity-20" : isDragging ? "scale-110" : "hover:scale-105"
                }`}
                style={{
                  background: c.hex,
                  borderColor: isDragging ? "#fff" : "rgba(255,255,255,0.3)",
                  boxShadow: isDragging ? `0 0 16px ${c.hex}` : undefined,
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="text-white/30 text-2xl my-3">↓</div>

      {/* Gel rig with wells */}
      <div className="bg-white/[0.02] border-2 border-stone-300/30 rounded-md p-4 w-full max-w-md">
        <p className="text-[9px] uppercase tracking-widest text-white/40 mb-2 text-center">
          gel · 5 wells (color-coded by primer set)
        </p>
        <div className="flex justify-around">
          {data.wells.map((colorIdx, i) => {
            const c = COLORS[colorIdx];
            const filled = Object.values(placed).includes(i);
            const sampleIdx = Object.entries(placed).find(([, w]) => w === i)?.[0];
            const fillColor = sampleIdx !== undefined
              ? COLORS[data.samples[parseInt(sampleIdx, 10)]].hex
              : null;
            return (
              <button
                key={i}
                onClick={() => dropOnWell(i)}
                disabled={dragging === null || filled}
                className="relative h-20 w-9 rounded-b-md border-2 transition-all"
                style={{
                  borderColor: wrongWell === i ? "#fb7185" : c.hex,
                  background: wrongWell === i
                    ? "rgba(251,113,133,0.2)"
                    : filled
                    ? `${fillColor}30`
                    : `${c.hex}10`,
                  boxShadow: wrongWell === i
                    ? "0 0 16px rgba(251,113,133,0.7)"
                    : dragging !== null && !filled
                    ? `0 0 14px ${c.hex}80`
                    : undefined,
                }}
              >
                {filled && fillColor && (
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-b-md"
                    style={{
                      height: "70%",
                      background: fillColor,
                      boxShadow: `inset 0 6px 12px rgba(255,255,255,0.3)`,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <p className="mt-4 text-[10px] font-mono text-white/40 uppercase tracking-widest">
        click a sample, then click its well · {Object.keys(placed).length}/{data.samples.length}
      </p>
    </div>
  );
}
