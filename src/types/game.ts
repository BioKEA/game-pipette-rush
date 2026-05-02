export type StageId =
  | "kingfisher"
  | "qiagility"
  | "thermal"
  | "lightcycler"
  | "promethion"
  | "scanner"
  | "vacuum"
  | "minicentri"
  | "allegra"
  | "uvstrat"
  | "vortex"
  | "spectro"
  | "qubit"
  | "speedvac"
  | "qiaxcel"
  | "gel"
  | "glovebox"
  | "microplate";

export interface StageDef {
  id: StageId;
  code: string;
  name: string;
  verb: string;
  prompt: string;
  color: string;
  glow: string;
}

export const STAGES: StageDef[] = [
  {
    id: "kingfisher",
    code: "KF",
    name: "KingFisher Flex",
    verb: "Extract",
    prompt: "Lift the magnetic beads",
    color: "cyan",
    glow: "rgba(34,211,238,0.7)",
  },
  {
    id: "qiagility",
    code: "QA",
    name: "QIAgility",
    verb: "Pipette",
    prompt: "Dispense into the lit well",
    color: "emerald",
    glow: "rgba(52,211,153,0.7)",
  },
  {
    id: "thermal",
    code: "TC",
    name: "Bio-Rad S1000",
    verb: "Cycle",
    prompt: "Tap on each temperature mark",
    color: "orange",
    glow: "rgba(251,146,60,0.7)",
  },
  {
    id: "lightcycler",
    code: "LC",
    name: "LightCycler 480",
    verb: "Quantify",
    prompt: "Tap as the curve crosses",
    color: "violet",
    glow: "rgba(167,139,250,0.7)",
  },
  {
    id: "promethion",
    code: "P2",
    name: "Promethion 2",
    verb: "Sequence",
    prompt: "Match each base as it lands",
    color: "amber",
    glow: "rgba(252,211,77,0.7)",
  },
  {
    id: "scanner",
    code: "DS",
    name: "DiversityScanner",
    verb: "Identify",
    prompt: "Click the diagnostic feature",
    color: "rose",
    glow: "rgba(253,164,175,0.7)",
  },
  {
    id: "vacuum",
    code: "VP",
    name: "Gast Vacuum Pump",
    verb: "Evacuate",
    prompt: "Mash to drop pressure",
    color: "sky",
    glow: "rgba(56,189,248,0.7)",
  },
  {
    id: "minicentri",
    code: "MC",
    name: "Corning Mini Centrifuge",
    verb: "Spin",
    prompt: "Hold the lid — release at the chime",
    color: "fuchsia",
    glow: "rgba(232,121,249,0.7)",
  },
  {
    id: "allegra",
    code: "AC",
    name: "Allegra 6R",
    verb: "Balance",
    prompt: "Place tubes to balance the rotor",
    color: "lime",
    glow: "rgba(163,230,53,0.7)",
  },
  {
    id: "uvstrat",
    code: "UV",
    name: "UV Stratalinker 2400",
    verb: "Crosslink",
    prompt: "Zap when the dose is in range",
    color: "indigo",
    glow: "rgba(129,140,248,0.7)",
  },
  {
    id: "vortex",
    code: "VX",
    name: "Vortex-Genie 2",
    verb: "Mix",
    prompt: "Wiggle the mouse to shake",
    color: "yellow",
    glow: "rgba(253,224,71,0.7)",
  },
  {
    id: "spectro",
    code: "SP",
    name: "Ultrospec 2100 Pro",
    verb: "Scan",
    prompt: "Track the absorbance peak",
    color: "pink",
    glow: "rgba(244,114,182,0.7)",
  },
  {
    id: "qubit",
    code: "QB",
    name: "Qubit 4 Fluorometer",
    verb: "Quantitate",
    prompt: "Repeat the fluorescence sequence",
    color: "red",
    glow: "rgba(248,113,113,0.7)",
  },
  {
    id: "speedvac",
    code: "SV",
    name: "Savant SpeedVac",
    verb: "Concentrate",
    prompt: "Stop the volume at each marker",
    color: "teal",
    glow: "rgba(45,212,191,0.7)",
  },
  {
    id: "qiaxcel",
    code: "QX",
    name: "QIAxcel Capillary",
    verb: "Resolve",
    prompt: "Match the unknown band pattern",
    color: "green",
    glow: "rgba(74,222,128,0.7)",
  },
  {
    id: "gel",
    code: "GE",
    name: "Owl Gel Rig",
    verb: "Load",
    prompt: "Drop each sample into its colored well",
    color: "stone",
    glow: "rgba(214,211,209,0.7)",
  },
  {
    id: "glovebox",
    code: "GB",
    name: "Cleatech Glove Box",
    verb: "Manipulate",
    prompt: "Drag the sample to the target — gloves lag",
    color: "slate",
    glow: "rgba(203,213,225,0.7)",
  },
  {
    id: "microplate",
    code: "MP",
    name: "FilterMax F3",
    verb: "Read",
    prompt: "Click the brightest well",
    color: "blue",
    glow: "rgba(96,165,250,0.7)",
  },
];

export type GamePhase = "intro" | "stage-intro" | "playing" | "result" | "gameover";

export interface GameState {
  phase: GamePhase;
  wave: number;
  score: number;
  lives: number;
  combo: number;
  bestCombo: number;
  speed: number;
  currentStage: StageDef | null;
  lastResult: "win" | "fail" | null;
  highScore: number;
}
