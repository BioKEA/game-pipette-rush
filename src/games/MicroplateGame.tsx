import { useEffect, useRef, useState } from "react";
import type { MicroGameProps } from "./types";
import { play } from "@/lib/audio";

const COLS = 12;
const ROWS = 8;
const TOTAL = COLS * ROWS;

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Round {
  intensities: number[];
  brightest: number;
}

function makeRound(rng: () => number, gap: number): Round {
  const brightest = Math.floor(rng() * TOTAL);
  const intensities = Array.from({ length: TOTAL }, () => 0.05 + rng() * 0.2);
  intensities[brightest] = Math.min(1, 0.5 + gap);
  return { intensities, brightest };
}

export function MicroplateGame({ duration, seed, onSuccess, onFail }: MicroGameProps) {
  const completedRef = useRef(false);
  const requiredHits = 2;
  const rngRef = useRef(mulberry32(seed));
  const [round, setRound] = useState(0);
  const [hits, setHits] = useState(0);
  const [data, setData] = useState<Round>(() => makeRound(rngRef.current, 0.55));
  const [feedback, setFeedback] = useState<"hit" | "miss" | null>(null);
  const [picked, setPicked] = useState<number | null>(null);

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

  function clickWell(idx: number) {
    if (completedRef.current || picked !== null) return;
    setPicked(idx);
    if (idx === data.brightest) {
      const next = hits + 1;
      setHits(next);
      setFeedback("hit");
      play("hit");
      setTimeout(() => {
        if (next >= requiredHits) {
          completedRef.current = true;
          onSuccess();
        } else {
          setRound((r) => r + 1);
          // Each round: smaller intensity gap = harder
          const gap = Math.max(0.25, 0.55 - next * 0.12);
          setData(makeRound(rngRef.current, gap));
          setPicked(null);
          setFeedback(null);
        }
      }, 500);
    } else {
      setFeedback("miss");
      play("miss");
      setTimeout(() => {
        completedRef.current = true;
        onFail();
      }, 600);
    }
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center px-6 select-none">
      <div className="absolute top-3 left-0 right-0 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-blue-400/70">
          FilterMax F3
        </p>
        <p className="text-sm text-white/80 mt-1">
          Find the brightest well · round {round + 1}/{requiredHits}
        </p>
      </div>

      <div className="bg-white/[0.02] border border-blue-400/30 rounded-md p-4">
        <div
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${COLS}, 28px)` }}
        >
          {data.intensities.map((intensity, i) => {
            const isBrightest = i === data.brightest;
            const wasPicked = picked === i;
            return (
              <button
                key={i}
                onClick={() => clickWell(i)}
                disabled={picked !== null}
                className="aspect-square rounded-full border transition-all"
                style={{
                  background: `rgba(96,165,250,${intensity})`,
                  borderColor:
                    wasPicked && isBrightest
                      ? "#34d399"
                      : wasPicked
                      ? "#fb7185"
                      : `rgba(96,165,250,${0.3 + intensity * 0.5})`,
                  boxShadow:
                    wasPicked && isBrightest
                      ? "0 0 16px rgba(52,211,153,0.7)"
                      : wasPicked
                      ? "0 0 16px rgba(251,113,133,0.7)"
                      : `0 0 ${intensity * 16}px rgba(96,165,250,${intensity * 0.6})`,
                }}
              />
            );
          })}
        </div>
      </div>

      <div className="mt-5 flex gap-1.5">
        {Array.from({ length: requiredHits }).map((_, i) => (
          <div
            key={i}
            className={`h-2 w-12 rounded-full transition-all ${
              i < hits ? "bg-blue-400" : "bg-white/10"
            }`}
          />
        ))}
      </div>
      <p className="mt-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
        96-well plate · click the outlier
      </p>

      {feedback === "hit" && (
        <div className="absolute inset-0 bg-blue-400/10 animate-[flash_0.25s_ease-out] pointer-events-none" />
      )}
      {feedback === "miss" && (
        <div className="absolute inset-0 bg-rose-400/15 animate-[flash_0.25s_ease-out] pointer-events-none" />
      )}

      <style>{`@keyframes flash { from { opacity: 1; } to { opacity: 0; } }`}</style>
    </div>
  );
}
