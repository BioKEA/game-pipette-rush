import { useEffect, useState } from "react";
import { SITES, type SiteDef } from "@/types/sites";
import { play } from "@/lib/audio";

interface Props {
  highestWave: number;
  currentSiteId: string | null;
  onPick: (id: string) => void;
  countdownSec?: number;
}

export function SiteMap({ highestWave, currentSiteId, onPick, countdownSec = 4 }: Props) {
  const [hovered, setHovered] = useState<string | null>(currentSiteId);
  const [countdown, setCountdown] = useState(countdownSec);

  useEffect(() => {
    if (countdown <= 0) {
      onPick(currentSiteId ?? SITES[0].id);
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, currentSiteId, onPick]);

  function handlePick(site: SiteDef) {
    if (site.unlockedAfterWave > highestWave) return;
    play("click");
    onPick(site.id);
  }

  const detail = SITES.find((s) => s.id === (hovered ?? currentSiteId)) ?? SITES[0];

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex flex-col items-center justify-center p-4">
      <p className="text-[10px] uppercase tracking-[0.4em] text-cyan-400/70 mb-1">
        Field collection
      </p>
      <p className="text-2xl font-light mb-1">Choose a site</p>
      <p className="text-xs text-white/40 font-mono mb-4">{countdown}s</p>

      <div className="relative w-full max-w-2xl bg-[#070a13] border border-white/10 rounded-lg overflow-hidden mb-4" style={{ aspectRatio: "16/9" }}>
        {/* Bay outline */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 56" preserveAspectRatio="none">
          <defs>
            <pattern id="dots" patternUnits="userSpaceOnUse" width="3" height="3">
              <circle cx="1.5" cy="1.5" r="0.3" fill="rgba(255,255,255,0.05)" />
            </pattern>
          </defs>
          <rect width="100" height="56" fill="url(#dots)" />
          <path
            d="M 0 30 Q 25 20, 40 35 Q 55 50, 75 40 Q 92 30, 100 25"
            stroke="rgba(34,211,238,0.25)"
            strokeWidth="0.5"
            fill="rgba(34,211,238,0.04)"
          />
          <path
            d="M 0 38 Q 25 28, 40 42 Q 55 56, 75 48"
            stroke="rgba(34,211,238,0.12)"
            strokeWidth="0.3"
            fill="none"
          />
        </svg>

        {SITES.map((site) => {
          const unlocked = highestWave >= site.unlockedAfterWave;
          const isCurrent = site.id === currentSiteId;
          const isHovered = site.id === hovered;
          const left = `${site.position.x * 100}%`;
          const top = `${site.position.y * 100}%`;
          return (
            <button
              key={site.id}
              onClick={() => handlePick(site)}
              onMouseEnter={() => setHovered(site.id)}
              onMouseLeave={() => setHovered(currentSiteId)}
              disabled={!unlocked}
              className={`absolute -translate-x-1/2 -translate-y-1/2 group ${
                !unlocked ? "cursor-not-allowed" : "cursor-pointer"
              }`}
              style={{ left, top }}
            >
              <div
                className={`relative h-4 w-4 rounded-full transition-all ${
                  isCurrent ? "scale-125" : isHovered ? "scale-110" : ""
                } ${unlocked ? "" : "opacity-30"}`}
                style={{
                  background: unlocked ? site.color : "#475569",
                  boxShadow: unlocked
                    ? `0 0 ${isHovered || isCurrent ? 24 : 12}px ${site.glow}`
                    : "none",
                }}
              >
                {isCurrent && (
                  <div
                    className="absolute inset-0 rounded-full border-2 animate-ping"
                    style={{ borderColor: site.color }}
                  />
                )}
              </div>
              <div
                className="absolute top-full left-1/2 -translate-x-1/2 mt-1 whitespace-nowrap text-[10px] font-mono uppercase tracking-widest"
                style={{
                  color: unlocked ? site.color : "rgba(255,255,255,0.3)",
                }}
              >
                {site.short}
                {!unlocked && (
                  <span className="ml-1 text-white/30">
                    🔒w{site.unlockedAfterWave + 1}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div
        className="bg-white/[0.03] border rounded-lg p-3 max-w-md w-full"
        style={{ borderColor: `${detail.color}40` }}
      >
        <div className="flex items-baseline justify-between">
          <p className="text-[10px] uppercase tracking-widest" style={{ color: detail.color }}>
            {detail.short}
          </p>
          <p className="text-[10px] font-mono text-white/40">
            difficulty ×{(2 - detail.difficulty).toFixed(2)}
          </p>
        </div>
        <p className="text-base font-light">{detail.name}</p>
        <p className="text-xs text-white/60 mt-1">{detail.blurb}</p>
      </div>
    </div>
  );
}
