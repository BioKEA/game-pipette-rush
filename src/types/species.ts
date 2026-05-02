import { rng } from "@/lib/rng";

export type Rarity = "common" | "uncommon" | "rare" | "legendary";

export interface Species {
  id: string;
  name: string;
  latin: string;
  rarity: Rarity;
  habitat: string;
  color: string;
  blurb: string;
}

export const RARITY_COLOR: Record<Rarity, string> = {
  common: "#94a3b8",
  uncommon: "#34d399",
  rare: "#22d3ee",
  legendary: "#fcd34d",
};

export const RARITY_GLOW: Record<Rarity, string> = {
  common: "rgba(148,163,184,0.4)",
  uncommon: "rgba(52,211,153,0.6)",
  rare: "rgba(34,211,238,0.7)",
  legendary: "rgba(252,211,77,0.85)",
};

export const SPECIES: Species[] = [
  // Common
  { id: "daphnia", name: "Daphnia", latin: "Daphnia magna", rarity: "common", habitat: "freshwater", color: "#22d3ee", blurb: "Tiny crustacean, the workhorse of aquatic eDNA." },
  { id: "asterionella", name: "Asterionella", latin: "Asterionella formosa", rarity: "common", habitat: "freshwater", color: "#34d399", blurb: "Star-shaped diatom colony." },
  { id: "lemna", name: "Duckweed", latin: "Lemna minor", rarity: "common", habitat: "ponds", color: "#84cc16", blurb: "Tiny floating plant, doubles in 36 hours." },
  { id: "bacillus", name: "Bacillus", latin: "Bacillus subtilis", rarity: "common", habitat: "soil", color: "#a3a3a3", blurb: "Spore-forming soil bacterium." },
  { id: "tubifex", name: "Sludge Worm", latin: "Tubifex tubifex", rarity: "common", habitat: "freshwater sediment", color: "#fb7185", blurb: "Red worm of muddy bottoms." },
  // Uncommon
  { id: "trout", name: "Rainbow Trout", latin: "Oncorhynchus mykiss", rarity: "uncommon", habitat: "cold streams", color: "#a78bfa", blurb: "Native salmonid of West Coast rivers." },
  { id: "dipper", name: "American Dipper", latin: "Cinclus mexicanus", rarity: "uncommon", habitat: "fast streams", color: "#64748b", blurb: "The only North American songbird that swims underwater." },
  { id: "crayfish", name: "Red Swamp Crayfish", latin: "Procambarus clarkii", rarity: "uncommon", habitat: "warm freshwater", color: "#dc2626", blurb: "Invasive in California waters." },
  { id: "greencrab", name: "European Green Crab", latin: "Carcinus maenas", rarity: "uncommon", habitat: "estuary", color: "#16a34a", blurb: "Aggressive invader of Bay estuaries." },
  { id: "newt", name: "California Newt", latin: "Taricha torosa", rarity: "uncommon", habitat: "Tilden ponds", color: "#f59e0b", blurb: "Carries tetrodotoxin in its skin." },
  // Rare
  { id: "leopard", name: "Leopard Shark", latin: "Triakis semifasciata", rarity: "rare", habitat: "SF Bay shallows", color: "#0891b2", blurb: "Spotted shallow-water shark." },
  { id: "harborseal", name: "Harbor Seal", latin: "Phoca vitulina", rarity: "rare", habitat: "coastal", color: "#475569", blurb: "Spotted in Bay shallows year-round." },
  { id: "salmon", name: "Coho Salmon", latin: "Oncorhynchus kisutch", rarity: "rare", habitat: "coastal streams", color: "#f87171", blurb: "Endangered run in Lagunitas Creek." },
  { id: "graywhale", name: "Gray Whale", latin: "Eschrichtius robustus", rarity: "rare", habitat: "open coast", color: "#334155", blurb: "Migrates past the Farallones each spring." },
  // Legendary
  { id: "tardigrade", name: "Tardigrade", latin: "Hypsibius dujardini", rarity: "legendary", habitat: "moss film", color: "#fcd34d", blurb: "Survives vacuum, radiation, and despair." },
  { id: "coelacanth", name: "Coelacanth eDNA", latin: "Latimeria chalumnae", rarity: "legendary", habitat: "deep abyss", color: "#7c3aed", blurb: "A drift signal from a living fossil." },
  { id: "eurypterid", name: "Sea-Scorpion Trace", latin: "Eurypterida sp.", rarity: "legendary", habitat: "ancient sediment", color: "#f97316", blurb: "Fragmented signal from 400-million-year sediment." },
];

const RARITY_WEIGHT: Record<Rarity, number> = {
  common: 60,
  uncommon: 28,
  rare: 10,
  legendary: 2,
};

export function rollSpecies(
  combo: number,
  options: { sitePool?: string[]; rareBoost?: number; guaranteedRare?: boolean } = {}
): Species | null {
  const { sitePool, rareBoost = 0, guaranteedRare = false } = options;
  const boost = Math.min(combo, 20);
  const weights: Record<Rarity, number> = guaranteedRare
    ? { common: 0, uncommon: 0, rare: 70 + rareBoost * 4, legendary: 18 + rareBoost * 2 }
    : {
        common: Math.max(20, RARITY_WEIGHT.common - boost * 1.5 - rareBoost * 4),
        uncommon: RARITY_WEIGHT.uncommon + boost * 0.4,
        rare: RARITY_WEIGHT.rare + boost * 0.7 + rareBoost * 2,
        legendary: RARITY_WEIGHT.legendary + boost * 0.4 + rareBoost,
      };
  const totalWeight = weights.common + weights.uncommon + weights.rare + weights.legendary;
  if (totalWeight <= 0) return null;
  const roll = rng() * totalWeight;
  let cumulative = 0;
  let rarity: Rarity = "common";
  for (const r of ["common", "uncommon", "rare", "legendary"] as const) {
    cumulative += weights[r];
    if (roll < cumulative) {
      rarity = r;
      break;
    }
  }
  let pool = SPECIES.filter((s) => s.rarity === rarity);
  if (sitePool) {
    const filtered = pool.filter((s) => sitePool.includes(s.id));
    if (filtered.length > 0) pool = filtered;
  }
  if (pool.length === 0) return null;
  return pool[Math.floor(rng() * pool.length)];
}
