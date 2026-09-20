'use client';

/**
 * Tiny Web Audio synthesiser for UI feedback.
 *
 * Synthesised rather than shipped as files: three sound effects would other-
 * wise cost ~60 KB of assets and a network round trip at the exact moment the
 * learner is waiting for feedback. These fire in well under a frame.
 */

let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

interface NoteOpts {
  freq: number;
  start: number;
  duration: number;
  gain?: number;
  type?: OscillatorType;
}

function note(ac: AudioContext, { freq, start, duration, gain = 0.12, type = 'sine' }: NoteOpts) {
  const osc = ac.createOscillator();
  const env = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ac.currentTime + start);

  // Short attack, exponential release — avoids the click of a hard gate.
  env.gain.setValueAtTime(0.0001, ac.currentTime + start);
  env.gain.exponentialRampToValueAtTime(gain, ac.currentTime + start + 0.012);
  env.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + duration);

  osc.connect(env).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + duration + 0.02);
}

/** Rising major triad — the "you found it" chime. */
export function playCorrect() {
  const ac = audio();
  if (!ac) return;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    note(ac, { freq: f, start: i * 0.055, duration: 0.28, gain: 0.1 }),
  );
}

/** Soft minor second — corrective, deliberately not harsh. */
export function playWrong() {
  const ac = audio();
  if (!ac) return;
  note(ac, { freq: 233.08, start: 0, duration: 0.22, gain: 0.09, type: 'triangle' });
  note(ac, { freq: 207.65, start: 0.09, duration: 0.26, gain: 0.08, type: 'triangle' });
}

/** Neutral tick for navigation and word selection. */
export function playTick() {
  const ac = audio();
  if (!ac) return;
  note(ac, { freq: 880, start: 0, duration: 0.06, gain: 0.04 });
}

/** Fanfare for finishing a quiz or a curriculum day. */
export function playFanfare() {
  const ac = audio();
  if (!ac) return;
  [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) =>
    note(ac, { freq: f, start: i * 0.08, duration: 0.45, gain: 0.09 }),
  );
}
