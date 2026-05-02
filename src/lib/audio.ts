type SoundId =
  | "click"
  | "hit"
  | "miss"
  | "win"
  | "fail"
  | "discover"
  | "rare-discover"
  | "auction"
  | "purchase"
  | "gameover"
  | "lift";

let ctx: AudioContext | null = null;
let muted = false;
let masterGain: GainNode | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new Ctor();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.4;
      masterGain.connect(ctx.destination);
    } catch {
      ctx = null;
    }
  }
  return ctx;
}

export function setMuted(m: boolean) {
  muted = m;
  if (masterGain) masterGain.gain.value = m ? 0 : 0.4;
}

export function isMuted(): boolean {
  return muted;
}

export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === "suspended") c.resume();
}

interface Tone {
  freq: number;
  start: number;
  duration: number;
  type?: OscillatorType;
  gain?: number;
  glide?: number;
}

function playTone(t: Tone) {
  const c = getCtx();
  if (!c || muted || !masterGain) return;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = t.type ?? "sine";
  const startTime = c.currentTime + t.start;
  osc.frequency.setValueAtTime(t.freq, startTime);
  if (t.glide !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(
      Math.max(20, t.glide),
      startTime + t.duration
    );
  }
  const peakGain = t.gain ?? 0.3;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + t.duration);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(startTime);
  osc.stop(startTime + t.duration + 0.05);
}

function playNoise(start: number, duration: number, gainAmt: number, filterFreq: number) {
  const c = getCtx();
  if (!c || muted || !masterGain) return;
  const buffer = c.createBuffer(1, c.sampleRate * duration, c.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
  }
  const src = c.createBufferSource();
  src.buffer = buffer;
  const filter = c.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = filterFreq;
  const gain = c.createGain();
  const startTime = c.currentTime + start;
  gain.gain.setValueAtTime(gainAmt, startTime);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  src.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);
  src.start(startTime);
  src.stop(startTime + duration + 0.05);
}

export function play(id: SoundId) {
  if (muted) return;
  switch (id) {
    case "click":
      playTone({ freq: 880, start: 0, duration: 0.05, type: "square", gain: 0.08 });
      break;
    case "hit":
      playTone({ freq: 660, start: 0, duration: 0.08, type: "triangle", gain: 0.16 });
      playTone({ freq: 990, start: 0.02, duration: 0.1, type: "sine", gain: 0.14 });
      break;
    case "miss":
      playTone({ freq: 220, start: 0, duration: 0.12, type: "sawtooth", gain: 0.14, glide: 130 });
      break;
    case "lift":
      playTone({ freq: 440, start: 0, duration: 0.15, type: "sine", gain: 0.18, glide: 880 });
      break;
    case "win":
      playTone({ freq: 523, start: 0, duration: 0.1, type: "triangle", gain: 0.18 });
      playTone({ freq: 659, start: 0.08, duration: 0.1, type: "triangle", gain: 0.18 });
      playTone({ freq: 784, start: 0.16, duration: 0.16, type: "triangle", gain: 0.2 });
      break;
    case "fail":
      playTone({ freq: 392, start: 0, duration: 0.18, type: "sawtooth", gain: 0.16, glide: 196 });
      break;
    case "discover":
      playTone({ freq: 880, start: 0, duration: 0.1, type: "sine", gain: 0.18 });
      playTone({ freq: 1175, start: 0.06, duration: 0.12, type: "sine", gain: 0.18 });
      playTone({ freq: 1568, start: 0.14, duration: 0.18, type: "sine", gain: 0.22 });
      break;
    case "rare-discover":
      playTone({ freq: 523, start: 0, duration: 0.12, type: "sine", gain: 0.18 });
      playTone({ freq: 784, start: 0.08, duration: 0.12, type: "sine", gain: 0.2 });
      playTone({ freq: 1047, start: 0.18, duration: 0.14, type: "sine", gain: 0.22 });
      playTone({ freq: 1568, start: 0.3, duration: 0.3, type: "triangle", gain: 0.26 });
      playTone({ freq: 2093, start: 0.32, duration: 0.4, type: "sine", gain: 0.18 });
      break;
    case "auction":
      playTone({ freq: 1318, start: 0, duration: 0.1, type: "sine", gain: 0.18 });
      playTone({ freq: 1760, start: 0.1, duration: 0.18, type: "sine", gain: 0.16 });
      break;
    case "purchase":
      playTone({ freq: 988, start: 0, duration: 0.08, type: "triangle", gain: 0.18 });
      playTone({ freq: 1318, start: 0.06, duration: 0.1, type: "triangle", gain: 0.2 });
      playTone({ freq: 1976, start: 0.14, duration: 0.14, type: "sine", gain: 0.16 });
      break;
    case "gameover":
      playTone({ freq: 392, start: 0, duration: 0.3, type: "sawtooth", gain: 0.18 });
      playTone({ freq: 311, start: 0.2, duration: 0.4, type: "sawtooth", gain: 0.18 });
      playNoise(0.5, 0.5, 0.08, 800);
      break;
  }
}
