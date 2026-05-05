import { GAME_ID, leaderboard } from "./leaderboard-client";

const HANDLE_KEY = "pipette-rush:handle-v1";
// Cross-game key written by the BioKEA leaderboard prompt. Mirror
// reads/writes so a player who set their handle via another BioKEA
// game (or a different browser tab) doesn't silently drop their first
// pipette daily score.
const CROSS_GAME_HANDLE_KEY = "biokea:player:handle";

export interface LeaderboardRow {
  id: string;
  handle: string;
  score: number;
  wave: number;
  isYou: boolean;
  created_at: string;
}

export function loadHandle(): string | null {
  try {
    return (
      localStorage.getItem(HANDLE_KEY) ??
      localStorage.getItem(CROSS_GAME_HANDLE_KEY)
    );
  } catch {
    return null;
  }
}

export function saveHandle(input: string): string {
  const clean = sanitizeHandle(input);
  if (!clean) return "";
  try {
    localStorage.setItem(HANDLE_KEY, clean);
    localStorage.setItem(CROSS_GAME_HANDLE_KEY, clean);
  } catch {
    // ignore
  }
  return clean;
}

export function sanitizeHandle(input: string): string {
  return input.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 16);
}

export type SubmitResult =
  | { ok: true }
  | { ok: false; error: string };

export async function submitDailyScore(args: {
  day: string;
  handle: string;
  score: number;
  wave: number;
}): Promise<SubmitResult> {
  const handle = sanitizeHandle(args.handle);
  if (!handle) return { ok: false, error: "Handle required" };

  const result = await leaderboard.submitScore({
    gameId: GAME_ID,
    mode: "daily",
    seed: args.day,
    score: args.score,
    playerHandle: handle,
    metadata: { wave: args.wave },
  });

  if (!result.ok) {
    const msg =
      result.reason === "rate_limited"
        ? "Too many submissions. Slow down."
        : result.reason === "invalid"
        ? "Score rejected."
        : result.reason === "unconfigured"
        ? "Leaderboard offline."
        : "Network error.";
    return { ok: false, error: msg };
  }
  return { ok: true };
}

export type LeaderboardWindow = "today" | "week" | "all";

// Returns the inclusive start of the rolling 7-day window ending today.
// Lexicographic compare on YYYY-MM-DD seeds is chronological, so this
// is what we hand to the seedFrom range filter.
export function weekStart(today: string): string {
  const d = new Date(today + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 6);
  return d.toISOString().slice(0, 10);
}

function toRow(e: { id: string; player_handle: string; score: number; metadata?: Record<string, unknown> | null; created_at: string }, me: string | null): LeaderboardRow {
  return {
    id: e.id,
    handle: e.player_handle,
    score: e.score,
    wave: typeof e.metadata?.wave === "number" ? (e.metadata.wave as number) : 0,
    isYou: !!me && e.player_handle === me,
    created_at: e.created_at,
  };
}

// Collapses cross-day rows to one per handle (their best). Used for the
// week + all-time windows so a single player who's posted every day
// doesn't take up the whole top 10.
function bestByHandle(rows: LeaderboardRow[]): LeaderboardRow[] {
  const best = new Map<string, LeaderboardRow>();
  for (const r of rows) {
    const existing = best.get(r.handle);
    if (!existing || r.score > existing.score) best.set(r.handle, r);
  }
  return Array.from(best.values()).sort((a, b) => b.score - a.score);
}

export async function fetchTopDaily(day: string, limit = 10): Promise<LeaderboardRow[]> {
  const entries = await leaderboard.getDailyLeaderboard(GAME_ID, day, limit);
  const me = loadHandle();
  return entries.map((e) => toRow(e, me));
}

export async function fetchTop(
  window: LeaderboardWindow,
  today: string,
  limit = 10,
): Promise<LeaderboardRow[]> {
  const me = loadHandle();
  if (window === "today") {
    const entries = await leaderboard.getDailyLeaderboard(GAME_ID, today, limit);
    return entries.map((e) => toRow(e, me));
  }
  // Week + all-time: pull a generous slice (limit * 8) so dedupe leaves
  // enough rows for a top 10 even when a few handles dominate.
  const opts: { gameId: string; mode: string; limit: number; seedFrom?: string; seedTo?: string } = {
    gameId: GAME_ID,
    mode: "daily",
    limit: limit * 8,
  };
  if (window === "week") {
    opts.seedFrom = weekStart(today);
    opts.seedTo = today;
  }
  const entries = await leaderboard.getTopScores(opts);
  return bestByHandle(entries.map((e) => toRow(e, me))).slice(0, limit);
}
