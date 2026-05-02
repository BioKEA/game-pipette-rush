export type UpgradeId =
  | "extra-life"
  | "slow-waves"
  | "score-mult"
  | "second-flow-cell"
  | "magnet-boost";

export interface UpgradeDef {
  id: UpgradeId;
  equipment: string;
  retailPrice: string;
  effectLabel: string;
  description: string;
  basePrice: number;
}

export const UPGRADES: UpgradeDef[] = [
  {
    id: "extra-life",
    equipment: "Tecan Fluent 780",
    retailPrice: "retail $380k",
    effectLabel: "+1 life",
    description: "Top-tier liquid handler. Extra capacity = extra life.",
    basePrice: 200,
  },
  {
    id: "slow-waves",
    equipment: "Hamilton STARlet",
    retailPrice: "retail $180k",
    effectLabel: "−15% wave speed",
    description: "More precise pipetting buys you breathing room.",
    basePrice: 250,
  },
  {
    id: "score-mult",
    equipment: "FAIR Publish License",
    retailPrice: "retail $95k",
    effectLabel: "+25% score",
    description: "Verifiable claims pay better.",
    basePrice: 220,
  },
  {
    id: "second-flow-cell",
    equipment: "Promethion Flow Cell B",
    retailPrice: "retail $50k",
    effectLabel: "+1 life",
    description: "Second nanopore flow cell — redundancy.",
    basePrice: 180,
  },
  {
    id: "magnet-boost",
    equipment: "KingFisher Apex",
    retailPrice: "retail $260k",
    effectLabel: "+10% combo bonus",
    description: "Stronger magnetics, cleaner beads.",
    basePrice: 240,
  },
];

export interface OwnedUpgrades {
  extraLife: number;
  slowWaves: number;
  scoreMult: number;
  comboMult: number;
}

export const INITIAL_UPGRADES: OwnedUpgrades = {
  extraLife: 0,
  slowWaves: 0,
  scoreMult: 0,
  comboMult: 0,
};

export function applyUpgrade(prev: OwnedUpgrades, id: UpgradeId): OwnedUpgrades {
  switch (id) {
    case "extra-life":
    case "second-flow-cell":
      return { ...prev, extraLife: prev.extraLife + 1 };
    case "slow-waves":
      return { ...prev, slowWaves: prev.slowWaves + 1 };
    case "score-mult":
      return { ...prev, scoreMult: prev.scoreMult + 1 };
    case "magnet-boost":
      return { ...prev, comboMult: prev.comboMult + 1 };
  }
}

export function rollAuction(seed: number, alreadyOwned: OwnedUpgrades): UpgradeDef[] {
  // Random 2-3 upgrades, pick from full pool
  const rng = mulberry32(seed);
  const count = 2 + Math.floor(rng() * 2);
  const pool = [...UPGRADES];
  const offers: UpgradeDef[] = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(rng() * pool.length);
    const def = pool.splice(idx, 1)[0];
    // Price scales with how many you already have
    const stacks =
      def.id === "extra-life" || def.id === "second-flow-cell"
        ? alreadyOwned.extraLife
        : def.id === "slow-waves"
        ? alreadyOwned.slowWaves
        : def.id === "score-mult"
        ? alreadyOwned.scoreMult
        : alreadyOwned.comboMult;
    offers.push({ ...def, basePrice: Math.round(def.basePrice * (1 + stacks * 0.6)) });
  }
  return offers;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
