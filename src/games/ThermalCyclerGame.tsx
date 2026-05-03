import { useEffect, useRef, useState } from "react";
import type { MicroGameProps } from "./types";
import { play } from "@/lib/audio";

type Lane = "D" | "A" | "E";
const LANES: { id: Lane; label: string; temp: string; color: string; hex: string }[] = [
  { id: "D", label: "Denature", temp: "95°", color: "rose", hex: "#fb7185" },
  { id: "A", label: "Anneal", temp: "58°", color: "cyan", hex: "#22d3ee" },
  { id: "E", label: "Extend", temp: "72°", color: "amber", hex: "#fcd34d" },
];

interface Note {
  id: number;
  lane: Lane;
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

export function ThermalCyclerGame({ duration, seed, onSuccess, onFail }: MicroGameProps) {
  const requiredHits = 4;
  const totalNotes = 6;
  const fallTime = Math.min(2200, duration * 0.55);
  const completedRef = useRef(false);
  const startedAtRef = useRef(performance.now());
  const [notes, setNotes] = useState<Note[]>(() => {
    const rng = mulberry32(seed);
    const spread = duration - fallTime - 600;
    return Array.from({ length: totalNotes }, (_, i) => {
      const lane = LANES[Math.floor(rng() * LANES.length)].id;
      const offset = 200 + (i * spread) / totalNotes;
      return { id: i, lane, spawnedAt: offset, hit: "pending" as const };
    });
  });
  const [now, setNow] = useState(0);
  const hits = notes.filter((n) => n.hit === "good").length;

  useEffect(() => {
    let raf = 0;
    function tick() {
      setNow(performance.now() - startedAtRef.current);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    setNotes((prev) => {
      let changed = false;
      const next = prev.map((n) => {
        if (n.hit !== "pending") return n;
        const arrival = n.spawnedAt + fallTime;
        if (now > arrival + 250) {
          changed = true;
          return { ...n, hit: "miss" as const };
        }
        return n;
      });
      return changed ? next : prev;
    });
  }, [now, fallTime]);

  const hitsRef = useRef(hits);
  useEffect(() => {
    hitsRef.current = hits;
  });
  const scheduledRef = useRef(false);

  useEffect(() => {
    if (scheduledRef.current || completedRef.current) return;
    const allDone = notes.every((n) => n.hit !== "pending");
    if (!allDone) return;
    scheduledRef.current = true;
    const win = hits >= requiredHits;
    setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      if (win) onSuccess();
      else onFail();
    }, 200);
  }, [hits, notes, onSuccess, onFail]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      if (hitsRef.current >= requiredHits) onSuccess();
      else onFail();
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onSuccess, onFail]);

  function tryHit(lane: Lane) {
    if (completedRef.current) return;
    setNotes((prev) => {
      let bestIdx = -1;
      let bestDist = Infinity;
      prev.forEach((n, i) => {
        if (n.hit !== "pending" || n.lane !== lane) return;
        const arrival = n.spawnedAt + fallTime;
        const dist = Math.abs(now - arrival);
        if (dist < 220 && dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      });
      if (bestIdx === -1) {
        play("miss");
        return prev;
      }
      play("hit");
      return prev.map((n, i) => (i === bestIdx ? { ...n, hit: "good" } : n));
    });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "1" || e.key.toLowerCase() === "d") tryHit("D");
      if (e.key === "2" || e.key.toLowerCase() === "a") tryHit("A");
      if (e.key === "3" || e.key.toLowerCase() === "e") tryHit("E");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="absolute inset-0 flex flex-col">
      <div className="text-center pt-2 pb-3">
        <p className="text-[10px] uppercase tracking-[0.3em] text-orange-400/70">
          Bio-Rad S1000
        </p>
        <p className="text-sm text-white/80 mt-1">
          Hit each temperature note as it lands
        </p>
      </div>

      <div className="flex-1 flex justify-center px-4 pb-32">
        <div className="relative w-full max-w-sm h-full">
          <div className="absolute inset-0 grid grid-cols-3 gap-2">
            {LANES.map((lane) => (
              <div
                key={lane.id}
                className="relative bg-white/[0.02] border-x border-white/5 overflow-hidden rounded"
              >
                <div className="absolute top-2 left-0 right-0 text-center">
                  <p
                    className="text-[10px] font-mono"
                    style={{ color: lane.hex }}
                  >
                    {lane.temp}
                  </p>
                  <p className="text-[8px] uppercase tracking-widest text-white/40">
                    {lane.label}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Hit line */}
          <div
            className="absolute left-0 right-0 pointer-events-none"
            style={{ bottom: "12%" }}
          >
            <div className="h-0.5 w-full bg-white/70 shadow-[0_0_12px_rgba(255,255,255,0.5)]" />
            <div className="absolute inset-x-0 h-16 -translate-y-16 bg-gradient-to-t from-white/15 to-transparent" />
          </div>

          {/* Notes */}
          {notes.map((n) => {
            const elapsed = now - n.spawnedAt;
            if (elapsed < 0) return null;
            const arrival = fallTime;
            const progress = elapsed / arrival;
            if (progress > 1.2) return null;
            const laneIdx = LANES.findIndex((l) => l.id === n.lane);
            const lane = LANES[laneIdx];
            const topPct = progress * 88;
            const opacity = n.hit === "miss" ? 0.2 : n.hit === "good" ? 0 : 1;
            return (
              <div
                key={n.id}
                className="absolute h-7 rounded transition-opacity"
                style={{
                  left: `${(laneIdx / 3) * 100 + 4}%`,
                  width: `${100 / 3 - 8}%`,
                  top: `${topPct}%`,
                  background: lane.hex,
                  boxShadow: `0 0 18px ${lane.hex}`,
                  opacity,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Lane buttons */}
      <div className="absolute bottom-12 left-0 right-0 px-4">
        <div className="grid grid-cols-3 gap-2 max-w-sm mx-auto">
          {LANES.map((lane) => (
            <button
              key={lane.id}
              onPointerDown={() => tryHit(lane.id)}
              className="py-4 rounded font-mono font-bold text-lg transition-all active:scale-95"
              style={{
                backgroundColor: lane.hex + "20",
                border: `2px solid ${lane.hex}`,
                color: lane.hex,
                boxShadow: `0 0 16px ${lane.hex}30`,
              }}
            >
              {lane.id}
            </button>
          ))}
        </div>
      </div>

      <div className="absolute bottom-2 left-0 right-0 text-center">
        <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
          {hits}/{requiredHits} cycles
        </p>
      </div>
    </div>
  );
}
