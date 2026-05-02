import { useEffect, useRef, useState } from "react";
import type { MicroGameProps } from "./types";
import { play } from "@/lib/audio";

interface Well {
  id: number;
  hasBeads: boolean;
  lifted: boolean;
}

function makeWells(seed: number, count: number): Well[] {
  const rng = mulberry32(seed);
  const total = 24;
  const indices = new Set<number>();
  while (indices.size < count) {
    indices.add(Math.floor(rng() * total));
  }
  return Array.from({ length: total }, (_, i) => ({
    id: i,
    hasBeads: indices.has(i),
    lifted: false,
  }));
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function KingFisherGame({ duration, seed, onSuccess, onFail }: MicroGameProps) {
  const targetCount = 4;
  const [wells, setWells] = useState<Well[]>(() => makeWells(seed, targetCount));
  const [headPos, setHeadPos] = useState({ x: 0, y: 0 });
  const [isDown, setIsDown] = useState(false);
  const downStartRef = useRef<{ x: number; y: number; wellId: number } | null>(null);
  const completedRef = useRef(false);

  const liftedCount = wells.filter((w) => w.lifted).length;

  useEffect(() => {
    if (liftedCount >= targetCount && !completedRef.current) {
      completedRef.current = true;
      const t = setTimeout(() => onSuccess(), 200);
      return () => clearTimeout(t);
    }
  }, [liftedCount, onSuccess]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onFail();
      }
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onFail]);

  function handleDown(e: React.PointerEvent, wellId: number, hasBeads: boolean) {
    if (completedRef.current) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setIsDown(true);
    downStartRef.current = {
      x: e.clientX,
      y: rect.bottom,
      wellId: hasBeads ? wellId : -1,
    };
    setHeadPos({ x: e.clientX, y: e.clientY });
  }

  function handleMove(e: React.PointerEvent) {
    if (!isDown || !downStartRef.current) return;
    setHeadPos({ x: e.clientX, y: e.clientY });
    const dy = downStartRef.current.y - e.clientY;
    if (dy > 65 && downStartRef.current.wellId >= 0) {
      const id = downStartRef.current.wellId;
      setWells((prev) =>
        prev.map((w) => (w.id === id ? { ...w, lifted: true } : w))
      );
      play("lift");
      downStartRef.current = null;
      setIsDown(false);
    }
  }

  function handleUp() {
    setIsDown(false);
    downStartRef.current = null;
  }

  return (
    <div
      className="relative w-full h-full select-none"
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerLeave={handleUp}
    >
      <div className="absolute top-0 left-0 right-0 text-center pt-2">
        <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-400/70">
          KingFisher Flex
        </p>
        <p className="text-sm text-white/80 mt-1">Swipe a glowing bead upward</p>
      </div>

      {/* Persistent magnet head hovering above plate */}
      {!isDown && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-none">
          <div className="h-7 w-7 rounded-b-full border-2 border-cyan-400/50 bg-cyan-400/10 shadow-[0_0_12px_rgba(34,211,238,0.4)]" />
          <div className="text-cyan-400/30 text-xs">↓</div>
        </div>
      )}

      <div className="absolute inset-x-6 top-16 bottom-28 flex items-center justify-center">
        <div className="grid grid-cols-6 gap-2.5 w-full max-w-md">
          {wells.map((w) => (
            <div
              key={w.id}
              onPointerDown={
                w.hasBeads && !w.lifted
                  ? (e) => handleDown(e, w.id, true)
                  : undefined
              }
              className={`aspect-square rounded-full border-2 flex items-center justify-center transition-all touch-none ${
                w.lifted
                  ? "border-cyan-400/40 bg-cyan-400/5"
                  : w.hasBeads
                  ? "border-cyan-400/30 bg-cyan-400/[0.04] cursor-grab active:cursor-grabbing"
                  : "border-white/[0.06] bg-white/[0.01]"
              }`}
            >
              {w.hasBeads && !w.lifted && (
                <div className="h-3/5 w-3/5 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,0.8)] animate-pulse" />
              )}
              {w.lifted && (
                <div className="text-cyan-400 text-xs">✓</div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
          {liftedCount} / {targetCount}
        </div>
        <div className="flex gap-1.5">
          {Array.from({ length: targetCount }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 w-8 rounded-full transition-all ${
                i < liftedCount ? "bg-cyan-400" : "bg-white/10"
              }`}
            />
          ))}
        </div>
      </div>

      {isDown && (
        <div
          className="fixed pointer-events-none z-50"
          style={{ left: headPos.x - 14, top: headPos.y - 28 }}
        >
          <div className="h-7 w-7 rounded-b-full border-2 border-cyan-400 bg-cyan-400/20 shadow-[0_0_20px_rgba(34,211,238,0.7)]" />
        </div>
      )}
    </div>
  );
}
