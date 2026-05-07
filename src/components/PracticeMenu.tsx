import { STAGES, type StageDef } from "@/types/game";
import { paletteFor } from "@/lib/palette";
import { play } from "@/lib/audio";
import type { PracticeStat } from "@/lib/storage";

interface Props {
  stats: Record<string, PracticeStat>;
  // Lifetime ranked-mode wins per stage (any mode that isn't Practice).
  // Passed through alongside practiceStats so the menu can show a
  // unified per-stage "you played this much" picture.
  rankedWins?: Record<string, number>;
  onPick: (stage: StageDef) => void;
  onClose: () => void;
}

const STAGE_BLURBS: Record<string, string> = {
  kingfisher: "Drag glowing beads upward to lift them.",
  qiagility: "Tap when the pipette is over the lit well.",
  thermal: "Tap D / A / E as notes hit the line.",
  lightcycler: "Tap when the curve crosses the threshold.",
  promethion: "Press A / T / C / G as bases land.",
  scanner: "Pick the diagnostic feature.",
  vacuum: "Mash to drop pressure into the green zone.",
  minicentri: "Hold the lid — release on the chime.",
  allegra: "Place sample tubes so the rotor is balanced.",
  uvstrat: "Zap when the dose cursor enters the green band.",
  vortex: "Move the mouse in circles to shake the tube.",
  spectro: "Slide the cursor with the moving absorbance peak.",
  qubit: "Watch the fluorescence pattern, then repeat.",
  speedvac: "Tap STOP at each descending volume marker.",
  qiaxcel: "Pick the reference lane that matches the unknown.",
  gel: "Drag each sample into its color-matched well.",
  glovebox: "Steady drag to the target — gloves add lag.",
  microplate: "Click the brightest well in the 96-well plate.",
};

export function PracticeMenu({ stats, rankedWins, onPick, onClose }: Props) {
  const wins = rankedWins ?? {};
  const totalRankedWins = Object.values(wins).reduce((a, b) => a + b, 0);
  const totalPractice = Object.values(stats).reduce(
    (a, b) => ({ attempts: a.attempts + (b?.attempts ?? 0), wins: a.wins + (b?.wins ?? 0) }),
    { attempts: 0, wins: 0 },
  );
  const stagesTouched = STAGES.filter(
    (s) => (stats[s.id]?.attempts ?? 0) > 0 || (wins[s.id] ?? 0) > 0,
  ).length;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white p-5 sm:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-cyan-400/70">
              Practice & Stage Stats
            </p>
            <h1 className="text-3xl font-light mt-1">Single-stage drills</h1>
            <p className="text-sm text-white/50 mt-1">
              No lives, no waves. Pick one robot and rep it. Numbers below
              count both practice runs and ranked-mode clears.
            </p>
          </div>
          <button
            onClick={() => {
              play("click");
              onClose();
            }}
            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded px-4 py-2 text-xs uppercase tracking-widest"
          >
            ← Back
          </button>
        </div>

        {/* Lifetime totals strip */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <StatPill label="stages tried" value={`${stagesTouched}/${STAGES.length}`} />
          <StatPill label="practice clears" value={`${totalPractice.wins}/${totalPractice.attempts}`} />
          <StatPill label="ranked clears" value={String(totalRankedWins)} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {STAGES.map((stage) => (
            <PracticeCard
              key={stage.id}
              stage={stage}
              stat={stats[stage.id]}
              rankedWins={wins[stage.id] ?? 0}
              onPick={onPick}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-white/[0.02] px-3 py-2">
      <div className="text-[9px] uppercase tracking-[0.18em] text-white/40">{label}</div>
      <div className="mt-0.5 font-mono text-sm font-semibold text-white">{value}</div>
    </div>
  );
}

function PracticeCard({
  stage,
  stat,
  rankedWins,
  onPick,
}: {
  stage: StageDef;
  stat: PracticeStat | undefined;
  rankedWins: number;
  onPick: (stage: StageDef) => void;
}) {
  const p = paletteFor(stage);
  const attempts = stat?.attempts ?? 0;
  const wins = stat?.wins ?? 0;
  const winRate = attempts > 0 ? Math.round((wins / attempts) * 100) : null;

  return (
    <button
      onClick={() => {
        play("click");
        onPick(stage);
      }}
      className={`text-left rounded-lg p-4 bg-white/[0.02] hover:bg-white/[0.05] border ${p.borderDim} hover:${p.border} transition-all group`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`h-12 w-12 rounded-lg ${p.bgDim} border-2 ${p.border} flex items-center justify-center shrink-0`}
          style={{ boxShadow: `0 0 20px ${p.hex}33` }}
        >
          <p className={`font-mono text-base font-bold ${p.text}`}>
            {stage.code}
          </p>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-light">{stage.name}</p>
          <p className="text-xs text-white/50 mt-0.5">
            {STAGE_BLURBS[stage.id] ?? stage.prompt}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] font-mono">
        <div className="rounded border border-white/5 bg-white/[0.02] px-2 py-1.5">
          <div className="text-white/35 uppercase tracking-[0.16em] text-[8px]">Practice</div>
          <div className="mt-0.5 flex items-baseline justify-between">
            <span className="text-white/70">
              {attempts === 0 ? "untried" : `${wins}/${attempts}`}
            </span>
            {winRate !== null && (
              <span className={p.text} style={{ opacity: 0.7 }}>
                {winRate}%
              </span>
            )}
          </div>
        </div>
        <div className="rounded border border-white/5 bg-white/[0.02] px-2 py-1.5">
          <div className="text-white/35 uppercase tracking-[0.16em] text-[8px]">Ranked clears</div>
          <div className="mt-0.5 text-white/70">
            {rankedWins === 0 ? "none yet" : `${rankedWins}×`}
          </div>
        </div>
      </div>
    </button>
  );
}
