interface Props {
  onDismiss: () => void;
}

export function TutorialOverlay({ onDismiss }: Props) {
  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
      style={{ background: "radial-gradient(circle at 50% 65%, transparent 0, rgba(10,14,26,0.85) 60%)" }}
    >
      <div className="text-center max-w-xs px-6 pointer-events-auto">
        <div className="mb-3 flex justify-center">
          <div className="relative">
            <div className="h-12 w-12 rounded-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] animate-pulse" />
            <svg
              className="absolute -top-12 left-1/2 -translate-x-1/2"
              width="36"
              height="48"
              viewBox="0 0 36 48"
            >
              <path
                d="M 18 4 L 18 40 M 8 14 L 18 4 L 28 14"
                stroke="#22d3ee"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        <p className="text-[10px] uppercase tracking-[0.3em] text-cyan-400 mb-2">
          How to play
        </p>
        <p className="text-white text-base leading-relaxed">
          Drag a glowing bead{" "}
          <span className="text-cyan-400 font-semibold">upward</span> to lift it.
        </p>
        <p className="text-white/60 text-xs mt-2">
          Each robot is a different micro-game. The prompt at the top tells you
          what to do.
        </p>

        <button
          onClick={onDismiss}
          className="mt-5 bg-cyan-400 text-[#0a0e1a] font-bold px-8 py-2.5 rounded text-xs uppercase tracking-widest hover:bg-cyan-300"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
