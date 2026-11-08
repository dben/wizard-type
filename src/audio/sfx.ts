/**
 * Tiny synthesized sound effects (no audio files). Soft and short on purpose:
 * kids hear these hundreds of times per lesson.
 */
let ctx: AudioContext | null = null;
let enabled = true;

export const setSound = (on: boolean) => (enabled = on);

function audio(): AudioContext | null {
  if (!enabled) return null;
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, start: number, dur: number, type: OscillatorType = 'sine', vol = 0.12, slide = 0) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + start;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

function noise(start: number, dur: number, vol = 0.15, freq = 900) {
  const a = audio();
  if (!a) return;
  const t = a.currentTime + start;
  const buf = a.createBuffer(1, Math.ceil(a.sampleRate * dur), a.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
  const src = a.createBufferSource();
  src.buffer = buf;
  const f = a.createBiquadFilter();
  f.type = 'lowpass';
  f.frequency.value = freq;
  const g = a.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(a.destination);
  src.start(t);
}

const NOTES = [523, 587, 659, 784, 880, 1047];

export const sfx = {
  key: (i = 0) => tone(NOTES[i % NOTES.length] * 2, 0, 0.06, 'triangle', 0.035),
  cast: (power = 1) => {
    [0, 0.05, 0.1, 0.15].forEach((s, i) => tone(NOTES[i + 1] * (power < 1 ? 0.8 : 1), s, 0.18, 'triangle', 0.08));
  },
  poof: () => {
    noise(0, 0.35, 0.22, 700);
    tone(300, 0, 0.3, 'sine', 0.06, 0.4);
  },
  oops: () => tone(220, 0, 0.12, 'square', 0.03, 0.7),
  erase: () => tone(400, 0, 0.05, 'triangle', 0.03, 0.8),
  coin: () => {
    tone(988, 0, 0.08, 'square', 0.05);
    tone(1319, 0.07, 0.18, 'square', 0.05);
  },
  star: (n = 0) => tone([784, 988, 1175][n] ?? 1175, 0, 0.35, 'triangle', 0.1),
  win: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, 'triangle', 0.09)),
  click: () => tone(660, 0, 0.04, 'triangle', 0.05),
  buy: () => [784, 1047, 1319].forEach((f, i) => tone(f, i * 0.07, 0.15, 'square', 0.04)),
};
