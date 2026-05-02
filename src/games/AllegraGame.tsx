import { useEffect, useRef, useState } from "react";
import type { MicroGameProps } from "./types";
import { play } from "@/lib/audio";

const SLOTS = 8;
const TUBE_COUNT = 4;
const TUBE_MASSES = [3, 3, 5, 5];

interface Placement {
  tubeIdx: number;
  slot: number;
}

export function AllegraGame({ duration, onSuccess, onFail }: MicroGameProps) {
  const completedRef = useRef(false);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [dragging, setDragging] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<"good" | "bad" | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onFail();
      }
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onFail]);

  function placeAtSlot(tubeIdx: number, slot: number) {
    if (completedRef.current) return;
    setPlacements((prev) => {
      const without = prev.filter((p) => p.tubeIdx !== tubeIdx && p.slot !== slot);
      return [...without, { tubeIdx, slot }];
    });
    play("click");
  }

  function unplace(tubeIdx: number) {
    setPlacements((prev) => prev.filter((p) => p.tubeIdx !== tubeIdx));
  }

  function checkBalance() {
    if (completedRef.current) return;
    if (placements.length < TUBE_COUNT) {
      setFeedback("bad");
      play("miss");
      setTimeout(() => setFeedback(null), 600);
      return;
    }
    let sumX = 0;
    let sumY = 0;
    for (const p of placements) {
      const angle = (p.slot / SLOTS) * Math.PI * 2;
      const m = TUBE_MASSES[p.tubeIdx];
      sumX += Math.cos(angle) * m;
      sumY += Math.sin(angle) * m;
    }
    const imbalance = Math.sqrt(sumX * sumX + sumY * sumY);
    if (imbalance < 0.6) {
      completedRef.current = true;
      setFeedback("good");
      play("hit");
      setTimeout(() => onSuccess(), 600);
    } else {
      setFeedback("bad");
      play("miss");
      setTimeout(() => setFeedback(null), 600);
    }
  }

  const placedTubes = new Set(placements.map((p) => p.tubeIdx));
  const slotMap = new Map(placements.map((p) => [p.slot, p.tubeIdx]));

  return (
    <div className="absolute inset-0 flex flex-col items-center px-6 select-none">
      <div className="text-center mt-2 mb-3">
        <p className="text-[10px] uppercase tracking-[0.3em] text-lime-400/70">
          Beckman Allegra 6R
        </p>
        <p className="text-sm text-white/80 mt-1">
          Place tubes so the rotor is balanced
        </p>
      </div>

      {/* Rotor disc */}
      <div className="relative" style={{ width: "260px", height: "260px" }}>
        <svg viewBox="-130 -130 260 260" className="w-full h-full">
          <circle cx="0" cy="0" r="115" fill="rgba(163,230,53,0.04)" stroke="rgba(163,230,53,0.3)" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="40" fill="none" stroke="rgba(163,230,53,0.2)" strokeWidth="1" />
          {Array.from({ length: SLOTS }).map((_, i) => {
            const a = (i / SLOTS) * Math.PI * 2 - Math.PI / 2;
            const x = Math.cos(a) * 80;
            const y = Math.sin(a) * 80;
            const occupied = slotMap.get(i);
            const tubeMass = occupied !== undefined ? TUBE_MASSES[occupied] : 0;
            return (
              <g key={i}>
                <circle
                  cx={x}
                  cy={y}
                  r="22"
                  fill={occupied !== undefined ? "rgba(163,230,53,0.18)" : "rgba(163,230,53,0.05)"}
                  stroke="rgba(163,230,53,0.5)"
                  strokeWidth="1.5"
                  className="cursor-pointer"
                  onClick={() => {
                    if (dragging !== null) {
                      placeAtSlot(dragging, i);
                      setDragging(null);
                    } else if (occupied !== undefined) {
                      unplace(occupied);
                    }
                  }}
                />
                {occupied !== undefined && (
                  <>
                    <rect
                      x={x - 5}
                      y={y - 14}
                      width="10"
                      height="22"
                      rx="3"
                      fill="#a3e635"
                      stroke="#365314"
                      strokeWidth="0.5"
                    />
                    <text
                      x={x}
                      y={y + 4}
                      fontSize="10"
                      textAnchor="middle"
                      fill="#0a0e1a"
                      fontWeight="bold"
                    >
                      {tubeMass}
                    </text>
                  </>
                )}
                {dragging !== null && occupied === undefined && (
                  <circle cx={x} cy={y} r="22" fill="rgba(163,230,53,0.1)" stroke="#a3e635" strokeWidth="2" strokeDasharray="3 3" />
                )}
              </g>
            );
          })}
          <text x="0" y="4" fill="rgba(163,230,53,0.5)" fontSize="8" textAnchor="middle">ROTOR</text>
        </svg>
      </div>

      {/* Tube tray */}
      <div className="mt-4 flex gap-3 items-center">
        <p className="text-[10px] uppercase tracking-widest text-white/40">tubes</p>
        {TUBE_MASSES.map((m, i) => {
          const placed = placedTubes.has(i);
          const isDragging = dragging === i;
          return (
            <button
              key={i}
              disabled={placed}
              onClick={() => {
                if (placed) return;
                setDragging(isDragging ? null : i);
                play("click");
              }}
              className={`relative h-12 w-7 rounded transition-all ${
                placed
                  ? "opacity-20"
                  : isDragging
                  ? "scale-110"
                  : "hover:scale-105"
              }`}
              style={{
                background: "#a3e635",
                border: isDragging ? "2px solid #fff" : "2px solid #365314",
                boxShadow: isDragging ? "0 0 16px rgba(163,230,53,0.9)" : undefined,
              }}
            >
              <span className="text-[#0a0e1a] font-bold text-xs">{m}</span>
            </button>
          );
        })}
      </div>

      <button
        onClick={checkBalance}
        disabled={placements.length < TUBE_COUNT}
        className={`mt-4 px-8 py-2.5 rounded text-xs uppercase tracking-[0.3em] font-bold transition-all ${
          placements.length >= TUBE_COUNT
            ? "bg-lime-400 text-[#0a0e1a] hover:bg-lime-300 shadow-[0_0_24px_rgba(163,230,53,0.5)]"
            : "bg-white/5 text-white/30 cursor-not-allowed"
        }`}
      >
        Spin
      </button>

      {feedback === "bad" && (
        <p className="mt-2 text-[10px] uppercase tracking-widest text-rose-400 animate-pulse">
          ✕ rotor imbalanced
        </p>
      )}
      {feedback === "good" && (
        <p className="mt-2 text-[10px] uppercase tracking-widest text-lime-400">
          ✓ balanced
        </p>
      )}
    </div>
  );
}
