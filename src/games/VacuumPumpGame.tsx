import { useEffect, useRef, useState } from "react";
import type { MicroGameProps } from "./types";
import { play } from "@/lib/audio";

export function VacuumPumpGame({ duration, onSuccess, onFail }: MicroGameProps) {
  const completedRef = useRef(false);
  const [pressure, setPressure] = useState(1.0); // 1.0 = atmospheric, 0 = full vacuum
  const [holdMs, setHoldMs] = useState(0);
  const targetMin = 0.1;
  const targetMax = 0.32;
  const requiredHold = 500;
  const lastTapRef = useRef(0);
  const pressureRef = useRef(1.0);
  pressureRef.current = pressure;

  // Pressure decay (rises if not tapping)
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    function tick(t: number) {
      const dt = t - last;
      last = t;
      const idle = t - lastTapRef.current;
      if (idle > 100) {
        setPressure((p) => Math.min(1, p + dt * 0.00035));
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // In-zone hold timer
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    function tick(t: number) {
      const dt = t - last;
      last = t;
      const p = pressureRef.current;
      if (p >= targetMin && p <= targetMax) {
        setHoldMs((h) => Math.min(requiredHold, h + dt));
      } else {
        setHoldMs((h) => Math.max(0, h - dt * 1.2));
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    if (holdMs >= requiredHold && !completedRef.current) {
      completedRef.current = true;
      setTimeout(() => onSuccess(), 200);
    }
  }, [holdMs, onSuccess]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onFail();
      }
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onFail]);

  function pump() {
    if (completedRef.current) return;
    lastTapRef.current = performance.now();
    setPressure((p) => Math.max(0, p - 0.045));
    play("click");
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space" || e.code === "Enter") {
        e.preventDefault();
        pump();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Needle angle: 0 (pressure=1) at -90deg, full vacuum at +90deg
  const needleAngle = (1 - pressure) * 180 - 90;
  const inZone = pressure >= targetMin && pressure <= targetMax;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-6 select-none touch-none"
      onPointerDown={pump}
    >
      <div className="absolute top-3 left-0 right-0 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-sky-400/70">
          Gast DOA-P704-AA
        </p>
        <p className="text-sm text-white/80 mt-1">Mash to drop pressure</p>
      </div>

      <div className="relative w-72 h-40 mb-6">
        <svg viewBox="0 0 200 110" className="w-full h-full">
          <path
            d="M 20 100 A 80 80 0 0 1 180 100"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth="2"
            fill="none"
          />
          {/* Green zone */}
          <path
            d={describeArc(100, 100, 80, 90 - targetMax * 180, 90 - targetMin * 180)}
            stroke="#38bdf8"
            strokeWidth="14"
            fill="none"
            opacity="0.7"
          />
          {/* Tick marks */}
          {[0, 0.25, 0.5, 0.75, 1].map((p) => {
            const a = ((1 - p) * 180 - 90) * Math.PI / 180;
            const x1 = 100 + Math.sin(a) * 70;
            const y1 = 100 - Math.cos(a) * 70;
            const x2 = 100 + Math.sin(a) * 80;
            const y2 = 100 - Math.cos(a) * 80;
            return <line key={p} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.4)" strokeWidth="1" />;
          })}
          {/* Needle */}
          <line
            x1="100"
            y1="100"
            x2={100 + Math.sin(needleAngle * Math.PI / 180) * 65}
            y2={100 - Math.cos(needleAngle * Math.PI / 180) * 65}
            stroke={inZone ? "#38bdf8" : "#fff"}
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ filter: inZone ? "drop-shadow(0 0 8px #38bdf8)" : undefined }}
          />
          <circle cx="100" cy="100" r="4" fill="#fff" />
          {/* Labels */}
          <text x="20" y="108" fill="rgba(255,255,255,0.5)" fontSize="6" textAnchor="middle">1 atm</text>
          <text x="180" y="108" fill="rgba(255,255,255,0.5)" fontSize="6" textAnchor="middle">vacuum</text>
        </svg>
      </div>

      <div className="w-64 h-2 bg-white/10 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-sky-400 transition-all"
          style={{ width: `${(holdMs / requiredHold) * 100}%`, boxShadow: "0 0 8px #38bdf8" }}
        />
      </div>
      <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest">
        click or space · hold {Math.round(holdMs)}ms / {requiredHold}
      </p>
    </div>
  );
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const startRad = (startDeg - 90) * Math.PI / 180;
  const endRad = (endDeg - 90) * Math.PI / 180;
  const x1 = cx + r * Math.cos(startRad);
  const y1 = cy + r * Math.sin(startRad);
  const x2 = cx + r * Math.cos(endRad);
  const y2 = cy + r * Math.sin(endRad);
  const large = endDeg - startDeg <= 180 ? 0 : 1;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}
