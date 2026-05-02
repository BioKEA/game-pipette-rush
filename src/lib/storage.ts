const HIGH_SCORE_KEY = "ldc-high-score";
const POKEDEX_KEY = "ldc-pokedex";
const TUTORIAL_KEY = "ldc-tutorial-seen";
const MUTED_KEY = "ldc-muted";
const ACHIEVEMENTS_KEY = "ldc-achievements";
const SITES_VISITED_KEY = "ldc-sites-visited";
const STAGE_WINS_KEY = "ldc-stage-wins";
const DAILY_BEST_KEY = "ldc-daily-best";
const PRACTICE_STATS_KEY = "ldc-practice-stats";
const DIFFICULTY_KEY = "ldc-difficulty";
const CTA_SHOWN_AT_KEY = "ldc-cta-shown-at";

export function loadHighScore(): number {
  try {
    const v = localStorage.getItem(HIGH_SCORE_KEY);
    return v ? parseInt(v, 10) : 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(score: number) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(score));
  } catch {
    // ignore
  }
}

export function loadPokedex(): Record<string, number> {
  try {
    const v = localStorage.getItem(POKEDEX_KEY);
    return v ? JSON.parse(v) : {};
  } catch {
    return {};
  }
}

export function savePokedex(dex: Record<string, number>) {
  try {
    localStorage.setItem(POKEDEX_KEY, JSON.stringify(dex));
  } catch {
    // ignore
  }
}

export function hasSeenTutorial(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === "1";
  } catch {
    return false;
  }
}

export function markTutorialSeen() {
  try {
    localStorage.setItem(TUTORIAL_KEY, "1");
  } catch {
    // ignore
  }
}

export function loadMuted(): boolean {
  try {
    return localStorage.getItem(MUTED_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveMuted(muted: boolean) {
  try {
    localStorage.setItem(MUTED_KEY, muted ? "1" : "0");
  } catch {
    // ignore
  }
}

export function loadAchievements(): Record<string, number> {
  try {
    const v = localStorage.getItem(ACHIEVEMENTS_KEY);
    return v ? JSON.parse(v) : {};
  } catch {
    return {};
  }
}

export function saveAchievements(unlocked: Record<string, number>) {
  try {
    localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
  } catch {
    // ignore
  }
}

export function loadSitesVisited(): Record<string, number> {
  try {
    const v = localStorage.getItem(SITES_VISITED_KEY);
    return v ? JSON.parse(v) : {};
  } catch {
    return {};
  }
}

export function saveSitesVisited(visits: Record<string, number>) {
  try {
    localStorage.setItem(SITES_VISITED_KEY, JSON.stringify(visits));
  } catch {
    // ignore
  }
}

export function loadStageWins(): Record<string, number> {
  try {
    const v = localStorage.getItem(STAGE_WINS_KEY);
    return v ? JSON.parse(v) : {};
  } catch {
    return {};
  }
}

export function saveStageWins(wins: Record<string, number>) {
  try {
    localStorage.setItem(STAGE_WINS_KEY, JSON.stringify(wins));
  } catch {
    // ignore
  }
}

export interface DailyEntry {
  date: string;
  best: number;
  bestWave: number;
}

export function loadDailyBest(): Record<string, DailyEntry> {
  try {
    const v = localStorage.getItem(DAILY_BEST_KEY);
    return v ? JSON.parse(v) : {};
  } catch {
    return {};
  }
}

export function saveDailyBest(entries: Record<string, DailyEntry>) {
  try {
    localStorage.setItem(DAILY_BEST_KEY, JSON.stringify(entries));
  } catch {
    // ignore
  }
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export interface PracticeStat {
  attempts: number;
  wins: number;
}

export function loadPracticeStats(): Record<string, PracticeStat> {
  try {
    const v = localStorage.getItem(PRACTICE_STATS_KEY);
    return v ? JSON.parse(v) : {};
  } catch {
    return {};
  }
}

export function savePracticeStats(stats: Record<string, PracticeStat>) {
  try {
    localStorage.setItem(PRACTICE_STATS_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

export function loadDifficulty(): string {
  try {
    return localStorage.getItem(DIFFICULTY_KEY) ?? "grad";
  } catch {
    return "grad";
  }
}

export function saveDifficulty(id: string) {
  try {
    localStorage.setItem(DIFFICULTY_KEY, id);
  } catch {
    // ignore
  }
}

export function loadCtaShownAt(): number {
  try {
    const v = localStorage.getItem(CTA_SHOWN_AT_KEY);
    return v ? parseInt(v, 10) : 0;
  } catch {
    return 0;
  }
}

export function saveCtaShownAt(ts: number) {
  try {
    localStorage.setItem(CTA_SHOWN_AT_KEY, String(ts));
  } catch {
    // ignore
  }
}
