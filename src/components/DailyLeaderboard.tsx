import { useEffect, useState } from "react";
import { type DailyEntry } from "@/lib/storage";
import {
  fetchTopDaily,
  loadHandle,
  saveHandle,
  sanitizeHandle,
  type LeaderboardRow,
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
  const [rows, setRows] = useState<LeaderboardRow[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchTopDaily(date)
      .then((r) => {
        if (!cancelled) setRows(r);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load leaderboard.");
      });
    return () => {
      cancelled = true;
    };
  }, [date]);

  function commitHandle() {
    const clean = saveHandle(draftHandle);
    if (clean) setHandleState(clean);
  }

  const yourRank = rows
    ? rows.findIndex((r) => r.isYou) + 1
    : 0;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-6 flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="text-center mb-5">
          <p className="text-[10px] uppercase tracking-[0.4em] text-amber-300/80">
            Daily seed
          </p>
          <h1 className="text-2xl font-light mt-1">{formatDate(date)}</h1>
          <p className="text-xs text-white/40 font-mono mt-1">
            Same wave order, same drops, same site spawns for everyone.
          </p>
        </div>

        {!handle && (
          <div className="bg-amber-300/10 border border-amber-300/30 rounded-lg p-4 mb-4">
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-300 mb-2">
              Pick a handle
            </p>
            <p className="text-xs text-white/60 mb-3">
              Used on the leaderboard. Letters, numbers, _ and -. Up to 16 chars.
            </p>
            <div className="flex gap-2">
              <input
                value={draftHandle}
                onChange={(e) => setDraftHandle(sanitizeHandle(e.target.value))}
                placeholder="handle"
                className="flex-1 bg-black/40 border border-white/20 rounded px-3 py-2 text-sm font-mono text-white placeholder-white/30 focus:outline-none focus:border-amber-300"
                maxLength={16}
              />
              <button
                onClick={commitHandle}
                disabled={!sanitizeHandle(draftHandle)}
                className="bg-amber-300 text-[#0a0e1a] font-semibold px-4 py-2 rounded text-sm uppercase tracking-wider disabled:opacity-30"
              >
                Save
              </button>
            </div>
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
              No scores yet today. Be the first.
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
            {yourRank > 0 && ` · rank #${yourRank}`}
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
