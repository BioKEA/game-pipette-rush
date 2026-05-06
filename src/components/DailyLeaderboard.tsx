import { useEffect, useState } from "react";
import { type DailyEntry } from "@/lib/storage";
import {
  fetchTop,
  loadHandle,
  saveHandle,
  sanitizeHandle,
  submitDailyScore,
  type LeaderboardRow,
  type LeaderboardWindow,
} from "@/lib/daily-leaderboard";

interface Props {
  date: string;
  yourEntry: DailyEntry | null;
  onStart: () => void;
  onClose: () => void;
}

export function DailyLeaderboard({ date, yourEntry, onStart, onClose }: Props) {
  const [handle, setHandleState] = useState<string | null>(() => loadHandle());
  const [draftHandle, setDraftHandle] = useState("");
  const [editingHandle, setEditingHandle] = useState(false);
  const [view, setView] = useState<LeaderboardWindow>("today");
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setLoadError(null);
    fetchTop(view, date)
      .then((r) => {
        if (!cancelled) setRows(r);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load leaderboard.");
      });
    return () => {
      cancelled = true;
    };
  }, [date, view]);

  function commitHandle() {
    const clean = saveHandle(draftHandle);
    if (!clean) return;
    setHandleState(clean);
    // If the player has a local best for today, retroactively post it now —
    // they may have just finished a run and gotten kicked here without a
    // handle, so without this their score never reaches the leaderboard.
    if (yourEntry && yourEntry.best > 0) {
      void submitDailyScore({
        day: date,
        handle: clean,
        score: yourEntry.best,
        wave: yourEntry.bestWave,
      }).then((res) => {
        if (res.ok) {
          // Refresh whichever window is currently showing.
          void fetchTop(view, date).then(setRows).catch(() => undefined);
        }
      });
    }
  }

  const yourRank = rows
    ? rows.findIndex((r) => r.isYou) + 1
    : 0;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-6 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="text-center mb-5">
          <p className="text-[10px] uppercase tracking-[0.4em] text-amber-300/80">
            {view === "today"
              ? "Daily seed"
              : view === "week"
              ? "Last 7 days"
              : "All time"}
          </p>
          <h1 className="text-2xl font-light mt-1">
            {view === "today"
              ? formatDate(date)
              : view === "week"
              ? "Best run · last 7 days"
              : "Best run · ever"}
          </h1>
          <p className="text-xs text-white/40 font-mono mt-1">
            {view === "today"
              ? "Same wave order, same drops, same site spawns for everyone."
              : view === "week"
              ? "One row per player — their best daily run in the last week."
              : "One row per player — their best daily run, all time."}
          </p>
        </div>

        <div className="flex items-center justify-center gap-1 mb-4">
          {(["today", "week", "all"] as const).map((w) => (
            <button
              key={w}
              onClick={() => setView(w)}
              className={`text-[10px] uppercase tracking-[0.18em] font-mono px-3 py-1.5 rounded border transition-colors ${
                view === w
                  ? "bg-amber-300/15 text-amber-200 border-amber-300/40"
                  : "text-white/50 border-white/10 hover:text-white/80 hover:border-white/20"
              }`}
            >
              {w === "today" ? "Today" : w === "week" ? "Week" : "All-time"}
            </button>
          ))}
        </div>

        {(!handle || editingHandle) ? (
          <div className="bg-amber-300/10 border border-amber-300/30 rounded-lg p-4 mb-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-300 mb-2">
              {handle ? "Edit handle" : "Pick a handle"}
            </p>
            {!handle && (
              <p className="text-xs text-white/60 mb-3">
                Used on the leaderboard. Letters, numbers, _ and -. Up to 16 chars.
              </p>
            )}
            <div className="flex gap-2">
              <input
                value={draftHandle}
                onChange={(e) => setDraftHandle(sanitizeHandle(e.target.value))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && sanitizeHandle(draftHandle)) { e.preventDefault(); commitHandle(); setEditingHandle(false); }
                  if (e.key === "Escape") { e.preventDefault(); setEditingHandle(false); }
                }}
                placeholder={handle ?? "handle"}
                className="flex-1 bg-black/40 border border-white/20 rounded px-3 py-2 text-sm font-mono text-white placeholder-white/30 focus:outline-none focus:border-amber-300"
                maxLength={16}
                autoFocus={editingHandle}
              />
              <button
                onClick={() => { commitHandle(); setEditingHandle(false); }}
                disabled={!sanitizeHandle(draftHandle)}
                className="bg-amber-300 text-[#0a0e1a] font-semibold px-4 py-2 rounded text-sm uppercase tracking-wider disabled:opacity-30"
              >
                Save
              </button>
              {editingHandle && (
                <button
                  onClick={() => setEditingHandle(false)}
                  className="text-white/50 hover:text-white px-3 py-2 rounded text-sm border border-white/10"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-4 px-1">
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-mono">
              playing as <span className="text-amber-300/80">{handle}</span>
            </span>
            <button
              onClick={() => { setDraftHandle(handle ?? ""); setEditingHandle(true); }}
              className="text-[9px] uppercase tracking-[0.15em] text-white/30 hover:text-amber-300 transition-colors"
            >
              ✎ edit
            </button>
          </div>
        )}

        <div className="bg-white/[0.03] border border-white/10 rounded-lg overflow-hidden mb-4">
          {rows === null && !loadError && (
            <div className="px-4 py-6 text-center text-xs text-white/40 font-mono">
              loading…
            </div>
          )}
          {loadError && (
            <div className="px-4 py-6 text-center text-xs text-red-300/80 font-mono">
              {loadError}
            </div>
          )}
          {rows && rows.length === 0 && (
            <div className="px-4 py-6 text-center text-xs text-white/50 font-mono">
              {view === "today"
                ? "No scores yet today. Be the first."
                : "No scores yet."}
            </div>
          )}
          {rows &&
            rows.slice(0, 10).map((p, i) => (
              <div
                key={p.id}
                className={`flex items-center justify-between px-3 py-2 ${
                  p.isYou
                    ? "bg-cyan-400/15 border-y border-cyan-400/40"
                    : i % 2 === 0
                    ? "bg-white/[0.01]"
                    : ""
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`text-[10px] font-mono w-5 text-right ${
                      i === 0
                        ? "text-amber-300"
                        : i === 1
                        ? "text-white/80"
                        : i === 2
                        ? "text-orange-300"
                        : "text-white/40"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`text-sm truncate ${
                      p.isYou ? "text-cyan-400 font-semibold" : "text-white/80"
                    }`}
                  >
                    {p.handle}
                  </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[10px] font-mono text-white/40">
                    w{p.wave}
                  </span>
                  <span
                    className={`font-mono text-sm ${
                      p.isYou ? "text-cyan-400" : "text-white/70"
                    }`}
                  >
                    {p.score.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
        </div>

        {yourEntry && (
          <p className="text-[11px] text-center text-white/50 mb-3 font-mono">
            your local best · {yourEntry.best.toLocaleString()} (w{yourEntry.bestWave})
            {view === "today" && yourRank > 0 && ` · rank #${yourRank}`}
          </p>
        )}

        <button
          onClick={onStart}
          className="w-full bg-amber-300 text-[#0a0e1a] font-bold px-6 py-3 rounded uppercase tracking-widest text-sm hover:bg-amber-200 shadow-[0_0_30px_rgba(252,211,77,0.4)]"
        >
          {yourEntry ? "Try Again" : "Begin Daily Run"}
        </button>

        <button
          onClick={onClose}
          className="w-full mt-2 text-[10px] uppercase tracking-widest text-white/50 hover:text-white py-2"
        >
          ← Back
        </button>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00");
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
