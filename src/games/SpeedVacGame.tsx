import { useEffect, useRef, useState } from "react";
import type { MicroGameProps } from "./types";
import { play } from "@/lib/audio";

const TARGETS = [0.65, 0.25];

export function SpeedVacGame({ duration, onSuccess, onFail }: MicroGameProps) {
  const completedRef = useRef(false);
  const [volume, setVolume] = useState(1.0);
  const [running, setRunning] = useState(true);
  const [stops, setStops] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<"hit" | "miss" | null>(null);
  const tolerance = 0.06;
  // Drop rate sized so the full run fits inside the wave duration with a reaction buffer
  const totalDrop = 1 - TARGETS[TARGETS.length - 1];
  const pauseTime = 350 * (TARGETS.length - 1);
  const reactionBuffer = 800;
  const dropRate = totalDrop / Math.max(1200, duration - pauseTime - reactionBuffer);

  // Volume drops while running
  useEffect(() => {
    if (!running || completedRef.current) return;
    let raf = 0;
    let last = performance.now();
    function tick(t: number) {
      const dt = t - last;
      last = t;
      setVolume((v) => Math.max(0, v - dt * dropRate));
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onFail();
      }
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onFail]);

  function stopVac() {
    if (completedRef.current || !running) return;
    const target = TARGETS[stops.length];
    if (!target) return;
    const diff = Math.abs(volume - target);
    if (diff <= tolerance) {
      setFeedback("hit");
      play("hit");
      const next = [...stops, volume];
      setStops(next);
      setRunning(false);
      setTimeout(() => setFeedback(null), 250);
      if (next.length >= TARGETS.length) {
        completedRef.current = true;
        setTimeout(() => onSuccess(), 350);
      } else {
        setTimeout(() => setRunning(true), 350);
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
        stopVac();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Auto-fail if volume below current target
  useEffect(() => {
    if (completedRef.current || !running) return;
    const target = TARGETS[stops.length];
    if (target && volume < target - tolerance - 0.02) {
      setFeedback("miss");
      play("miss");
      completedRef.current = true;
      setTimeout(() => onFail(), 400);
    }
  }, [volume, running, stops.length, onFail]);

  const currentTarget = TARGETS[stops.length];

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-6 select-none touch-none"
      onPointerDown={stopVac}
    >
      <div className="absolute top-3 left-0 right-0 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-teal-400/70">
          Savant SpeedVac
        </p>
        <p className="text-sm text-white/80 mt-1">
          Tap STOP at each marker
        </p>
      </div>

      {/* Vertical tube */}
      <div className="relative h-72 w-20 border-2 border-teal-400/40 rounded-b-lg bg-white/[0.02] overflow-hidden">
        {/* Volume fill */}
        <div
          className="absolute left-0 right-0 bottom-0"
          style={{
            height: `${volume * 100}%`,
            background: "linear-gradient(to top, #2dd4bf, rgba(45,212,191,0.5))",
            boxShadow: "inset 0 4px 16px rgba(255,255,255,0.3)",
          }}
        />
        {/* Target markers */}
        {TARGETS.map((target, i) => {
          const reached = i < stops.length;
          const current = i === stops.length;
          return (
            <div
              key={i}
              className="absolute left-0 right-0"
              style={{ bottom: `${target * 100}%` }}
            >
              <div
                className="h-0.5 w-full"
                style={{
                  background: reached ? "#a3e635" : current ? "#fde047" : "rgba(255,255,255,0.3)",
                  boxShadow: current ? "0 0 8px #fde047" : undefined,
                }}
              />
              <div
                className="absolute right-full mr-2 -translate-y-1/2 text-[10px] font-mono uppercase tracking-widest"
                style={{
                  color: reached ? "#a3e635" : current ? "#fde047" : "rgba(255,255,255,0.4)",
                  whiteSpace: "nowrap",
                }}
              >
                {reached ? "✓" : current ? "→" : "·"} {Math.round(target * 100)}μl
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-4 text-[10px] font-mono text-white/40 uppercase tracking-widest">
        click or space · {stops.length}/{TARGETS.length}
      </p>
      {currentTarget && (
        <p className="text-[10px] font-mono text-teal-400 mt-1">
          target: {Math.round(currentTarget * 100)}μl · current: {Math.round(volume * 100)}μl
        </p>
      )}

      {feedback === "hit" && (
        <div className="absolute inset-0 bg-teal-400/15 animate-[flash_0.25s_ease-out] pointer-events-none" />
      )}
      {feedback === "miss" && (
        <div className="absolute inset-0 bg-rose-400/15 animate-[flash_0.25s_ease-out] pointer-events-none" />
      )}

      <style>{`@keyframes flash { from { opacity: 1; } to { opacity: 0; } }`}</style>
    </div>
  );
}
