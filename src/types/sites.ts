export interface SiteDef {
  id: string;
  name: string;
  short: string;
  blurb: string;
  difficulty: number; // multiplier on wave duration (lower = harder)
  speciesPool: string[]; // species IDs that can drop
  rareBoost: number; // bonus weight to rare/legendary
  color: string;
  glow: string;
  unlockedAfterWave: number;
  position: { x: number; y: number }; // 0..1 on map
}

export const SITES: SiteDef[] = [
  {
    id: "tilden",
    name: "Tilden Park",
    short: "Tilden",
    blurb: "Freshwater ponds and oak forest. Forgiving conditions.",
    difficulty: 1.1,
    speciesPool: ["daphnia", "asterionella", "lemna", "bacillus", "tubifex", "trout", "dipper", "newt", "tardigrade"],
    rareBoost: 0,
    color: "#34d399",
    glow: "rgba(52,211,153,0.7)",
    unlockedAfterWave: 0,
    position: { x: 0.18, y: 0.32 },
  },
  {
    id: "marina",
    name: "Berkeley Marina",
    short: "Marina",
    blurb: "Brackish pier waters, abundant invertebrates.",
    difficulty: 1.0,
    speciesPool: ["daphnia", "asterionella", "tubifex", "crayfish", "greencrab", "leopard", "harborseal"],
    rareBoost: 1,
    color: "#22d3ee",
    glow: "rgba(34,211,238,0.7)",
    unlockedAfterWave: 0,
    position: { x: 0.4, y: 0.55 },
  },
  {
    id: "estuary",
    name: "SF Estuary",
    short: "Estuary",
    blurb: "Salt marsh, fast tides. Higher rare odds.",
    difficulty: 0.9,
    speciesPool: ["greencrab", "leopard", "harborseal", "salmon", "graywhale", "trout", "crayfish"],
    rareBoost: 3,
    color: "#fb923c",
    glow: "rgba(251,146,60,0.7)",
    unlockedAfterWave: 1,
    position: { x: 0.58, y: 0.62 },
  },
  {
    id: "tahoe",
    name: "Lake Tahoe",
    short: "Tahoe",
    blurb: "Alpine, oligotrophic. Difficult — but legends sleep here.",
    difficulty: 0.8,
    speciesPool: ["trout", "salmon", "newt", "tardigrade", "coelacanth", "eurypterid", "dipper", "bacillus"],
    rareBoost: 5,
    color: "#a78bfa",
    glow: "rgba(167,139,250,0.7)",
    unlockedAfterWave: 4,
    position: { x: 0.84, y: 0.22 },
  },
];

export function siteUnlocked(site: SiteDef, highestWave: number): boolean {
  return highestWave >= site.unlockedAfterWave;
}
