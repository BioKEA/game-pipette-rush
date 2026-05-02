import { useEffect, useRef, useState } from "react";
import type { MicroGameProps } from "./types";
import { play } from "@/lib/audio";

export function MiniCentrifugeGame({ duration, onSuccess, onFail }: MicroGameProps) {
  const completedRef = useRef(false);
  const targetMs = 2400;
  const tolerance = 450;
  const [pressed, setPressed] = useState(false);
  const [holdMs, setHoldMs] = useState(0);
  const [released, setReleased] = useState<number | null>(null);
  const chimedRef = useRef(false);

  const pressedRef = useRef(false);
  pressedRef.current = pressed;

  // Chime when target window opens
  useEffect(() => {
    if (!chimedRef.current && holdMs >= targetMs - tolerance && holdMs <= targetMs + tolerance) {
      chimedRef.current = true;
      play("hit");
    }
  }, [holdMs]);

  // Tick hold time
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    function tick(t: number) {
      const dt = t - last;
      last = t;
      if (pressedRef.current && !completedRef.current) {
        setHoldMs((h) => h + dt);
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onFail();
      }
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onFail]);

  function press() {
    if (completedRef.current) return;
    if (released !== null) return;
    setPressed(true);
    play("click");
  }

  function release() {
    if (completedRef.current) return;
    if (!pressed) return;
    setPressed(false);
    setReleased(holdMs);
    const diff = Math.abs(holdMs - targetMs);
    completedRef.current = true;
    setTimeout(() => {
      if (diff <= tolerance) onSuccess();
      else onFail();
    }, 600);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space") {
        e.preventDefault();
        if (e.repeat) return;
        press();
      }
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.code === "Space") release();
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", onKeyUp);
    };
  });

  // Spin animation while pressed
  const spinSpeed = pressed ? 0.6 : 0;
  const targetReached = holdMs >= targetMs - tolerance && holdMs <= targetMs + tolerance;
  const overshoot = holdMs > targetMs + tolerance;
  const arcAngle = Math.min(holdMs / (targetMs + tolerance), 1) * 270;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-6 select-none"
      onPointerDown={press}
      onPointerUp={release}
      onPointerLeave={release}
    >
      <div className="absolute top-3 left-0 right-0 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-fuchsia-400/70">
          Corning Mini Centrifuge
        </p>
        <p className="text-sm text-white/80 mt-1">
          Hold while it spins — release at the chime
        </p>
      </div>

      <div className="relative h-56 w-56 flex items-center justify-center">
        {/* Outer ring with progress arc */}
        <svg viewBox="0 0 200 200" className="absolute inset-0">
          <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2" />
          {/* Target window */}
          {(() => {
            const startAngle = (targetMs - tolerance) / (targetMs + tolerance) * 270 - 135;
            const endAngle = 270 - 135;
            return (
              <path
                d={arcPath(100, 100, 90, startAngle, endAngle)}
                stroke="#e879f9"
                strokeWidth="10"
                fill="none"
                opacity="0.75"
                style={{ filter: "drop-shadow(0 0 8px #e879f9)" }}
              />
            );
          })()}
          {/* Progress arc */}
          {arcAngle > 0 && (
            <path
              d={arcPath(100, 100, 90, -135, -135 + arcAngle)}
              stroke={overshoot ? "#fb7185" : targetReached ? "#a3e635" : "#e879f9"}
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              style={{ filter: targetReached ? "drop-shadow(0 0 10px #a3e635)" : undefined }}
            />
          )}
        </svg>

        {/* Rotor */}
        <div
          className="relative h-32 w-32 rounded-full border-4 flex items-center justify-center"
          style={{
            borderColor: pressed ? "#e879f9" : "rgba(255,255,255,0.15)",
            background: "rgba(232,121,249,0.05)",
            boxShadow: pressed ? "0 0 30px rgba(232,121,249,0.6)" : "none",
            animation: pressed ? `rotorSpin ${0.4 / spinSpeed}s linear infinite` : "none",
          }}
        >
          <div className="h-2 w-20 bg-fuchsia-400/60 rounded-full" />
          <div className="absolute h-20 w-2 bg-fuchsia-400/60 rounded-full" />
        </div>
      </div>

      <p className="mt-4 text-[10px] font-mono text-white/40 uppercase tracking-widest">
        {released !== null
          ? `released at ${Math.round(released)}ms`
          : pressed
          ? `holding ${Math.round(holdMs)}ms`
          : "click & hold or space"}
      </p>

      <style>{`
        @keyframes rotorSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const startRad = startDeg * Math.PI / 180;
  const endRad = endDeg * Math.PI / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}
