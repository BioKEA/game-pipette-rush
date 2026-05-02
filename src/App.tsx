import { useEffect, useRef, useState } from "react";
import { STAGES, type StageDef } from "@/types/game";
import { paletteFor } from "@/lib/palette";
import { useStableCallback } from "@/lib/useStable";
import {
  loadHighScore,
  saveHighScore,
  loadPokedex,
  savePokedex,
  hasSeenTutorial,
  markTutorialSeen,
  loadMuted,
  saveMuted,
  loadAchievements,
  saveAchievements,
  loadSitesVisited,
  saveSitesVisited,
  loadStageWins,
  saveStageWins,
  loadDailyBest,
  saveDailyBest,
  todayKey,
  loadPracticeStats,
  savePracticeStats,
  loadDifficulty,
  saveDifficulty,
  loadCtaShownAt,
  saveCtaShownAt,
  type DailyEntry,
  type PracticeStat,
} from "@/lib/storage";
import {
  DIFFICULTIES,
  difficultyDef,
  DEFAULT_DIFFICULTY,
  type DifficultyId,
} from "@/types/difficulty";
import { play, setMuted, unlockAudio } from "@/lib/audio";
import {
  rollSpecies,
  type Species,
  RARITY_COLOR,
  RARITY_GLOW,
  SPECIES,
} from "@/types/species";
import {
  rollAuction,
  applyUpgrade,
  INITIAL_UPGRADES,
  type OwnedUpgrades,
  type UpgradeDef,
  type UpgradeId,
} from "@/types/upgrades";
import { SITES, type SiteDef } from "@/types/sites";
import { ACHIEVEMENTS, type AchievementDef } from "@/types/achievements";
import { setSeed as setRngSeed, clearSeed, rng, pickInt, seedFromString } from "@/lib/rng";
import { KingFisherGame } from "@/games/KingFisherGame";
import { QIAgilityGame } from "@/games/QIAgilityGame";
import { ThermalCyclerGame } from "@/games/ThermalCyclerGame";
import { LightCyclerGame } from "@/games/LightCyclerGame";
import { PromethionGame } from "@/games/PromethionGame";
import { DiversityScannerGame } from "@/games/DiversityScannerGame";
import { VacuumPumpGame } from "@/games/VacuumPumpGame";
import { MiniCentrifugeGame } from "@/games/MiniCentrifugeGame";
import { AllegraGame } from "@/games/AllegraGame";
import { UVStratalinkerGame } from "@/games/UVStratalinkerGame";
import { VortexGame } from "@/games/VortexGame";
import { SpectroGame } from "@/games/SpectroGame";
import { QubitGame } from "@/games/QubitGame";
import { SpeedVacGame } from "@/games/SpeedVacGame";
import { QIAxcelGame } from "@/games/QIAxcelGame";
import { GelGame } from "@/games/GelGame";
import { GloveBoxGame } from "@/games/GloveBoxGame";
import { MicroplateGame } from "@/games/MicroplateGame";
import { TutorialOverlay } from "@/components/TutorialOverlay";
import { PokedexView } from "@/components/PokedexView";
import { AuctionView } from "@/components/AuctionView";
import { SiteMap } from "@/components/SiteMap";
import { DailyLeaderboard } from "@/components/DailyLeaderboard";
import { AchievementToast } from "@/components/AchievementToast";
import { PracticeMenu } from "@/components/PracticeMenu";
import { SupportCta } from "@/components/SupportCta";
import type { MicroGameProps } from "@/games/types";

type Phase =
  | "intro"
  | "daily-board"
  | "site-select"
  | "stage-intro"
  | "playing"
  | "result"
  | "auction"
  | "pokedex"
  | "gameover"
  | "practice-menu"
  | "practice-play"
  | "practice-result";

interface AppState {
  phase: Phase;
  wave: number;
  score: number;
  lives: number;
  combo: number;
  bestCombo: number;
  currentStage: StageDef | null;
  currentSiteId: string;
  lastResult: "win" | "fail" | null;
  highScore: number;
  credits: number;
  upgrades: OwnedUpgrades;
  newSpecies: Species | null;
  auctionOffers: UpgradeDef[];
  showTutorial: boolean;
  // Boss
  isBossWave: boolean;
  bossChain: StageDef[];
  bossProgress: number;
  bossWinsThisRun: number;
  // Run-scoped tracking
  auctionWinsThisRun: number;
  noContaminationStreak: boolean;
  sitesVisitedThisRun: Record<string, true>;
  stageWinsThisRun: Record<string, true>;
  // Mode
  isDaily: boolean;
  difficulty: DifficultyId;
}

const INITIAL_STATE: AppState = {
  phase: "intro",
  wave: 0,
  score: 0,
  lives: 3,
  combo: 0,
  bestCombo: 0,
  currentStage: null,
  currentSiteId: "tilden",
  lastResult: null,
  highScore: 0,
  credits: 0,
  upgrades: INITIAL_UPGRADES,
  newSpecies: null,
  auctionOffers: [],
  showTutorial: false,
  isBossWave: false,
  bossChain: [],
  bossProgress: 0,
  bossWinsThisRun: 0,
  auctionWinsThisRun: 0,
  noContaminationStreak: true,
  sitesVisitedThisRun: {},
  stageWinsThisRun: {},
  isDaily: false,
  difficulty: DEFAULT_DIFFICULTY,
};

function pickStage(wave: number): StageDef {
  const idx = pickInt(Math.min(wave + 1, STAGES.length));
  return STAGES[Math.min(idx, STAGES.length - 1)];
}

function pickBossChain(wave: number): StageDef[] {
  const out: StageDef[] = [];
  const max = Math.min(wave + 2, STAGES.length);
  for (let i = 0; i < 3; i++) {
    out.push(STAGES[pickInt(max)]);
  }
  return out;
}

function isBossWaveNumber(wave: number, interval: number): boolean {
  return wave > 0 && wave % interval === 0;
}

function durationForWave(
  wave: number,
  slowWaves: number,
  siteDifficulty: number,
  isBoss: boolean,
  difficulty: DifficultyId
): number {
  const def = difficultyDef(difficulty);
  const base = Math.max(2000, 5500 - wave * def.speedupPerWave);
  const withTier = base * def.durationMult;
  const withUpgrade = withTier * (1 + slowWaves * 0.15);
  const withSite = withUpgrade * siteDifficulty;
  const bossMult = isBoss ? 0.85 : 1;
  return Math.round(withSite * bossMult);
}

function App() {
  const [state, setState] = useState<AppState>(() => ({
    ...INITIAL_STATE,
    highScore: loadHighScore(),
    showTutorial: !hasSeenTutorial(),
    difficulty: (loadDifficulty() as DifficultyId) ?? DEFAULT_DIFFICULTY,
  }));
  const [pokedex, setPokedex] = useState<Record<string, number>>(() => loadPokedex());
  const [achievements, setAchievementsState] = useState<Record<string, number>>(
    () => loadAchievements()
  );
  const [sitesVisitedAllTime, setSitesVisitedAllTime] = useState<Record<string, number>>(
    () => loadSitesVisited()
  );
  const [stageWinsAllTime, setStageWinsAllTime] = useState<Record<string, number>>(
    () => loadStageWins()
  );
  const [dailyBest, setDailyBestState] = useState<Record<string, DailyEntry>>(
    () => loadDailyBest()
  );
  const [pendingAchievements, setPendingAchievements] = useState<AchievementDef[]>([]);
  const [practiceStats, setPracticeStatsState] = useState<Record<string, PracticeStat>>(
    () => loadPracticeStats()
  );
  const [seed, setSeed] = useState(1);
  const [timerKey, setTimerKey] = useState(0);
  const [muted, setMutedState] = useState(() => loadMuted());
  const sessionRunsRef = useRef(0);
  const [showCta, setShowCta] = useState(false);

  useEffect(() => {
    setMuted(muted);
    saveMuted(muted);
  }, [muted]);

  function unlockAchievement(id: string) {
    if (achievements[id]) return;
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (!def) return;
    setAchievementsState((prev) => {
      if (prev[id]) return prev;
      const next = { ...prev, [id]: Date.now() };
      saveAchievements(next);
      return next;
    });
    setPendingAchievements((prev) => [...prev, def]);
    play("rare-discover");
  }

  function checkAchievements(s: AppState, ctx: {
    species?: Species;
    bossWin?: boolean;
    auctionBuy?: boolean;
    pokedex?: Record<string, number>;
    stageWins?: Record<string, number>;
    sitesAllTime?: Record<string, number>;
    dailyEntry?: DailyEntry;
    dailyRank?: number;
  }) {
    if (ctx.species) {
      unlockAchievement("first-discovery");
      if (ctx.species.rarity === "rare") unlockAchievement("rare-find");
      if (ctx.species.rarity === "legendary") unlockAchievement("legendary");
    }
    if (s.combo >= 10) unlockAchievement("streak-10");
    if (s.combo >= 25) unlockAchievement("streak-25");
    if (s.wave >= 10 && s.noContaminationStreak) unlockAchievement("clean-w10");
    if (s.wave >= 20) unlockAchievement("wave-20");
    if (ctx.bossWin) {
      unlockAchievement("boss-1");
      if (s.bossWinsThisRun + 1 >= 3) unlockAchievement("boss-3");
    }
    if (ctx.auctionBuy && s.auctionWinsThisRun + 1 >= 3) unlockAchievement("auction-3");
    if (ctx.pokedex && Object.keys(ctx.pokedex).length >= SPECIES.length) {
      unlockAchievement("field-biologist");
    }
    if (ctx.stageWins && Object.keys(ctx.stageWins).length >= STAGES.length) {
      unlockAchievement("all-stages");
    }
    if (ctx.sitesAllTime && Object.keys(ctx.sitesAllTime).length >= SITES.length) {
      unlockAchievement("every-site");
    }
    if (ctx.dailyEntry && ctx.dailyRank !== undefined && ctx.dailyRank <= 3) {
      unlockAchievement("daily-podium");
    }
  }

  function startGame(daily: boolean) {
    unlockAudio();
    play("click");
    if (daily) {
      setRngSeed(seedFromString(todayKey()));
    } else {
      clearSeed();
    }
    const tier: DifficultyId = daily ? "grad" : (state.difficulty || DEFAULT_DIFFICULTY);
    const def = difficultyDef(tier);
    setState((s) => ({
      ...INITIAL_STATE,
      highScore: s.highScore,
      showTutorial: !hasSeenTutorial() && !daily,
      phase: "site-select",
      wave: 1,
      lives: def.startingLives,
      currentSiteId: s.currentSiteId,
      isDaily: daily,
      difficulty: tier,
    }));
    setSeed((s) => s + 1);
    setTimerKey((k) => k + 1);
  }

  function handleSitePick(siteId: string) {
    play("click");
    const site = SITES.find((s) => s.id === siteId) ?? SITES[0];
    setState((s) => {
      const sitesVisited = { ...s.sitesVisitedThisRun, [siteId]: true as const };
      // Track all-time sites
      const allTime = { ...sitesVisitedAllTime, [siteId]: (sitesVisitedAllTime[siteId] ?? 0) + 1 };
      saveSitesVisited(allTime);
      setSitesVisitedAllTime(allTime);
      checkAchievements({ ...s, sitesVisitedThisRun: sitesVisited }, { sitesAllTime: allTime });
      // Determine next stage(s)
      const isBoss = isBossWaveNumber(s.wave, difficultyDef(s.difficulty).bossInterval);
      if (isBoss) {
        const chain = pickBossChain(s.wave);
        return {
          ...s,
          currentSiteId: site.id,
          sitesVisitedThisRun: sitesVisited,
          phase: "stage-intro",
          isBossWave: true,
          bossChain: chain,
          bossProgress: 0,
          currentStage: chain[0],
        };
      }
      const stage = pickStage(s.wave);
      return {
        ...s,
        currentSiteId: site.id,
        sitesVisitedThisRun: sitesVisited,
        phase: "stage-intro",
        isBossWave: false,
        bossChain: [],
        bossProgress: 0,
        currentStage: stage,
      };
    });
    setSeed((s) => s + 1);
    setTimerKey((k) => k + 1);
  }

  useEffect(() => {
    if (state.phase !== "stage-intro") return;
    const t = setTimeout(() => {
      setState((s) => ({ ...s, phase: "playing" }));
    }, state.isBossWave && state.bossProgress === 0 ? 1400 : 900);
    return () => clearTimeout(t);
  }, [state.phase, state.wave, state.bossProgress, state.isBossWave]);

  function handleWin() {
    play("win");
    setState((s) => {
      // Boss wave: maybe advance to next sub-stage instead of ending wave
      if (s.isBossWave && s.bossProgress + 1 < s.bossChain.length) {
        const nextProgress = s.bossProgress + 1;
        return {
          ...s,
          phase: "stage-intro",
          bossProgress: nextProgress,
          currentStage: s.bossChain[nextProgress],
        };
      }
      // Wave complete
      const points = 100 + s.wave * 20;
      const combo = s.combo + 1;
      const comboBoost = 1 + s.upgrades.comboMult * 0.1;
      const scoreMult = 1 + s.upgrades.scoreMult * 0.25;
      const bossBonus = s.isBossWave ? 3 : 1;
      const tierMult = difficultyDef(s.difficulty).scoreMult;
      const gained = Math.round(
        points * Math.max(1, combo) * comboBoost * scoreMult * bossBonus * tierMult
      );
      const score = s.score + gained;
      const credits = s.credits + (s.isBossWave ? 150 : 50) + s.wave * 5;
      const site = SITES.find((x) => x.id === s.currentSiteId) ?? SITES[0];
      const species = rollSpecies(combo, {
        sitePool: site.speciesPool,
        rareBoost: site.rareBoost,
        guaranteedRare: s.isBossWave,
      });
      // Stage wins (track per stage that was won)
      const stageWinsRun = { ...s.stageWinsThisRun };
      if (s.isBossWave) {
        s.bossChain.forEach((st) => (stageWinsRun[st.id] = true));
      } else if (s.currentStage) {
        stageWinsRun[s.currentStage.id] = true;
      }
      // All-time
      const allTime = { ...stageWinsAllTime };
      Object.keys(stageWinsRun).forEach((k) => {
        allTime[k] = (allTime[k] ?? 0) + 1;
      });
      saveStageWins(allTime);
      setStageWinsAllTime(allTime);
      const next: AppState = {
        ...s,
        phase: "result",
        lastResult: "win",
        score,
        combo,
        bestCombo: Math.max(s.bestCombo, combo),
        credits,
        newSpecies: species,
        bossWinsThisRun: s.isBossWave ? s.bossWinsThisRun + 1 : s.bossWinsThisRun,
        stageWinsThisRun: stageWinsRun,
      };
      checkAchievements(next, {
        species: species ?? undefined,
        bossWin: s.isBossWave,
        stageWins: allTime,
      });
      return next;
    });
  }

  function handleFail() {
    play("fail");
    setState((s) => {
      const lives = s.lives - 1;
      return {
        ...s,
        phase: lives <= 0 ? "gameover" : "result",
        lastResult: "fail",
        lives,
        combo: 0,
        newSpecies: null,
        noContaminationStreak: false,
        // Boss fails outright
        isBossWave: false,
        bossChain: [],
        bossProgress: 0,
      };
    });
  }

  // Add discovered species to pokedex when result phase enters
  useEffect(() => {
    if (state.phase !== "result" || !state.newSpecies) return;
    const sp = state.newSpecies;
    setPokedex((prev) => {
      const next = { ...prev, [sp.id]: (prev[sp.id] || 0) + 1 };
      savePokedex(next);
      checkAchievements(state, { pokedex: next });
      return next;
    });
    if (sp.rarity === "rare" || sp.rarity === "legendary") {
      play("rare-discover");
    } else {
      play("discover");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase, state.newSpecies]);

  // Result → next wave or auction or site-select
  useEffect(() => {
    if (state.phase !== "result") return;
    const t = setTimeout(() => {
      setState((s) => {
        if (s.lives <= 0) return { ...s, phase: "gameover" };
        // Maybe trigger auction
        const canAuction =
          s.lastResult === "win" &&
          s.wave >= 2 &&
          rng() < difficultyDef(s.difficulty).auctionProb;
        if (canAuction) {
          play("auction");
          const offers = rollAuction(Math.floor(rng() * 0xffffff), s.upgrades);
          return { ...s, phase: "auction", auctionOffers: offers, newSpecies: null };
        }
        // Otherwise advance to next wave site-select
        const nextWave = s.wave + 1;
        return {
          ...s,
          phase: "site-select",
          wave: nextWave,
          lastResult: null,
          newSpecies: null,
          isBossWave: false,
          bossChain: [],
          bossProgress: 0,
        };
      });
      setSeed((s) => s + 1);
      setTimerKey((k) => k + 1);
    }, 1100);
    return () => clearTimeout(t);
  }, [state.phase]);

  function handleAuctionBuy(id: UpgradeId) {
    setState((s) => {
      const offer = s.auctionOffers.find((o) => o.id === id);
      if (!offer || s.credits < offer.basePrice) return s;
      const upgrades = applyUpgrade(s.upgrades, id);
      const credits = s.credits - offer.basePrice;
      let lives = s.lives;
      if (id === "extra-life" || id === "second-flow-cell") {
        lives = Math.min(lives + 1, 5);
      }
      const next: AppState = {
        ...s,
        credits,
        upgrades,
        lives,
        phase: "site-select",
        wave: s.wave + 1,
        auctionOffers: [],
        lastResult: null,
        auctionWinsThisRun: s.auctionWinsThisRun + 1,
      };
      checkAchievements(s, { auctionBuy: true });
      return next;
    });
    setSeed((s) => s + 1);
    setTimerKey((k) => k + 1);
  }

  function handleAuctionSkip() {
    setState((s) => ({
      ...s,
      phase: "site-select",
      wave: s.wave + 1,
      auctionOffers: [],
      lastResult: null,
    }));
    setSeed((s) => s + 1);
    setTimerKey((k) => k + 1);
  }

  // Practice result auto-return to menu
  useEffect(() => {
    if (state.phase !== "practice-result") return;
    const t = setTimeout(() => {
      setState((s) => ({ ...s, phase: "practice-menu", lastResult: null }));
    }, 1100);
    return () => clearTimeout(t);
  }, [state.phase]);

  // Gameover handling — save daily/regular high score, check daily-podium achievement
  useEffect(() => {
    if (state.phase !== "gameover") return;
    play("gameover");
    if (state.isDaily) {
      const date = todayKey();
      const cur = dailyBest[date];
      if (!cur || state.score > cur.best) {
        const entry: DailyEntry = { date, best: state.score, bestWave: state.wave };
        const next = { ...dailyBest, [date]: entry };
        saveDailyBest(next);
        setDailyBestState(next);
      }
      // Check daily-podium achievement (computed against opponent set)
      // Use the same generator as DailyLeaderboard for consistency
      const opponents = generateDailyOpponents(date);
      const all = [...opponents, { score: state.score, isYou: true }];
      all.sort((a, b) => b.score - a.score);
      const rank = all.findIndex((p) => "isYou" in p && p.isYou) + 1;
      if (rank > 0 && rank <= 3) {
        unlockAchievement("daily-podium");
      }
    } else {
      if (state.score > state.highScore) {
        saveHighScore(state.score);
        setState((s) => ({ ...s, highScore: s.score }));
      }
    }
    clearSeed();
    // Run-end CTA: after 3 gameovers this session, prompt support — once per 7 days
    sessionRunsRef.current += 1;
    const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
    const lastShown = loadCtaShownAt();
    if (
      sessionRunsRef.current >= 3 &&
      Date.now() - lastShown > SEVEN_DAYS
    ) {
      const t = setTimeout(() => setShowCta(true), 1600);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.phase]);

  function dismissCta() {
    saveCtaShownAt(Date.now());
    setShowCta(false);
  }

  function dismissTutorial() {
    play("click");
    markTutorialSeen();
    setState((s) => ({ ...s, showTutorial: false }));
    setTimerKey((k) => k + 1);
  }

  function openPokedex() {
    play("click");
    setState((s) => ({ ...s, phase: "pokedex" }));
  }
  function closePokedex() {
    play("click");
    setState((s) => ({ ...s, phase: "intro" }));
  }
  function openDailyBoard() {
    play("click");
    setState((s) => ({ ...s, phase: "daily-board" }));
  }
  function closeDailyBoard() {
    play("click");
    setState((s) => ({ ...s, phase: "intro" }));
  }
  function openPractice() {
    play("click");
    unlockAudio();
    setState((s) => ({ ...s, phase: "practice-menu" }));
  }
  function closePractice() {
    play("click");
    setState((s) => ({ ...s, phase: "intro" }));
  }
  function startPracticeStage(stage: StageDef) {
    setState((s) => ({
      ...s,
      phase: "practice-play",
      currentStage: stage,
      lastResult: null,
    }));
    setSeed((s) => s + 1);
    setTimerKey((k) => k + 1);
  }
  function handlePracticeWin() {
    play("win");
    setState((s) => {
      if (!s.currentStage) return s;
      const id = s.currentStage.id;
      const prev = practiceStats[id] ?? { attempts: 0, wins: 0 };
      const next = { ...practiceStats, [id]: { attempts: prev.attempts + 1, wins: prev.wins + 1 } };
      savePracticeStats(next);
      setPracticeStatsState(next);
      return { ...s, phase: "practice-result", lastResult: "win" };
    });
  }
  function handlePracticeFail() {
    play("fail");
    setState((s) => {
      if (!s.currentStage) return s;
      const id = s.currentStage.id;
      const prev = practiceStats[id] ?? { attempts: 0, wins: 0 };
      const next = { ...practiceStats, [id]: { attempts: prev.attempts + 1, wins: prev.wins } };
      savePracticeStats(next);
      setPracticeStatsState(next);
      return { ...s, phase: "practice-result", lastResult: "fail" };
    });
  }
  function toggleMute() {
    setMutedState((m) => !m);
  }

  function dismissPendingAchievement() {
    setPendingAchievements((prev) => prev.slice(1));
  }

  function setDifficulty(id: DifficultyId) {
    play("click");
    saveDifficulty(id);
    setState((s) => ({ ...s, difficulty: id }));
  }

  // ---- Routing ----
  if (state.phase === "pokedex") {
    return (
      <>
        <PokedexView
          pokedex={pokedex}
          onClose={closePokedex}
          achievements={achievements}
        />
        {pendingAchievements[0] && (
          <AchievementToast
            achievement={pendingAchievements[0]}
            onDone={dismissPendingAchievement}
          />
        )}
      </>
    );
  }

  if (state.phase === "daily-board") {
    const date = todayKey();
    return (
      <DailyLeaderboard
        date={date}
        yourEntry={dailyBest[date] ?? null}
        onStart={() => startGame(true)}
        onClose={closeDailyBoard}
      />
    );
  }

  if (state.phase === "practice-menu") {
    return (
      <>
        <PracticeMenu
          stats={practiceStats}
          onPick={startPracticeStage}
          onClose={closePractice}
        />
        {pendingAchievements[0] && (
          <AchievementToast
            achievement={pendingAchievements[0]}
            onDone={dismissPendingAchievement}
          />
        )}
      </>
    );
  }

  if (state.phase === "practice-play" || state.phase === "practice-result") {
    return (
      <PracticeStableView
        state={state}
        seed={seed}
        timerKey={timerKey}
        muted={muted}
        onWin={handlePracticeWin}
        onFail={handlePracticeFail}
        onExit={() => setState((s) => ({ ...s, phase: "practice-menu" }))}
        onToggleMute={toggleMute}
      />
    );
  }

  if (state.phase === "intro") {
    return (
      <>
        <IntroScreen
          highScore={state.highScore}
          pokedexCount={Object.keys(pokedex).length}
          achievementCount={Object.keys(achievements).length}
          muted={muted}
          difficulty={state.difficulty}
          onSetDifficulty={setDifficulty}
          onStart={() => startGame(false)}
          onOpenPokedex={openPokedex}
          onOpenDaily={openDailyBoard}
          onOpenPractice={openPractice}
          onToggleMute={toggleMute}
        />
        {pendingAchievements[0] && (
          <AchievementToast
            achievement={pendingAchievements[0]}
            onDone={dismissPendingAchievement}
          />
        )}
      </>
    );
  }

  if (state.phase === "gameover") {
    return (
      <>
        <GameOverScreen
          score={state.score}
          wave={state.wave}
          bestCombo={state.bestCombo}
          highScore={state.highScore}
          pokedexCount={Object.keys(pokedex).length}
          isDaily={state.isDaily}
          difficulty={state.difficulty}
          onRestart={() => startGame(state.isDaily)}
          onOpenPokedex={openPokedex}
          onOpenDaily={state.isDaily ? openDailyBoard : undefined}
          onHome={() => setState((s) => ({ ...s, phase: "intro" }))}
        />
        {pendingAchievements[0] && (
          <AchievementToast
            achievement={pendingAchievements[0]}
            onDone={dismissPendingAchievement}
          />
        )}
        {showCta && <SupportCta onDismiss={dismissCta} />}
      </>
    );
  }

  if (state.phase === "auction") {
    return (
      <>
        <AuctionView
          offers={state.auctionOffers}
          credits={state.credits}
          onBuy={handleAuctionBuy}
          onSkip={handleAuctionSkip}
        />
        {pendingAchievements[0] && (
          <AchievementToast
            achievement={pendingAchievements[0]}
            onDone={dismissPendingAchievement}
          />
        )}
      </>
    );
  }

  if (state.phase === "site-select") {
    // Highest unlocked wave: use highScore wave or current wave
    const highestWave = Math.max(state.wave, state.bestCombo, 0);
    return (
      <>
        <SiteMap
          highestWave={highestWave}
          currentSiteId={state.currentSiteId}
          onPick={handleSitePick}
          countdownSec={state.wave === 1 ? 6 : 4}
        />
        {pendingAchievements[0] && (
          <AchievementToast
            achievement={pendingAchievements[0]}
            onDone={dismissPendingAchievement}
          />
        )}
      </>
    );
  }

  return (
    <>
      <GameViewStable
        state={state}
        seed={seed}
        timerKey={timerKey}
        muted={muted}
        onWin={handleWin}
        onFail={handleFail}
        onToggleMute={toggleMute}
        onDismissTutorial={dismissTutorial}
      />
      {pendingAchievements[0] && (
        <AchievementToast
          achievement={pendingAchievements[0]}
          onDone={dismissPendingAchievement}
        />
      )}
    </>
  );
}

// Helper to generate daily opponents (mirror of DailyLeaderboard)
function generateDailyOpponents(date: string): { score: number }[] {
  const seed = seedFromString(date);
  let s = seed;
  const next = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  const out = [];
  for (let i = 0; i < 8; i++) {
    out.push({ score: 4000 + Math.floor(next() * 12000) });
  }
  return out;
}

function GameViewStable(props: {
  state: AppState;
  seed: number;
  timerKey: number;
  muted: boolean;
  onWin: () => void;
  onFail: () => void;
  onToggleMute: () => void;
  onDismissTutorial: () => void;
}) {
  const stableWin = useStableCallback(props.onWin);
  const stableFail = useStableCallback(props.onFail);
  return (
    <GameView
      state={props.state}
      seed={props.seed}
      timerKey={props.timerKey}
      muted={props.muted}
      onWin={stableWin}
      onFail={stableFail}
      onToggleMute={props.onToggleMute}
      onDismissTutorial={props.onDismissTutorial}
    />
  );
}

function IntroScreen({
  highScore,
  pokedexCount,
  achievementCount,
  muted,
  difficulty,
  onSetDifficulty,
  onStart,
  onOpenPokedex,
  onOpenDaily,
  onOpenPractice,
  onToggleMute,
}: {
  highScore: number;
  pokedexCount: number;
  achievementCount: number;
  muted: boolean;
  difficulty: DifficultyId;
  onSetDifficulty: (id: DifficultyId) => void;
  onStart: () => void;
  onOpenPokedex: () => void;
  onOpenDaily: () => void;
  onOpenPractice: () => void;
  onToggleMute: () => void;
}) {
  const def = difficultyDef(difficulty);
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center relative overflow-hidden p-8">
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="absolute rounded-full border border-cyan-400/10"
            style={{
              width: `${i * 320}px`,
              height: `${i * 320}px`,
              animation: `spin ${20 + i * 8}s linear infinite ${
                i % 2 === 0 ? "reverse" : ""
              }`,
            }}
          >
            <div
              className="absolute h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_16px_rgba(34,211,238,0.8)]"
              style={{ top: "-6px", left: "50%", transform: "translateX(-50%)" }}
            />
          </div>
        ))}
      </div>

      <button
        onClick={onToggleMute}
        className="absolute top-6 right-6 z-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full p-3 text-white/60"
        aria-label="toggle sound"
      >
        {muted ? <SpeakerMutedIcon large /> : <SpeakerIcon large />}
      </button>

      <div className="relative z-10 text-center max-w-3xl w-full">
        <p className="text-sm uppercase tracking-[0.5em] text-cyan-400/70 mb-6">
          Berkeley · 5000 sq ft · ~80 instruments
        </p>
        <h1 className="text-7xl sm:text-8xl font-light tracking-tight leading-[0.95]">
          Pipette<br />
          <span className="font-extrabold text-cyan-400">Rush</span>
        </h1>
        <p className="text-lg sm:text-xl text-white/55 mt-8 leading-relaxed max-w-2xl mx-auto">
          Run the eDNA pipeline as fast as the lab can throw it at you. Every
          robot is a different micro-game. Three misses and you contaminate the
          run.
        </p>

        <div className="mt-12 grid grid-cols-3 sm:grid-cols-6 gap-3 max-w-2xl mx-auto">
          {STAGES.map((s) => {
            const p = paletteFor(s);
            return (
              <div
                key={s.id}
                className={`rounded-lg border ${p.borderDim} bg-white/[0.02] p-3`}
              >
                <p className={`text-base font-mono font-bold ${p.text}`}>{s.code}</p>
                <p className="text-[11px] text-white/50 mt-1 uppercase tracking-widest truncate">
                  {s.verb}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-10">
          <p
            className="text-[10px] uppercase tracking-[0.4em] mb-3"
            style={{ color: def.hex, opacity: 0.8 }}
          >
            Difficulty · {def.name}
          </p>
          <div className="flex justify-center gap-1.5 flex-wrap">
            {DIFFICULTIES.map((d) => {
              const selected = d.id === difficulty;
              return (
                <button
                  key={d.id}
                  onClick={() => onSetDifficulty(d.id)}
                  className="px-3 py-2 rounded text-[11px] uppercase tracking-[0.2em] transition-all border"
                  style={{
                    color: selected ? "#0a0e1a" : d.hex,
                    background: selected ? d.hex : `${d.hex}10`,
                    borderColor: selected ? d.hex : `${d.hex}40`,
                    boxShadow: selected ? `0 0 18px ${d.hex}80` : "none",
                    fontWeight: selected ? 700 : 400,
                  }}
                >
                  {d.short}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-white/40 mt-2.5 max-w-md mx-auto leading-snug">
            {def.blurb}
          </p>
        </div>

        <button
          onClick={onStart}
          className="mt-8 bg-cyan-400 text-[#0a0e1a] font-bold px-16 py-5 rounded-lg hover:bg-cyan-300 transition-colors uppercase tracking-[0.3em] text-base shadow-[0_0_50px_rgba(34,211,238,0.5)]"
        >
          Begin Run
        </button>

        <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
          <button
            onClick={onOpenDaily}
            className="text-xs uppercase tracking-[0.3em] text-amber-300 hover:text-amber-200 px-6 py-3 border border-amber-300/40 hover:border-amber-300/80 rounded-lg"
          >
            ◇ Daily seed
          </button>
          <button
            onClick={onOpenPractice}
            className="text-xs uppercase tracking-[0.3em] text-white/70 hover:text-white px-6 py-3 border border-white/20 hover:border-white/40 rounded-lg"
          >
            ⏵ Practice
          </button>
        </div>

        <div className="mt-8 flex items-center justify-center gap-6 flex-wrap">
          <button
            onClick={onOpenPokedex}
            className="text-xs uppercase tracking-widest text-white/60 hover:text-cyan-400"
          >
            Pokedex · {pokedexCount}
          </button>
          {achievementCount > 0 && (
            <span className="text-xs font-mono text-amber-300/80 uppercase tracking-widest">
              ★ {achievementCount}
            </span>
          )}
          {highScore > 0 && (
            <span className="text-xs font-mono text-white/40 uppercase tracking-widest">
              best · {highScore.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function GameOverScreen({
  score,
  wave,
  bestCombo,
  highScore,
  pokedexCount,
  isDaily,
  difficulty,
  onRestart,
  onOpenPokedex,
  onOpenDaily,
  onHome,
}: {
  score: number;
  wave: number;
  bestCombo: number;
  highScore: number;
  pokedexCount: number;
  isDaily: boolean;
  difficulty: DifficultyId;
  onRestart: () => void;
  onOpenPokedex: () => void;
  onOpenDaily?: () => void;
  onHome: () => void;
}) {
  const isNewBest = !isDaily && score >= highScore && score > 0;
  const tier = difficultyDef(difficulty);
  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center p-6">
      <div className="text-center max-w-sm w-full">
        <p
          className={`text-[10px] uppercase tracking-[0.4em] mb-2 ${
            isDaily ? "text-amber-300/80" : "text-rose-400/80"
          }`}
        >
          {isDaily ? "Daily run complete" : `${tier.short} · run contaminated`}
        </p>
        <h1 className="text-3xl font-light">
          {isDaily ? "Submission saved" : "Pipeline halted"}
        </h1>

        <div className="mt-8 space-y-3">
          <div className="bg-white/[0.03] border border-white/10 rounded-lg p-5">
            <p className="text-[10px] uppercase tracking-widest text-white/50">
              Score
            </p>
            <p className="font-mono text-5xl font-light mt-1">
              {score.toLocaleString()}
            </p>
            {isNewBest && (
              <p className="text-[10px] font-mono text-amber-300 mt-2 uppercase tracking-widest">
                ★ new best
              </p>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Stat label="Wave" value={String(wave)} />
            <Stat label="Combo" value={`×${bestCombo}`} />
            <Stat
              label={isDaily ? "Daily" : "Best"}
              value={isDaily ? "✓" : highScore.toLocaleString()}
            />
          </div>
        </div>

        <button
          onClick={onRestart}
          className="mt-8 bg-cyan-400 text-[#0a0e1a] font-bold px-10 py-3 rounded hover:bg-cyan-300 transition-colors uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(34,211,238,0.4)]"
        >
          {isDaily ? "Try Again" : "New Run"}
        </button>

        <div className="mt-4 flex justify-center gap-4 text-[10px] uppercase tracking-widest text-white/60">
          {isDaily && onOpenDaily && (
            <button onClick={onOpenDaily} className="hover:text-amber-300">
              View board
            </button>
          )}
          <button onClick={onOpenPokedex} className="hover:text-cyan-400">
            Pokedex · {pokedexCount}
          </button>
          <button onClick={onHome} className="hover:text-white">
            ← Home
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/10 rounded p-2">
      <p className="text-[9px] uppercase tracking-widest text-white/40">
        {label}
      </p>
      <p className="font-mono text-sm mt-0.5">{value}</p>
    </div>
  );
}

function GameView({
  state,
  seed,
  timerKey,
  muted,
  onWin,
  onFail,
  onToggleMute,
  onDismissTutorial,
}: {
  state: AppState;
  seed: number;
  timerKey: number;
  muted: boolean;
  onWin: () => void;
  onFail: () => void;
  onToggleMute: () => void;
  onDismissTutorial: () => void;
}) {
  const stage = state.currentStage!;
  const palette = paletteFor(stage);
  const site = SITES.find((s) => s.id === state.currentSiteId) ?? SITES[0];
  const duration = durationForWave(
    state.wave,
    state.upgrades.slowWaves,
    site.difficulty,
    state.isBossWave,
    state.difficulty
  );
  const showTutorial =
    state.showTutorial &&
    state.wave === 1 &&
    state.phase === "playing" &&
    stage.id === "kingfisher";

  const maxLives = 3 + state.upgrades.extraLife;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex flex-col">
      <Hud
        state={state}
        site={site}
        maxLives={maxLives}
        muted={muted}
        onToggleMute={onToggleMute}
      />

      <div className="flex-1 relative">
        {state.phase === "stage-intro" && (
          <StageIntro
            stage={stage}
            wave={state.wave}
            isBoss={state.isBossWave}
            bossProgress={state.bossProgress}
            bossTotal={state.bossChain.length}
          />
        )}
        {state.phase === "playing" && !showTutorial && (
          <>
            <TimerBar key={timerKey} duration={duration} hex={palette.hex} />
            <div className="absolute inset-0 pt-3">
              <CurrentMicroGame
                key={timerKey}
                stage={stage}
                duration={duration}
                seed={seed}
                onSuccess={onWin}
                onFail={onFail}
              />
            </div>
            {state.isBossWave && (
              <BossOverlay
                progress={state.bossProgress}
                total={state.bossChain.length}
              />
            )}
          </>
        )}
        {state.phase === "playing" && showTutorial && (
          <TutorialOverlay onDismiss={onDismissTutorial} />
        )}
        {state.phase === "result" && (
          <ResultOverlay
            result={state.lastResult!}
            newSpecies={state.newSpecies}
            isBossWin={state.lastResult === "win" && state.isBossWave}
          />
        )}
      </div>
    </div>
  );
}

function Hud({
  state,
  site,
  maxLives,
  muted,
  onToggleMute,
}: {
  state: AppState;
  site: SiteDef;
  maxLives: number;
  muted: boolean;
  onToggleMute: () => void;
}) {
  return (
    <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
      <div className="flex items-center gap-4">
        <div>
          <p className="text-[9px] uppercase tracking-widest text-white/40">Wave</p>
          <p className="font-mono text-lg flex items-center gap-1.5">
            {state.wave}
            {state.isBossWave && (
              <span className="text-[10px] uppercase tracking-widest text-rose-400 px-1.5 py-0.5 rounded bg-rose-400/15 border border-rose-400/40">
                Boss
              </span>
            )}
          </p>
        </div>
        <div>
          <p className="text-[9px] uppercase tracking-widest text-white/40">Score</p>
          <p className="font-mono text-lg">{state.score.toLocaleString()}</p>
        </div>
        {state.credits > 0 && (
          <div>
            <p className="text-[9px] uppercase tracking-widest text-white/40">
              Credits
            </p>
            <p className="font-mono text-sm text-cyan-400">{state.credits}c</p>
          </div>
        )}
        <div className="hidden sm:block">
          <p className="text-[9px] uppercase tracking-widest text-white/40">
            Site
          </p>
          <p
            className="font-mono text-xs"
            style={{ color: site.color }}
          >
            {site.short}
          </p>
        </div>
        {state.isDaily && (
          <div className="text-amber-300">
            <p className="text-[9px] uppercase tracking-widest opacity-70">Mode</p>
            <p className="font-mono text-xs">◇ Daily</p>
          </div>
        )}
        <div>
          <p className="text-[9px] uppercase tracking-widest text-white/40">Tier</p>
          <p
            className="font-mono text-xs"
            style={{ color: difficultyDef(state.difficulty).hex }}
          >
            {difficultyDef(state.difficulty).short}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {state.combo > 1 && (
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-widest text-amber-300/70">
              combo
            </p>
            <p className="font-mono text-lg text-amber-300">×{state.combo}</p>
          </div>
        )}
        <div className="flex gap-1.5">
          {Array.from({ length: maxLives }).map((_, i) => (
            <div
              key={i}
              className={`h-2.5 w-2.5 rounded-full ${
                i < state.lives
                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"
                  : "bg-white/10"
              }`}
            />
          ))}
        </div>
        <button
          onClick={onToggleMute}
          className="text-white/40 hover:text-white/80 ml-1"
          aria-label="toggle sound"
        >
          {muted ? <SpeakerMutedIcon small /> : <SpeakerIcon small />}
        </button>
      </div>
    </div>
  );
}

function StageIntro({
  stage,
  wave,
  isBoss,
  bossProgress,
  bossTotal,
}: {
  stage: StageDef;
  wave: number;
  isBoss: boolean;
  bossProgress: number;
  bossTotal: number;
}) {
  const p = paletteFor(stage);
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center animate-[fadeIn_0.2s_ease-out]">
      {isBoss && bossProgress === 0 && (
        <div className="mb-5 text-center">
          <p className="text-[10px] uppercase tracking-[0.5em] text-rose-400 animate-pulse mb-2">
            ⚠ Boss wave
          </p>
          <p className="text-3xl font-light text-rose-300">Triple chain</p>
          <p className="text-xs text-white/50 mt-1">
            Clear three pipelines without contamination
          </p>
        </div>
      )}
      <p className={`text-[10px] uppercase tracking-[0.4em] ${p.textDim} mb-2`}>
        {isBoss ? `Stage ${bossProgress + 1} / ${bossTotal}` : `Wave ${wave}`}
      </p>
      <div
        className={`h-20 w-20 rounded-lg ${p.bgDim} border-2 ${p.border} flex items-center justify-center mb-4 shadow-[0_0_40px_var(--glow)]`}
        style={{ ["--glow" as string]: p.hex + "55" }}
      >
        <p className={`font-mono text-3xl font-bold ${p.text}`}>{stage.code}</p>
      </div>
      <p className="text-2xl font-light">{stage.name}</p>
      <p className="text-sm text-white/50 mt-1">{stage.prompt}</p>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}

function BossOverlay({ progress, total }: { progress: number; total: number }) {
  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-rose-400/10 border border-rose-400/40 rounded-full px-3 py-1">
      <p className="text-[10px] uppercase tracking-widest text-rose-300">boss</p>
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 w-5 rounded-full ${
              i < progress
                ? "bg-rose-300"
                : i === progress
                ? "bg-rose-400 animate-pulse"
                : "bg-white/15"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function TimerBar({ duration, hex }: { duration: number; hex: string }) {
  return (
    <>
      <div className="h-1 bg-white/5 overflow-hidden relative">
        <div
          className="h-full origin-left"
          style={{
            backgroundColor: hex,
            boxShadow: `0 0 12px ${hex}`,
            animation: `shrink ${duration}ms linear forwards`,
          }}
        />
      </div>
      <style>{`
        @keyframes shrink { from { transform: scaleX(1); } to { transform: scaleX(0); } }
      `}</style>
    </>
  );
}

function ResultOverlay({
  result,
  newSpecies,
  isBossWin,
}: {
  result: "win" | "fail";
  newSpecies: Species | null;
  isBossWin: boolean;
}) {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e1a]/85 backdrop-blur-sm z-50">
      <div className="text-center animate-[pop_0.3s_ease-out]">
        {result === "win" ? (
          <>
            {isBossWin ? (
              <>
                <p className="text-5xl">▣</p>
                <p className="text-rose-300 mt-2 text-sm uppercase tracking-[0.3em]">
                  boss cleared
                </p>
              </>
            ) : (
              <>
                <p className="text-6xl">✓</p>
                <p className="text-emerald-400 mt-2 text-sm uppercase tracking-[0.3em]">
                  clean read
                </p>
              </>
            )}
            {newSpecies && (
              <div
                className="mt-5 mx-auto inline-flex flex-col items-center gap-1 px-5 py-3 rounded-lg border animate-[fadeIn_0.4s_ease-out]"
                style={{
                  borderColor: `${RARITY_COLOR[newSpecies.rarity]}80`,
                  background: `${RARITY_COLOR[newSpecies.rarity]}15`,
                  boxShadow: `0 0 30px ${RARITY_GLOW[newSpecies.rarity]}`,
                }}
              >
                <p
                  className="text-[10px] uppercase tracking-[0.3em]"
                  style={{ color: RARITY_COLOR[newSpecies.rarity] }}
                >
                  {newSpecies.rarity} discovery
                </p>
                <p className="text-base font-light">{newSpecies.name}</p>
                <p className="text-[11px] italic text-white/50">
                  {newSpecies.latin}
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            <p className="text-6xl text-rose-400">✕</p>
            <p className="text-rose-400 mt-2 text-sm uppercase tracking-[0.3em]">
              contaminated
            </p>
          </>
        )}
      </div>
      <style>{`
        @keyframes pop { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}

function CurrentMicroGame({
  stage,
  ...props
}: { stage: StageDef } & MicroGameProps) {
  switch (stage.id) {
    case "kingfisher":
      return <KingFisherGame {...props} />;
    case "qiagility":
      return <QIAgilityGame {...props} />;
    case "thermal":
      return <ThermalCyclerGame {...props} />;
    case "lightcycler":
      return <LightCyclerGame {...props} />;
    case "promethion":
      return <PromethionGame {...props} />;
    case "scanner":
      return <DiversityScannerGame {...props} />;
    case "vacuum":
      return <VacuumPumpGame {...props} />;
    case "minicentri":
      return <MiniCentrifugeGame {...props} />;
    case "allegra":
      return <AllegraGame {...props} />;
    case "uvstrat":
      return <UVStratalinkerGame {...props} />;
    case "vortex":
      return <VortexGame {...props} />;
    case "spectro":
      return <SpectroGame {...props} />;
    case "qubit":
      return <QubitGame {...props} />;
    case "speedvac":
      return <SpeedVacGame {...props} />;
    case "qiaxcel":
      return <QIAxcelGame {...props} />;
    case "gel":
      return <GelGame {...props} />;
    case "glovebox":
      return <GloveBoxGame {...props} />;
    case "microplate":
      return <MicroplateGame {...props} />;
    default:
      return <PlaceholderGame stage={stage} {...props} />;
  }
}

function PlaceholderGame({
  stage,
  duration,
  onSuccess,
  onFail,
}: { stage: StageDef } & MicroGameProps) {
  const p = paletteFor(stage);
  const completedRef = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!completedRef.current) {
        completedRef.current = true;
        onFail();
      }
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onFail]);

  function handleClick() {
    if (completedRef.current) return;
    completedRef.current = true;
    onSuccess();
  }

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
      <p className={`text-[10px] uppercase tracking-[0.3em] ${p.textDim} mb-2`}>
        {stage.name}
      </p>
      <p className="text-white/60 text-sm mb-6">{stage.prompt}</p>
      <button
        onClick={handleClick}
        className={`${p.bg} text-[#0a0e1a] font-bold px-12 py-4 rounded text-sm uppercase tracking-widest`}
      >
        Tap to pass
      </button>
    </div>
  );
}

function PracticeStableView(props: {
  state: AppState;
  seed: number;
  timerKey: number;
  muted: boolean;
  onWin: () => void;
  onFail: () => void;
  onExit: () => void;
  onToggleMute: () => void;
}) {
  const stableWin = useStableCallback(props.onWin);
  const stableFail = useStableCallback(props.onFail);
  return (
    <PracticeView
      state={props.state}
      seed={props.seed}
      timerKey={props.timerKey}
      muted={props.muted}
      onWin={stableWin}
      onFail={stableFail}
      onExit={props.onExit}
      onToggleMute={props.onToggleMute}
    />
  );
}

function PracticeView({
  state,
  seed,
  timerKey,
  muted,
  onWin,
  onFail,
  onExit,
  onToggleMute,
}: {
  state: AppState;
  seed: number;
  timerKey: number;
  muted: boolean;
  onWin: () => void;
  onFail: () => void;
  onExit: () => void;
  onToggleMute: () => void;
}) {
  const stage = state.currentStage!;
  const palette = paletteFor(stage);
  // Generous duration for practice — wave 1 difficulty
  const duration = 5500;

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex flex-col">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              play("click");
              onExit();
            }}
            className="text-[10px] uppercase tracking-widest text-white/60 hover:text-white"
          >
            ← Exit
          </button>
          <div
            className={`h-7 w-7 rounded ${palette.bgDim} border ${palette.border} flex items-center justify-center`}
          >
            <p className={`font-mono text-[10px] font-bold ${palette.text}`}>
              {stage.code}
            </p>
          </div>
          <div>
            <p className="text-[9px] uppercase tracking-widest text-white/40">
              Practice
            </p>
            <p className="font-mono text-sm">{stage.name}</p>
          </div>
        </div>
        <button
          onClick={onToggleMute}
          className="text-white/40 hover:text-white/80"
          aria-label="toggle sound"
        >
          {muted ? <SpeakerMutedIcon small /> : <SpeakerIcon small />}
        </button>
      </div>

      <div className="flex-1 relative">
        {state.phase === "practice-play" && (
          <>
            <TimerBar key={timerKey} duration={duration} hex={palette.hex} />
            <div className="absolute inset-0 pt-3">
              <CurrentMicroGame
                key={timerKey}
                stage={stage}
                duration={duration}
                seed={seed}
                onSuccess={onWin}
                onFail={onFail}
              />
            </div>
          </>
        )}
        {state.phase === "practice-result" && (
          <ResultOverlay
            result={state.lastResult!}
            newSpecies={null}
            isBossWin={false}
          />
        )}
      </div>
    </div>
  );
}

function SpeakerIcon({ small, large }: { small?: boolean; large?: boolean }) {
  const sz = small ? 14 : large ? 24 : 18;
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function SpeakerMutedIcon({ small, large }: { small?: boolean; large?: boolean }) {
  const sz = small ? 14 : large ? 24 : 18;
  return (
    <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="22" y1="9" x2="16" y2="15" />
      <line x1="16" y1="9" x2="22" y2="15" />
    </svg>
  );
}

export default App;
