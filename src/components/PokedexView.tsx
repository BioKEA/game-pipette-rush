import { useState } from "react";
import { SPECIES, RARITY_COLOR, RARITY_GLOW, type Species } from "@/types/species";
import { ACHIEVEMENTS } from "@/types/achievements";

interface Props {
  pokedex: Record<string, number>;
  achievements: Record<string, number>;
  onClose: () => void;
}

export function PokedexView({ pokedex, achievements, onClose }: Props) {
  const [selected, setSelected] = useState<Species | null>(null);
  const [tab, setTab] = useState<"species" | "achievements">("species");
  const discoveredCount = Object.keys(pokedex).length;
  const achievementCount = Object.keys(achievements).length;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-5 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-cyan-400/70">
              Discoveries
            </p>
            <h1 className="text-3xl font-light mt-1">Specimen Pokedex</h1>
            <p className="text-sm text-white/50 mt-1 font-mono">
              {discoveredCount} / {SPECIES.length} catalogued
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded px-4 py-2 text-xs uppercase tracking-widest"
          >
            ← Back
          </button>
        </div>

        <div className="flex gap-2 mb-5 border-b border-white/10">
          <button
            onClick={() => setTab("species")}
            className={`px-4 py-2 text-xs uppercase tracking-widest border-b-2 -mb-px transition-colors ${
              tab === "species"
                ? "border-cyan-400 text-cyan-400"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            Species · {discoveredCount}/{SPECIES.length}
          </button>
          <button
            onClick={() => setTab("achievements")}
            className={`px-4 py-2 text-xs uppercase tracking-widest border-b-2 -mb-px transition-colors ${
              tab === "achievements"
                ? "border-amber-300 text-amber-300"
                : "border-transparent text-white/50 hover:text-white"
            }`}
          >
            Achievements · {achievementCount}/{ACHIEVEMENTS.length}
          </button>
        </div>

        {tab === "achievements" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ACHIEVEMENTS.map((a) => {
              const got = a.id in achievements;
              return (
                <div
                  key={a.id}
                  className={`flex items-center gap-3 rounded-lg p-3 border ${
                    got
                      ? "bg-amber-300/10 border-amber-300/40"
                      : "bg-white/[0.02] border-white/10 opacity-50"
                  }`}
                >
                  <div
                    className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-lg font-bold ${
                      got
                        ? "bg-amber-300 text-[#0a0e1a]"
                        : "bg-white/10 text-white/30"
                    }`}
                  >
                    {got ? a.glyph : "·"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium ${
                        got ? "text-white" : "text-white/50"
                      }`}
                    >
                      {got ? a.title : "Locked"}
                    </p>
                    <p className="text-xs text-white/50 mt-0.5">{a.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === "species" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {(["legendary", "rare", "uncommon", "common"] as const).map(
              (rarity) => {
                const items = SPECIES.filter((s) => s.rarity === rarity);
                return (
                  <div key={rarity} className="mb-6">
                    <p
                      className="text-[10px] uppercase tracking-[0.3em] mb-2"
                      style={{ color: RARITY_COLOR[rarity] }}
                    >
                      {rarity}
                    </p>
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
                      {items.map((s) => {
                        const owned = pokedex[s.id] || 0;
                        const isOwned = owned > 0;
                        const isSelected = selected?.id === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() => setSelected(s)}
                            className={`relative aspect-square rounded border transition-all ${
                              isSelected
                                ? "border-white"
                                : isOwned
                                ? "border-white/20 hover:border-white/60"
                                : "border-white/5 opacity-40"
                            }`}
                            style={
                              isOwned
                                ? {
                                    background: `${s.color}25`,
                                    boxShadow: `0 0 12px ${RARITY_GLOW[s.rarity]}`,
                                  }
                                : {
                                    background: "rgba(255,255,255,0.02)",
                                  }
                            }
                          >
                            {isOwned ? (
                              <SpeciesIcon species={s} />
                            ) : (
                              <span className="text-white/30 text-2xl">?</span>
                            )}
                            {owned > 1 && (
                              <span
                                className="absolute -top-1 -right-1 text-[8px] font-mono px-1 rounded"
                                style={{
                                  background: RARITY_COLOR[s.rarity],
                                  color: "#0a0e1a",
                                }}
                              >
                                ×{owned}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              }
            )}
          </div>

          <div className="lg:sticky lg:top-8 self-start">
            {selected ? (
              <div
                className="bg-white/[0.03] border rounded-lg p-5"
                style={{
                  borderColor: pokedex[selected.id]
                    ? `${RARITY_COLOR[selected.rarity]}66`
                    : "rgba(255,255,255,0.1)",
                }}
              >
                <div
                  className="aspect-square rounded mb-4 flex items-center justify-center"
                  style={{
                    background: pokedex[selected.id]
                      ? `${selected.color}20`
                      : "rgba(255,255,255,0.02)",
                    boxShadow: pokedex[selected.id]
                      ? `inset 0 0 40px ${RARITY_GLOW[selected.rarity]}`
                      : undefined,
                  }}
                >
                  {pokedex[selected.id] ? (
                    <SpeciesIcon species={selected} large />
                  ) : (
                    <span className="text-white/20 text-7xl">?</span>
                  )}
                </div>
                <p
                  className="text-[10px] uppercase tracking-[0.3em] mb-1"
                  style={{ color: RARITY_COLOR[selected.rarity] }}
                >
                  {selected.rarity}
                </p>
                {pokedex[selected.id] ? (
                  <>
                    <h2 className="text-xl font-light">{selected.name}</h2>
                    <p className="text-sm text-white/60 italic mt-0.5">
                      {selected.latin}
                    </p>
                    <p className="text-[11px] font-mono text-white/40 mt-2 uppercase tracking-widest">
                      {selected.habitat}
                    </p>
                    <p className="text-sm text-white/70 mt-3 leading-relaxed">
                      {selected.blurb}
                    </p>
                    <p className="text-[10px] font-mono text-white/40 mt-4">
                      detected {pokedex[selected.id]}×
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-xl font-light text-white/40">
                      Undiscovered
                    </h2>
                    <p className="text-sm text-white/30 mt-3 leading-relaxed">
                      Run the pipeline to detect this organism's eDNA.
                    </p>
                  </>
                )}
              </div>
            ) : (
              <div className="bg-white/[0.03] border border-white/10 rounded-lg p-5 text-center">
                <p className="text-white/40 text-sm">
                  Select a specimen to view details.
                </p>
              </div>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

function SpeciesIcon({
  species,
  large,
}: {
  species: Species;
  large?: boolean;
}) {
  const size = large ? "100%" : "80%";
  const stroke = species.color;
  const fill = `${species.color}40`;

  let svg;
  switch (species.id) {
    case "daphnia":
      svg = (
        <>
          <ellipse cx="50" cy="55" rx="22" ry="16" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="40" cy="48" r="2.5" fill={stroke} />
          <path d="M 32 42 Q 18 28 12 38" stroke={stroke} strokeWidth="1.5" fill="none" />
          <path d="M 70 60 L 82 64" stroke={stroke} strokeWidth="1.5" />
        </>
      );
      break;
    case "asterionella":
      svg = (
        <>
          {[0, 60, 120, 180, 240, 300].map((angle) => {
            const rad = (angle * Math.PI) / 180;
            const x = 50 + Math.cos(rad) * 25;
            const y = 50 + Math.sin(rad) * 25;
            return (
              <g key={angle}>
                <line x1="50" y1="50" x2={x} y2={y} stroke={stroke} strokeWidth="1.5" />
                <ellipse cx={x} cy={y} rx="10" ry="2.5" fill={fill} stroke={stroke} strokeWidth="1" transform={`rotate(${angle} ${x} ${y})`} />
              </g>
            );
          })}
        </>
      );
      break;
    case "lemna":
      svg = (
        <>
          <ellipse cx="40" cy="40" rx="14" ry="9" fill={fill} stroke={stroke} strokeWidth="1.5" transform="rotate(-15 40 40)" />
          <ellipse cx="60" cy="55" rx="12" ry="8" fill={fill} stroke={stroke} strokeWidth="1.5" transform="rotate(20 60 55)" />
          <ellipse cx="45" cy="65" rx="10" ry="7" fill={fill} stroke={stroke} strokeWidth="1.5" />
        </>
      );
      break;
    case "bacillus":
      svg = (
        <>
          <rect x="20" y="46" width="22" height="8" rx="4" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <rect x="48" y="44" width="26" height="9" rx="4.5" fill={fill} stroke={stroke} strokeWidth="1.5" transform="rotate(15 48 44)" />
          <rect x="30" y="60" width="20" height="7" rx="3.5" fill={fill} stroke={stroke} strokeWidth="1.5" transform="rotate(-10 30 60)" />
        </>
      );
      break;
    case "tubifex":
      svg = (
        <>
          <path d="M 15 50 Q 30 30 50 50 T 85 50" stroke={stroke} strokeWidth="3" fill="none" />
          <path d="M 15 60 Q 30 80 50 60 T 85 60" stroke={stroke} strokeWidth="3" fill="none" opacity="0.6" />
        </>
      );
      break;
    case "trout":
    case "salmon":
      svg = (
        <>
          <path d="M 20 50 Q 35 35, 70 38 L 86 30 L 80 50 L 86 70 L 70 62 Q 35 65, 20 50 Z" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="32" cy="46" r="2" fill={stroke} />
          {species.id === "trout" && (
            <>
              <circle cx="50" cy="44" r="1.5" fill={stroke} />
              <circle cx="62" cy="48" r="1.5" fill={stroke} />
              <circle cx="56" cy="55" r="1.5" fill={stroke} />
            </>
          )}
        </>
      );
      break;
    case "dipper":
      svg = (
        <>
          <ellipse cx="50" cy="55" rx="20" ry="14" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="35" cy="42" r="9" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="32" cy="40" r="1.5" fill="#0a0e1a" />
          <path d="M 25 42 L 18 45" stroke={stroke} strokeWidth="2" />
          <path d="M 60 60 L 72 70" stroke={stroke} strokeWidth="1.5" />
        </>
      );
      break;
    case "crayfish":
      svg = (
        <>
          <ellipse cx="50" cy="50" rx="18" ry="12" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M 32 42 Q 22 32 14 38" stroke={stroke} strokeWidth="2" fill="none" />
          <path d="M 32 58 Q 22 68 14 62" stroke={stroke} strokeWidth="2" fill="none" />
          <path d="M 68 50 L 84 50" stroke={stroke} strokeWidth="1.5" />
          <path d="M 80 46 L 88 50 L 80 54" stroke={stroke} strokeWidth="1.5" fill={fill} />
        </>
      );
      break;
    case "greencrab":
      svg = (
        <>
          <ellipse cx="50" cy="55" rx="22" ry="14" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="42" cy="48" r="2" fill={stroke} />
          <circle cx="58" cy="48" r="2" fill={stroke} />
          {[-1, 0, 1].map((i) => (
            <g key={i}>
              <path d={`M ${30 + i * 4} 60 L ${20 + i * 4} 70`} stroke={stroke} strokeWidth="1.5" />
              <path d={`M ${66 + i * 4} 60 L ${76 + i * 4} 70`} stroke={stroke} strokeWidth="1.5" />
            </g>
          ))}
        </>
      );
      break;
    case "newt":
      svg = (
        <>
          <ellipse cx="50" cy="55" rx="22" ry="9" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="32" cy="55" r="6" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="29" cy="53" r="1.5" fill={stroke} />
          <path d="M 70 55 Q 84 50 88 55" stroke={stroke} strokeWidth="1.5" fill="none" />
          <line x1="42" y1="62" x2="42" y2="68" stroke={stroke} strokeWidth="1.5" />
          <line x1="58" y1="62" x2="58" y2="68" stroke={stroke} strokeWidth="1.5" />
        </>
      );
      break;
    case "leopard":
      svg = (
        <>
          <path d="M 18 50 Q 30 38 65 38 L 78 32 L 86 50 L 78 68 L 65 62 Q 30 62 18 50 Z" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="30" cy="46" r="1.8" fill={stroke} />
          {[[40, 42], [50, 45], [60, 42], [45, 55], [55, 56]].map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx="3" ry="2" fill={stroke} opacity="0.7" />
          ))}
        </>
      );
      break;
    case "harborseal":
      svg = (
        <>
          <ellipse cx="50" cy="55" rx="28" ry="14" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="34" cy="48" r="6" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="31" cy="46" r="1.5" fill={stroke} />
          <path d="M 76 60 L 86 65" stroke={stroke} strokeWidth="1.5" />
          <path d="M 76 60 L 86 55" stroke={stroke} strokeWidth="1.5" />
        </>
      );
      break;
    case "graywhale":
      svg = (
        <>
          <path d="M 12 50 Q 22 38 70 38 L 80 28 L 86 50 L 80 72 L 70 62 Q 22 62 12 50 Z" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="22" cy="46" r="1.5" fill={stroke} />
          <path d="M 70 50 L 86 50" stroke={stroke} strokeWidth="1" opacity="0.5" />
        </>
      );
      break;
    case "tardigrade":
      svg = (
        <>
          <ellipse cx="50" cy="50" rx="24" ry="18" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <ellipse cx="50" cy="42" rx="18" ry="6" fill={fill} stroke={stroke} strokeWidth="1" opacity="0.6" />
          <circle cx="32" cy="48" r="2" fill="#0a0e1a" />
          {[26, 38, 52, 66].map((x, i) => (
            <g key={i}>
              <line x1={x} y1="68" x2={x - 2} y2="80" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
              <circle cx={x - 2} cy="80" r="1.5" fill={stroke} />
            </g>
          ))}
        </>
      );
      break;
    case "coelacanth":
      svg = (
        <>
          <path d="M 14 50 Q 28 32 65 35 L 80 25 L 86 50 L 80 75 L 65 65 Q 28 68 14 50 Z" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <circle cx="28" cy="46" r="2" fill={stroke} />
          <path d="M 38 60 Q 42 68 38 70" stroke={stroke} strokeWidth="1.5" fill="none" />
          <path d="M 52 60 Q 56 68 52 70" stroke={stroke} strokeWidth="1.5" fill="none" />
          <path d="M 65 35 L 65 25 L 70 30" stroke={stroke} strokeWidth="1.5" fill={fill} />
        </>
      );
      break;
    case "eurypterid":
      svg = (
        <>
          <path d="M 30 50 Q 50 30 76 50 Q 50 70 30 50 Z" fill={fill} stroke={stroke} strokeWidth="1.5" />
          <path d="M 76 50 L 90 50 L 86 46 M 90 50 L 86 54" stroke={stroke} strokeWidth="1.5" fill="none" />
          <path d="M 30 50 Q 18 38 12 44" stroke={stroke} strokeWidth="2" fill="none" />
          <path d="M 30 50 Q 18 62 12 56" stroke={stroke} strokeWidth="2" fill="none" />
          <circle cx="42" cy="46" r="1.8" fill={stroke} />
          <circle cx="58" cy="46" r="1.8" fill={stroke} />
        </>
      );
      break;
    default:
      svg = <circle cx="50" cy="50" r="20" fill={fill} stroke={stroke} strokeWidth="1.5" />;
  }

  return (
    <svg viewBox="0 0 100 100" style={{ width: size, height: size }}>
      {svg}
    </svg>
  );
}
