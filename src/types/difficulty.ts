export type DifficultyId = "newbie" | "tech" | "grad" | "pi" | "sensei";

export interface DifficultyDef {
  id: DifficultyId;
  name: string;
  short: string;
  blurb: string;
  startingLives: number;
  durationMult: number;
  speedupPerWave: number;
  scoreMult: number;
  auctionProb: number;
  bossInterval: number;
  color: string;
  hex: string;
}

export const DIFFICULTIES: DifficultyDef[] = [
  {
    id: "newbie",
    name: "Lab Newbie",
    short: "Newbie",
    blurb: "First day on the bench. Generous timing, five lives.",
    startingLives: 5,
    durationMult: 1.3,
    speedupPerWave: 100,
    scoreMult: 0.7,
    auctionProb: 0.5,
    bossInterval: 6,
    color: "emerald",
    hex: "#34d399",
  },
  {
    id: "tech",
    name: "Bench Tech",
    short: "Tech",
    blurb: "You know your way around. Forgiving balance, four lives.",
    startingLives: 4,
    durationMult: 1.1,
    speedupPerWave: 140,
    scoreMult: 0.85,
    auctionProb: 0.4,
    bossInterval: 5,
    color: "cyan",
    hex: "#22d3ee",
  },
  {
    id: "grad",
    name: "Grad Student",
    short: "Grad",
    blurb: "Standard balance. Daily seed runs at this tier.",
    startingLives: 3,
    durationMult: 1.0,
    speedupPerWave: 180,
    scoreMult: 1.0,
    auctionProb: 0.35,
    bossInterval: 5,
    color: "amber",
    hex: "#fcd34d",
  },
  {
    id: "pi",
    name: "Principal Investigator",
    short: "PI",
    blurb: "You run the lab. Tight margins, two lives, bigger payouts.",
    startingLives: 2,
    durationMult: 0.9,
    speedupPerWave: 220,
    scoreMult: 1.25,
    auctionProb: 0.25,
    bossInterval: 5,
    color: "orange",
    hex: "#fb923c",
  },
  {
    id: "sensei",
    name: "Sensei of the Pipette",
    short: "Sensei",
    blurb: "One life. Maximum speed. Auctions barely show. Score blows up.",
    startingLives: 1,
    durationMult: 0.8,
    speedupPerWave: 260,
    scoreMult: 1.6,
    auctionProb: 0.15,
    bossInterval: 4,
    color: "rose",
    hex: "#fda4af",
  },
];

export const DEFAULT_DIFFICULTY: DifficultyId = "grad";

export function difficultyDef(id: DifficultyId): DifficultyDef {
  return DIFFICULTIES.find((d) => d.id === id) ?? DIFFICULTIES[2];
}
