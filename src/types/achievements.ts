export interface AchievementDef {
  id: string;
  title: string;
  desc: string;
  glyph: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-discovery", title: "First Detection", desc: "Catch your first species", glyph: "●" },
  { id: "rare-find", title: "Bay Specialist", desc: "Detect a rare species", glyph: "◆" },
  { id: "legendary", title: "Mythical Read", desc: "Detect a legendary species", glyph: "★" },
  { id: "streak-10", title: "On a Roll", desc: "Reach a 10-combo", glyph: "≡" },
  { id: "streak-25", title: "Streak Master", desc: "Reach a 25-combo", glyph: "≡" },
  { id: "clean-w10", title: "Clean Run", desc: "Reach wave 10 without losing a life", glyph: "✓" },
  { id: "wave-20", title: "Marathoner", desc: "Survive past wave 20", glyph: "▲" },
  { id: "boss-1", title: "Boss Buster", desc: "Beat your first boss wave", glyph: "▣" },
  { id: "boss-3", title: "Triple Buster", desc: "Beat 3 boss waves in a single run", glyph: "▣" },
  { id: "auction-3", title: "Auction Hunter", desc: "Win 3 lots at auction in a single run", glyph: "$" },
  { id: "field-biologist", title: "Field Biologist", desc: "Complete the pokedex", glyph: "✦" },
  { id: "all-stages", title: "Generalist", desc: "Win at least once on every stage", glyph: "⬡" },
  { id: "every-site", title: "Mapped It Out", desc: "Sample at every field site", glyph: "◯" },
  { id: "daily-podium", title: "Top of the Tide", desc: "Finish top 3 on a daily run", glyph: "♔" },
];

export interface AchievementsState {
  unlocked: Record<string, number>; // achievementId → first unlocked timestamp
  pending: AchievementDef[]; // queued for toast display
}

export const INITIAL_ACHIEVEMENTS: AchievementsState = {
  unlocked: {},
  pending: [],
};
