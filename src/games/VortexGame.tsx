import { useEffect, useRef, useState } from "react";
import type { MicroGameProps } from "./types";

export function VortexGame({ duration, onSuccess, onFail }: MicroGameProps) {
  const completedRef = useRef(false);
  const requiredDistance = 3000; // cumulative px
  const [distance, setDistance] = useState(0);
  const [tipX, setTipX] = useState(50);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);
  const lastMoveRef = useRef(performance.now());

  useEffect(() => {
    const t = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onFail();
      }
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onFail]);

  // Decay: liquid level drops if you stop moving
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    function tick(t: number) {
      const dt = t - last;
      last = t;
      const sinceMove = t - lastMoveRef.current;
      if (sinceMove > 150) {
        setDistance((d) => Math.max(0, d - dt * 0.9));
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  function handleMove(e: React.PointerEvent) {
    if (completedRef.current) return;
    const cx = e.clientX;
    const cy = e.clientY;
    if (lastPosRef.current) {
      const dx = cx - lastPosRef.current.x;
      const dy = cy - lastPosRef.current.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d > 1) {
        setDistance((prev) => {
          const next = Math.min(requiredDistance, prev + d);
          if (next >= requiredDistance && !completedRef.current) {
            completedRef.current = true;
            setTimeout(() => onSuccess(), 200);
          }
          return next;
        });
        lastMoveRef.current = performance.now();
      }
    }
    lastPosRef.current = { x: cx, y: cy };
    // Quick wiggle on tip
    setTipX(50 + Math.sin(performance.now() / 40) * 6 + (Math.random() - 0.5) * 2);
  }

  const fillPct = (distance / requiredDistance) * 100;
  const wobble = distance > 100 ? Math.sin(performance.now() / 60) * 4 : 0;

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center px-6 select-none cursor-crosshair"
      onPointerMove={handleMove}
    >
      <div className="absolute top-3 left-0 right-0 text-center">
        <p className="text-[10px] uppercase tracking-[0.3em] text-yellow-300/70">
          Vortex-Genie 2
        </p>
        <p className="text-sm text-white/80 mt-1">
          Move the mouse rapidly in circles
        </p>
      </div>

      {/* Tube + base */}
      <div
        className="relative"
        style={{
          width: "120px",
          height: "260px",
          transform: `translate(${wobble}px, ${wobble * 0.5}px)`,
        }}
      >
        {/* Vortex base */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 h-12 w-32 bg-yellow-300/15 border-2 border-yellow-300/60 rounded-md" />
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 h-2 w-20 bg-yellow-300/40 rounded" />
        {/* Tube */}
        <div
          className="absolute left-1/2 -translate-x-1/2 bottom-14 w-12 border-2 rounded-b-full overflow-hidden"
          style={{
            height: "180px",
            borderColor: "rgba(253,224,71,0.6)",
            background: "rgba(255,255,255,0.02)",
            transform: `translate(${-50 + tipX * 0}%, 0) translateX(-50%) rotate(${(distance % 360) / 60}deg)`,
            transformOrigin: "bottom center",
          }}
        >
          {/* Liquid */}
          <div
            className="absolute left-0 right-0 bottom-0 transition-all"
            style={{
              height: `${fillPct}%`,
              background: "linear-gradient(to top, #fde047, rgba(253,224,71,0.4))",
              boxShadow: "inset 0 4px 12px rgba(255,255,255,0.4)",
            }}
          />
        </div>
      </div>

      <div className="mt-6 w-64 h-2 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-yellow-300 transition-all"
          style={{
            width: `${fillPct}%`,
            boxShadow: "0 0 8px #fde047",
          }}
        />
      </div>
      <p className="mt-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
        wiggle · {Math.round(fillPct)}%
      </p>
    </div>
  );
}
