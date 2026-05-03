import { useEffect, useRef, useState } from "react";
import type { MicroGameProps } from "./types";
import { play } from "@/lib/audio";

type DrawMode = "preview" | "answer";

interface Specimen {
  name: string;
  draw: (
    highlightedFeature: string | null,
    correctFeature: string,
    mode: DrawMode
  ) => JSX.Element;
  features: { id: string; label: string }[];
}

function highlightStyle(mode: DrawMode, isCorrect: boolean) {
  if (mode === "preview") {
    return { fill: "rgba(255,255,255,0.18)", stroke: "rgba(255,255,255,0.6)" };
  }
  return isCorrect
    ? { fill: "rgba(52,211,153,0.25)", stroke: "#34d399" }
    : { fill: "rgba(253,164,175,0.25)", stroke: "#fb7185" };
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SPECIMENS: Specimen[] = [
  {
    name: "Daphnia magna",
    features: [
      { id: "antenna", label: "Antenna" },
      { id: "carapace", label: "Carapace shape" },
      { id: "eye", label: "Compound eye" },
    ],
    draw: (hl, correct, mode) => {
      const s = hl ? highlightStyle(mode, hl === correct) : null;
      const att = (id: string) => (correct === id ? 0.4 : 0.06);
      return (
      <svg viewBox="0 0 200 160" className="w-full h-full">
        {/* Body */}
        <ellipse cx="100" cy="85" rx="50" ry="38" fill="rgba(34,211,238,0.15)" stroke="rgba(34,211,238,0.6)" strokeWidth="1.2" />
        {/* Eye */}
        <circle cx="78" cy="72" r="6" fill="#0a0e1a" stroke="rgba(34,211,238,0.8)" strokeWidth="1" />
        {/* Antenna */}
        <path d="M 60 60 Q 30 30, 20 50" stroke="rgba(34,211,238,0.7)" strokeWidth="1.5" fill="none" />
        <path d="M 60 60 Q 35 40, 28 60" stroke="rgba(34,211,238,0.7)" strokeWidth="1.2" fill="none" />
        {/* Tail */}
        <path d="M 145 95 L 165 105" stroke="rgba(34,211,238,0.6)" strokeWidth="1.2" />
        {/* Attention overlay — biased toward correct feature */}
        <circle cx="35" cy="45" r="16" fill={`rgba(252,211,77,${att("antenna")})`} />
        <ellipse cx="100" cy="90" rx="48" ry="34" fill={`rgba(252,211,77,${att("carapace")})`} />
        <circle cx="78" cy="72" r="11" fill={`rgba(252,211,77,${att("eye")})`} />
        {/* Hover/answer highlight overlay */}
        {hl === "carapace" && s && <ellipse cx="100" cy="85" rx="55" ry="42" fill={s.fill} stroke={s.stroke} strokeWidth="1.5" />}
        {hl === "antenna" && s && <circle cx="35" cy="45" r="22" fill={s.fill} stroke={s.stroke} strokeWidth="1.5" />}
        {hl === "eye" && s && <circle cx="78" cy="72" r="14" fill={s.fill} stroke={s.stroke} strokeWidth="1.5" />}
      </svg>
      );
    },
  },
  {
    name: "Asterionella formosa",
    features: [
      { id: "starshape", label: "Star arrangement" },
      { id: "spine", label: "Cell spine" },
      { id: "valve", label: "Valve face" },
    ],
    draw: (hl, correct, mode) => {
      const s = hl ? highlightStyle(mode, hl === correct) : null;
      const att = (id: string) => (correct === id ? 0.32 : 0.05);
      return (
      <svg viewBox="0 0 200 160" className="w-full h-full">
        {/* Star of cells */}
        {[0, 60, 120, 180, 240, 300].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          const x = 100 + Math.cos(rad) * 35;
          const y = 80 + Math.sin(rad) * 35;
          return (
            <g key={angle}>
              <line x1="100" y1="80" x2={x} y2={y} stroke="rgba(52,211,153,0.7)" strokeWidth="1.2" />
              <ellipse cx={x} cy={y} rx="14" ry="3.5" fill="rgba(52,211,153,0.2)" stroke="rgba(52,211,153,0.7)" strokeWidth="1" transform={`rotate(${angle} ${x} ${y})`} />
            </g>
          );
        })}
        <circle cx="100" cy="80" r="4" fill="rgba(52,211,153,0.6)" />
        {/* Attention overlay */}
        <circle cx="100" cy="80" r="48" fill={`rgba(252,211,77,${att("starshape")})`} />
        <ellipse cx="135" cy="80" rx="22" ry="8" fill={`rgba(252,211,77,${att("spine")})`} />
        <circle cx="100" cy="80" r="16" fill={`rgba(252,211,77,${att("valve")})`} />
        {hl === "starshape" && s && <circle cx="100" cy="80" r="48" fill={s.fill} stroke={s.stroke} strokeWidth="1.5" />}
        {hl === "spine" && s && <ellipse cx="135" cy="80" rx="22" ry="8" fill={s.fill} stroke={s.stroke} strokeWidth="1.5" />}
        {hl === "valve" && s && <circle cx="100" cy="80" r="14" fill={s.fill} stroke={s.stroke} strokeWidth="1.5" />}
      </svg>
      );
    },
  },
  {
    name: "Oncorhynchus mykiss",
    features: [
      { id: "spots", label: "Spot pattern" },
      { id: "fin", label: "Adipose fin" },
      { id: "gill", label: "Gill plate" },
    ],
    draw: (hl, correct, mode) => {
      const s = hl ? highlightStyle(mode, hl === correct) : null;
      const att = (id: string) => (correct === id ? 0.36 : 0.05);
      return (
      <svg viewBox="0 0 200 160" className="w-full h-full">
        {/* Fish body */}
        <path d="M 30 80 Q 60 50, 130 60 L 165 70 L 180 50 L 175 80 L 180 110 L 165 90 L 130 100 Q 60 110, 30 80 Z" fill="rgba(167,139,250,0.15)" stroke="rgba(167,139,250,0.7)" strokeWidth="1.2" />
        {/* Eye */}
        <circle cx="50" cy="78" r="3" fill="#0a0e1a" stroke="rgba(167,139,250,0.8)" strokeWidth="0.8" />
        {/* Spots */}
        {[
          [70, 70], [90, 65], [110, 68], [85, 80], [105, 82], [125, 73],
        ].map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="2" fill="rgba(167,139,250,0.6)" />
        ))}
        {/* Adipose fin */}
        <path d="M 130 60 Q 140 50, 145 60" fill="rgba(167,139,250,0.3)" stroke="rgba(167,139,250,0.7)" strokeWidth="0.8" />
        {/* Gill */}
        <path d="M 60 65 Q 60 80, 60 95" stroke="rgba(167,139,250,0.5)" strokeWidth="1" fill="none" />
        {/* Attention overlay */}
        <ellipse cx="98" cy="74" rx="30" ry="13" fill={`rgba(252,211,77,${att("spots")})`} />
        <circle cx="138" cy="58" r="12" fill={`rgba(252,211,77,${att("fin")})`} />
        <ellipse cx="60" cy="80" rx="8" ry="16" fill={`rgba(252,211,77,${att("gill")})`} />
        {hl === "spots" && s && <ellipse cx="98" cy="74" rx="32" ry="14" fill={s.fill} stroke={s.stroke} strokeWidth="1.5" />}
        {hl === "fin" && s && <circle cx="138" cy="58" r="14" fill={s.fill} stroke={s.stroke} strokeWidth="1.5" />}
        {hl === "gill" && s && <ellipse cx="60" cy="80" rx="10" ry="18" fill={s.fill} stroke={s.stroke} strokeWidth="1.5" />}
      </svg>
      );
    },
  },
];

export function DiversityScannerGame({ duration, seed, onSuccess, onFail }: MicroGameProps) {
  const completedRef = useRef(false);
  const round = useRef<{
    specimen: Specimen;
    correctFeature: { id: string; label: string };
    confidence: string;
  } | null>(null);
  if (round.current === null) {
    const rng = mulberry32(seed);
    const specimen = SPECIMENS[Math.floor(rng() * SPECIMENS.length)];
    const correctFeature = specimen.features[Math.floor(rng() * specimen.features.length)];
    const confidence = (0.7 + rng() * 0.25).toFixed(2);
    round.current = { specimen, correctFeature, confidence };
  }
  const { specimen, correctFeature, confidence } = round.current;
  const [picked, setPicked] = useState<string | null>(null);
  const [hovering, setHovering] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onFail();
      }
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onFail]);

  function pick(featureId: string) {
    if (completedRef.current) return;
    setPicked(featureId);
    completedRef.current = true;
    if (featureId === correctFeature.id) play("hit");
    else play("miss");
    setTimeout(() => {
      if (featureId === correctFeature.id) onSuccess();
      else onFail();
    }, 600);
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center px-6 py-3">
      <p className="text-[10px] uppercase tracking-[0.3em] text-rose-300/70">
        DiversityScanner
      </p>
      <p className="text-sm text-white/80 mt-1">
        Identify the diagnostic feature
      </p>

      <div className="w-full max-w-sm mt-4">
        <div className="relative bg-black/40 border border-white/10 rounded-md aspect-square overflow-hidden">
          {specimen.draw(
            picked ?? hovering,
            correctFeature.id,
            picked ? "answer" : "preview"
          )}
          <p className="absolute top-2 left-2 text-[9px] font-mono text-white/40">
            specimen · {specimen.name.toLowerCase()}
          </p>
          <p className="absolute bottom-2 right-2 text-[9px] font-mono text-white/40">
            attention overlay · conf {confidence}
          </p>
          {!picked && !hovering && (
            <p className="absolute top-2 right-2 text-[9px] font-mono text-white/40">
              hover · preview region
            </p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 w-full max-w-sm mt-4">
        {specimen.features.map((f) => {
          const isPicked = picked === f.id;
          const isCorrect = f.id === correctFeature.id;
          const showCorrect = picked && isCorrect;
          const showWrong = isPicked && !isCorrect;
          return (
            <button
              key={f.id}
              onClick={() => pick(f.id)}
              onPointerEnter={() => !picked && setHovering(f.id)}
              onPointerLeave={() => setHovering((h) => (h === f.id ? null : h))}
              disabled={!!picked}
              className={`py-3 px-2 rounded text-[11px] font-mono uppercase tracking-wider border transition-colors ${
                showCorrect
                  ? "bg-emerald-400/20 border-emerald-400 text-emerald-400"
                  : showWrong
                  ? "bg-rose-400/20 border-rose-400 text-rose-400"
                  : hovering === f.id
                  ? "bg-rose-300/20 border-rose-300/80 text-white"
                  : "bg-rose-300/10 border-rose-300/40 text-rose-300 hover:bg-rose-300/20"
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
