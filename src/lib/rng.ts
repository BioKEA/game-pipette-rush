let _rng: () => number = Math.random;
let _seeded = false;

export function setSeed(seed: number) {
  _rng = mulberry32(seed);
  _seeded = true;
}

export function clearSeed() {
  _rng = Math.random;
  _seeded = false;
}

export function isSeeded(): boolean {
  return _seeded;
}

export function rng(): number {
  return _rng();
}

export function pickInt(max: number): number {
  return Math.floor(rng() * max);
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seedFromString(s: string): number {
  let hash = 5381;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) + hash) ^ s.charCodeAt(i);
  }
  return Math.abs(hash) || 1;
}
