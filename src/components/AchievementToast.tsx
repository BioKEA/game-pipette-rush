import { useEffect } from "react";
import type { AchievementDef } from "@/types/achievements";

interface Props {
  achievement: AchievementDef;
  onDone: () => void;
}

export function AchievementToast({ achievement, onDone }: Props) {
  useEffect(() => {
    const t = setTimeout(onDone, 3200);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] pointer-events-none animate-[slideDown_0.4s_ease-out]"
      style={{ minWidth: "280px" }}
    >
      <div className="bg-amber-300/15 border border-amber-300 rounded-lg backdrop-blur-md px-4 py-3 shadow-[0_0_30px_rgba(252,211,77,0.6)]">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-300 text-[#0a0e1a] flex items-center justify-center text-lg font-bold shrink-0">
            {achievement.glyph}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-300/80">
              Achievement
            </p>
            <p className="text-white font-medium leading-tight">
              {achievement.title}
            </p>
            <p className="text-white/60 text-xs mt-0.5">{achievement.desc}</p>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
