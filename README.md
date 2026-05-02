# Pipette Rush

Run the eDNA pipeline as fast as the lab can throw it at you — eighteen lab-instrument micro-games, three lives before contamination. A BioKEA game.

> **Status:** private beta. Public release pending.

![Pipette Rush gameplay](docs/screenshot.png)
<!-- TODO: drop a real screenshot or gif at docs/screenshot.png before going public -->

## The science angle

Each micro-game maps to a real piece of bench kit — KingFisher extractions, QIAgility plating, thermal cyclers, Promethion sequencing, Qubit fluorometry, gel imaging, glove-box work — strung together the way an environmental-DNA pipeline actually runs. Surviving sample-collection sites award species discoveries (a field pokedex of real taxa), and bosses chain three instruments back-to-back without contamination. Pipette Rush is part of [BioKEA](https://biokea.ai)'s push to make modern wet-lab and bioinformatics workflows feel intuitive to anyone who has never set foot in a 5,000-square-foot Berkeley lab.

## Play

- **Campaign** — pick a sample site, clear waves of randomized instrument micro-games, three misses contaminates the run.
- **Boss waves** — periodic three-stage chains worth triple score; one fail ends the boss but not the run.
- **Auctions** — between waves, spend credits on upgrades (extra lives, score multiplier, slower waves, second flow cell, combo boost).
- **Daily** — one seeded run per day, fixed Grad difficulty, scored against a generated opponent ladder.
- **Practice** — drill any unlocked instrument at a forgiving fixed duration.
- **Difficulty tiers** — pick a tier on the intro screen; tiers scale wave speed, starting lives, auction frequency, and score multiplier.
- **Pokedex + achievements** — track species, stage wins, sites visited, boss runs, daily podiums.

### Controls

- **Mouse / touch** — every micro-game is click or tap; specific instruments use drag, multi-tap, or timing-based clicks.
- **Mute** — speaker toggle in the top-right corner of the intro and HUD.
- **Difficulty / mode buttons** — on the intro screen.

(No keyboard shortcuts; everything routes through on-screen UI.)

## Tech

- React 18 + TypeScript + Vite 6
- Tailwind CSS + shadcn / Radix primitives for UI
- `@tanstack/react-query`, `react-hook-form`, `zod`, `recharts`, `sonner`
- Supabase JS client (optional — used only if env vars are set)
- Bun as package manager

## Local dev

```bash
bun install
bun run dev      # http://localhost:5173
bun run build    # production build into dist/
```

Optional Supabase backend (the app silently no-ops without these):

```bash
cp .env.example .env   # then fill in:
# VITE_SUPABASE_URL=...
# VITE_SUPABASE_PUBLISHABLE_KEY=...
```

The app reads these via `import.meta.env`; no keys are committed.

## License

MIT — see [LICENSE](LICENSE).

---

Made by [BioKEA](https://biokea.ai).
