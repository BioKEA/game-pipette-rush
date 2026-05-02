import { useEffect, useState } from "react";
import type { UpgradeDef, UpgradeId } from "@/types/upgrades";
import { play } from "@/lib/audio";

interface Props {
  offers: UpgradeDef[];
  credits: number;
  onBuy: (id: UpgradeId) => void;
  onSkip: () => void;
}

export function AuctionView({ offers, credits, onBuy, onSkip }: Props) {
  const [purchased, setPurchased] = useState<UpgradeId | null>(null);
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    if (purchased) return;
    if (countdown <= 0) {
      onSkip();
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, purchased, onSkip]);

  function handleBuy(id: UpgradeId) {
    if (purchased) return;
    play("purchase");
    setPurchased(id);
    setTimeout(() => onBuy(id), 600);
  }

  function handleSkip() {
    if (purchased) return;
    play("click");
    onSkip();
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-5">
          <p className="text-[10px] uppercase tracking-[0.4em] text-amber-300 mb-2 animate-pulse">
            ⚠ Bay Area biotech auction
          </p>
          <h1 className="text-2xl font-light">Surplus Lot</h1>
          <p className="text-xs text-white/40 mt-1 font-mono">
            {countdown}s · ~90% off retail
          </p>
        </div>

        <div className="space-y-2 mb-5">
          {offers.map((offer) => {
            const canAfford = credits >= offer.basePrice;
            const isPurchased = purchased === offer.id;
            const isOther = purchased && purchased !== offer.id;
            return (
              <button
                key={offer.id}
                onClick={() => canAfford && handleBuy(offer.id)}
                disabled={!canAfford || !!purchased}
                className={`w-full text-left rounded p-3 border transition-all ${
                  isPurchased
                    ? "border-amber-300 bg-amber-300/15 scale-95"
                    : isOther
                    ? "border-white/5 bg-white/[0.02] opacity-30"
                    : canAfford
                    ? "border-amber-300/40 bg-amber-300/5 hover:bg-amber-300/10 hover:border-amber-300/70"
                    : "border-white/5 bg-white/[0.02] opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{offer.equipment}</p>
                    <p className="text-[10px] text-white/40 font-mono mt-0.5">
                      {offer.retailPrice}
                    </p>
                    <p className="text-xs text-white/60 mt-1.5">
                      {offer.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-amber-300 font-mono text-base">
                      {offer.basePrice}c
                    </p>
                    <p
                      className={`text-[10px] font-mono mt-0.5 uppercase tracking-widest ${
                        canAfford ? "text-emerald-400" : "text-rose-400/60"
                      }`}
                    >
                      {offer.effectLabel}
                    </p>
                  </div>
                </div>
                {isPurchased && (
                  <p className="text-[10px] text-amber-300 mt-2 font-mono uppercase tracking-widest">
                    ✓ won at auction
                  </p>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-white/50 font-mono">
            credits <span className="text-cyan-400">{credits}c</span>
          </p>
          <button
            onClick={handleSkip}
            disabled={!!purchased}
            className="text-[10px] uppercase tracking-widest text-white/50 hover:text-white px-3 py-1.5 disabled:opacity-30"
          >
            Skip · continue run
          </button>
        </div>
      </div>
    </div>
  );
}
