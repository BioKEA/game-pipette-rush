const HIGH_SCORE_KEY = "ldc-high-score";
const TUTORIAL_KEY = "ldc-tutorial-seen";
const MUTED_KEY = "ldc-muted";
const ACHIEVEMENTS_KEY = "ldc-achievements";
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
  // Default to muted on first visit. Once the player toggles a
  // preference, "0"/"1" is stored and respected.
  try {
    const v = localStorage.getItem(MUTED_KEY);
    if (v === "0") return false;
    return true;
  } catch {
    return true;
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
  // Local-timezone date so the seed matches the central leaderboard
  // panel on biokea.ai/mission/games/, which builds its `day` from
  // `new Date()` getters (also local). Using toISOString() here was
  // returning UTC dates — for users west of UTC, scores submitted
  // after ~5pm local were filed under tomorrow's seed and the panel
  // (querying today's seed) never found them.
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
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
