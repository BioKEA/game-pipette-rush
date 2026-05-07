// src/lib/golden-sample.ts
//
// Pipette Rush's slice of the Golden Sample 26 hunt. Slot 1 unlocks
// after the player has completed 12 successful daily runs (any
// daily-mode submission counts; the handle moderation trigger blocks
// abuse handles, so we don't double-count duplicates).
//
// The actual server-side validation lives in
// website-biokea/src/lib/golden-sample/validate.ts — this file just
// nudges the API to recheck after each successful submit.
//
// I won't tell. That would be cheating.

const API_BASE = "/api/golden-sample";
const TICKETS_KEY = "biokea:golden-tickets:v1";
const HANDLE_KEY = "biokea:player:handle";
const CLIENT_ID_KEY = "biokea-leaderboard-client-id";

const GAME_ID = "pipette-rush";
const SLOT = 1;

function alreadyHeld(): boolean {
  try {
    const map = JSON.parse(localStorage.getItem(TICKETS_KEY) ?? "{}");
    return !!map[String(SLOT)];
  } catch {
    return false;
  }
}

function getClientId(): string {
  try {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (id && /^[0-9a-f-]{36}$/i.test(id)) return id;
    id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, id);
    return id;
  } catch {
    return "00000000-0000-4000-8000-000000000000";
  }
}

function readHandle(): string | null {
  try {
    const v = localStorage.getItem(HANDLE_KEY);
    return v && v.trim().length > 0 ? v.trim() : null;
  } catch {
    return null;
  }
}

interface ClaimResponse {
  ok: boolean;
  slot?: number;
  word?: string;
  token?: string;
  issued_at?: string;
  first_earn?: boolean;
}

interface GoldenFoundDetail {
  game: string;
  slot: number;
  word: string;
  token?: string;
  issued_at?: string;
  alreadyHeld: boolean;
}

// Threshold is single-run wave count. The server validator accepts
// any historical row that meets the threshold — which means a player
// who hit wave 12 LAST WEEK would unlock on their first 5-wave run
// today, regardless of in-run signal. Gate at the call site so the
// reveal only fires on the actual qualifying run. Mirror change in
// website-biokea/src/lib/golden-sample/config.ts:SLOTS[0].threshold.
const SLOT_THRESHOLD_WAVE = 12;

// Fire-and-forget. Pass the wave the current run reached; the helper
// only POSTs the claim if the run actually met the threshold. The
// server is still the source of truth (it cross-checks the score row)
// but this prevents the misleading "you did it!" animation after a
// short run when a much earlier run was the real qualifier.
export async function tryClaimGoldenSample(
  args: { handle?: string; wave?: number } = {},
): Promise<void> {
  if (alreadyHeld()) return;
  if (typeof args.wave === 'number' && args.wave < SLOT_THRESHOLD_WAVE) return;
  const h = args.handle ?? readHandle();
  if (!h) return;
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/claim/${GAME_ID}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ handle: h, client_id: getClientId() }),
    });
  } catch {
    return;
  }
  if (!res.ok) return; // 403 = not earned yet, 4xx/5xx = transient — silent.
  let body: ClaimResponse;
  try {
    body = (await res.json()) as ClaimResponse;
  } catch {
    return;
  }
  if (!body.ok || !body.word || !body.slot) return;

  const detail: GoldenFoundDetail = {
    game: GAME_ID,
    slot: body.slot,
    word: body.word,
    token: body.token,
    issued_at: body.issued_at,
    alreadyHeld: !body.first_earn,
  };
  window.dispatchEvent(
    new CustomEvent<GoldenFoundDetail>("biokea:golden-found", { detail }),
  );
}
