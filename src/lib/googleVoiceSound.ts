/**
 * Google Voice Mode Sound Synthesizer (Web Audio API)
 * Replicates the authentic Google Assistant / Gemini Voice Mode start, finish, and prompt audio earcons.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!audioCtx && AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch (e) {
    console.warn('Web Audio API not supported or blocked:', e);
    return null;
  }
}

/**
 * Plays the iconic Google Voice Mode activation chime (Start listening).
 * Multi-tone uplifting warm chime (Google harmonic signature: C5 -> E5 -> G5 -> C6).
 */
export function playGoogleVoiceStartSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  // Master Gain for smooth volume control
  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.28, now);
  masterGain.connect(ctx.destination);

  // Google Voice Mode Chord: C5 (523.25Hz), E5 (659.25Hz), G5 (783.99Hz), C6 (1046.50Hz)
  const notes = [
    { freq: 523.25, time: 0.00, duration: 0.22, vol: 0.45 }, // Google Blue (C5)
    { freq: 659.25, time: 0.06, duration: 0.22, vol: 0.50 }, // Google Red (E5)
    { freq: 783.99, time: 0.12, duration: 0.25, vol: 0.55 }, // Google Yellow (G5)
    { freq: 1046.5, time: 0.18, duration: 0.38, vol: 0.70 }, // Google Green (C6)
  ];

  notes.forEach((note) => {
    // Primary Tone (Sine for pure warm Google earcon bell)
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.freq, now + note.time);

    // Warmth harmonic overtone (subtle 2nd harmonic)
    const overtone = ctx.createOscillator();
    overtone.type = 'sine';
    overtone.frequency.setValueAtTime(note.freq * 2, now + note.time);

    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, now + note.time);
    // Smooth attack
    noteGain.gain.exponentialRampToValueAtTime(note.vol, now + note.time + 0.018);
    // Natural exponential chime decay
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.duration);

    const overtoneGain = ctx.createGain();
    overtoneGain.gain.setValueAtTime(0.0001, now + note.time);
    overtoneGain.gain.exponentialRampToValueAtTime(note.vol * 0.15, now + note.time + 0.015);
    overtoneGain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.duration * 0.7);

    osc.connect(noteGain);
    overtone.connect(overtoneGain);
    noteGain.connect(masterGain);
    overtoneGain.connect(masterGain);

    osc.start(now + note.time);
    overtone.start(now + note.time);
    osc.stop(now + note.time + note.duration + 0.05);
    overtone.stop(now + note.time + note.duration + 0.05);
  });
}

/**
 * Plays the Google Voice Mode recognition complete / stop listening chime.
 * Soft dual-tone resolve (G5 -> C5 gentle completion ping).
 */
export function playGoogleVoiceStopSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.24, now);
  masterGain.connect(ctx.destination);

  const notes = [
    { freq: 880.00, time: 0.00, duration: 0.18, vol: 0.55 }, // A5
    { freq: 659.25, time: 0.08, duration: 0.28, vol: 0.65 }, // E5
  ];

  notes.forEach((note) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.freq, now + note.time);

    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, now + note.time);
    noteGain.gain.exponentialRampToValueAtTime(note.vol, now + note.time + 0.015);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.duration);

    osc.connect(noteGain);
    noteGain.connect(masterGain);

    osc.start(now + note.time);
    osc.stop(now + note.time + note.duration + 0.05);
  });
}

/**
 * Plays the Google Voice Mode error / cancel sound.
 * Subtle low descending dual ping.
 */
export function playGoogleVoiceErrorSound(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.20, now);
  masterGain.connect(ctx.destination);

  const notes = [
    { freq: 392.00, time: 0.00, duration: 0.16, vol: 0.45 }, // G4
    { freq: 311.13, time: 0.10, duration: 0.22, vol: 0.40 }, // Eb4
  ];

  notes.forEach((note) => {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(note.freq, now + note.time);

    const noteGain = ctx.createGain();
    noteGain.gain.setValueAtTime(0.0001, now + note.time);
    noteGain.gain.exponentialRampToValueAtTime(note.vol, now + note.time + 0.015);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + note.time + note.duration);

    osc.connect(noteGain);
    noteGain.connect(masterGain);

    osc.start(now + note.time);
    osc.stop(now + note.time + note.duration + 0.05);
  });
}
