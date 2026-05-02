import { type DailyEntry } from "@/lib/storage";

interface Player {
  name: string;
  score: number;
  wave: number;
  isYou: boolean;
}

const FAKE_NAMES = [
  "cinclus",
  "daphnia42",
  "nan0p0re",
  "metabarcode",
  "tilden_run",
  "estuary_dna",
  "mythicread",
  "asterion",
  "rainbow",
  "flowcell_b",
  "pcr.master",
  "berkeley.bio",
  "tardig",
  "phylo",
];

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function dailySeed(date: string): number {
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = (hash * 31 + date.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function generateOpponents(date: string): Player[] {
  const rng = mulberry32(dailySeed(date));
  const count = 8;
  const out: Player[] = [];
  const names = [...FAKE_NAMES].sort(() => rng() - 0.5).slice(0, count);
  // Score distribution: rough log-normal
  for (let i = 0; i < count; i++) {
    const base = 4000 + Math.floor(rng() * 12000);
    const wave = 4 + Math.floor(rng() * 14);
    out.push({ name: names[i], score: base, wave, isYou: false });
  }
  return out;
}

interface Props {
  date: string;
  yourEntry: DailyEntry | null;
  onStart: () => void;
  onClose: () => void;
}

export function DailyLeaderboard({ date, yourEntry, onStart, onClose }: Props) {
  const opponents = generateOpponents(date);
  const all: Player[] = [...opponents];
  if (yourEntry) {
    all.push({ name: "you", score: yourEntry.best, wave: yourEntry.bestWave, isYou: true });
  }
  all.sort((a, b) => b.score - a.score);
  const yourRank = all.findIndex((p) => p.isYou);

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

        <div className="bg-white/[0.03] border border-white/10 rounded-lg overflow-hidden mb-4">
          {all.slice(0, 9).map((p, i) => (
            <div
              key={p.name + i}
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
                  {p.name}
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
            your rank · #{yourRank + 1} of {all.length}
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
