"use client";

// ─── Procedural Audio Engine v2 ───────────────────────────────────────
// 30+ unique sounds, all generated via Web Audio API.

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let ambientGain: GainNode | null = null;
let isMuted = false;

function getCtx(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.35;
    masterGain.connect(audioCtx.destination);
    musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.12;
    musicGain.connect(masterGain);
    sfxGain = audioCtx.createGain();
    sfxGain.gain.value = 0.45;
    sfxGain.connect(masterGain);
    ambientGain = audioCtx.createGain();
    ambientGain.gain.value = 0.1;
    ambientGain.connect(masterGain);
  }
  if (audioCtx.state === "suspended") audioCtx.resume();
  return audioCtx;
}

function sg() { getCtx(); return sfxGain!; }
function mg() { getCtx(); return musicGain!; }
function ag() { getCtx(); return ambientGain!; }

// ─── Notes ────────────────────────────────────────────────────────────
const N = {
  C3:130.81,D3:146.83,E3:164.81,F3:174.61,G3:196,A3:220,B3:246.94,
  C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392,A4:440,B4:493.88,
  C5:523.25,D5:587.33,E5:659.25,F5:698.46,G5:783.99,A5:880,
};

// ─── Helpers ──────────────────────────────────────────────────────────
function osc(ctx: AudioContext, type: OscillatorType, freq: number, start: number, dur: number) {
  const o = ctx.createOscillator();
  o.type = type;
  o.frequency.value = freq;
  o.start(ctx.currentTime + start);
  o.stop(ctx.currentTime + start + dur);
  return o;
}

function gain(ctx: AudioContext, val: number, start: number, dur: number, node?: AudioNode) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(val, ctx.currentTime + start);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
  if (node) node.connect(g);
  g.connect(sg());
  return g;
}

function noise(ctx: AudioContext, dur: number, filter?: number) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  if (filter) {
    const f = ctx.createBiquadFilter();
    f.type = "lowpass";
    f.frequency.value = filter;
    src.connect(f);
    return { src, filterNode: f };
  }
  return { src };
}

function playChord(ctx: AudioContext, freqs: number[], type: OscillatorType, start: number, dur: number, vol: number) {
  freqs.forEach(f => {
    const o = osc(ctx, type, f, start, dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime + start);
    g.gain.linearRampToValueAtTime(vol / freqs.length, ctx.currentTime + start + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + dur);
    o.connect(g);
    g.connect(sg());
  });
}

function playArp(ctx: AudioContext, freqs: number[], type: OscillatorType, gap: number, vol: number) {
  freqs.forEach((f, i) => {
    const o = osc(ctx, type, f, i * gap, gap + 0.3);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime + i * gap);
    g.gain.linearRampToValueAtTime(vol, ctx.currentTime + i * gap + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * gap + gap + 0.3);
    o.connect(g);
    g.connect(sg());
  });
}

// ─── 30+ Sound Effects ────────────────────────────────────────────────

// 1. Click (generic tap)
export function playClick() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 900, 0, 0.06);
  gain(ctx, 0.25, 0, 0.06, o);
}

// 2. Jump (rising pop)
export function playJump() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 250, 0, 0.18);
  o.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.12);
  gain(ctx, 0.2, 0, 0.18, o);
  // Wing snap
  const o2 = osc(ctx, "triangle", 1200, 0.05, 0.04);
  gain(ctx, 0.12, 0.05, 0.04, o2);
}

// 3. Wind gust
export function playWind() {
  const ctx = getCtx();
  const { src, filterNode } = noise(ctx, 0.6, 600);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.12, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.15);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
  if (filterNode) filterNode.connect(g); else src.connect(g);
  g.connect(sg());
  src.start(ctx.currentTime);
}

// 4. Shatter (crash)
export function playShatter() {
  const ctx = getCtx();
  // Impact
  const o1 = osc(ctx, "square", 180, 0, 0.12);
  gain(ctx, 0.2, 0, 0.12, o1);
  // Debris
  for (let i = 0; i < 6; i++) {
    const o = osc(ctx, "square", 200 + Math.random() * 600, i * 0.025, 0.12);
    gain(ctx, 0.1, i * 0.025, 0.12, o);
  }
  // Noise burst
  const { src } = noise(ctx, 0.2);
  gain(ctx, 0.15, 0, 0.2, src);
  src.start(ctx.currentTime);
}

// 5. Collect (magic chime)
export function playCollect() {
  const ctx = getCtx();
  playArp(ctx, [N.E4, N.G4, N.B4, N.E5], "sine", 0.07, 0.18);
}

// 6. Toggle (mechanical click)
export function playToggle() {
  const ctx = getCtx();
  const o1 = osc(ctx, "square", 600, 0, 0.03);
  gain(ctx, 0.15, 0, 0.03, o1);
  const o2 = osc(ctx, "sine", 300, 0.02, 0.04);
  gain(ctx, 0.1, 0.02, 0.04, o2);
}

// 7. Row (splash)
export function playRow() {
  const ctx = getCtx();
  const { src } = noise(ctx, 0.3, 1200);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.1, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.05);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  src.connect(g);
  g.connect(sg());
  src.start(ctx.currentTime);
  // Water drip
  const o = osc(ctx, "sine", 400, 0.15, 0.1);
  o.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.25);
  gain(ctx, 0.08, 0.15, 0.1, o);
}

// 8. Celebrate (fanfare)
export function playCelebrate() {
  const ctx = getCtx();
  playArp(ctx, [N.C5, N.E5, N.G5, N.C5, N.E5, N.G5], "sine", 0.1, 0.15);
  // Sparkle
  for (let i = 0; i < 4; i++) {
    const o = osc(ctx, "sine", 1200 + i * 300, 0.5 + i * 0.08, 0.15);
    gain(ctx, 0.06, 0.5 + i * 0.08, 0.15, o);
  }
}

// 9. Pendulum (whoosh)
export function playPendulum() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 200, 0, 0.35);
  o.frequency.setValueAtTime(200, ctx.currentTime);
  o.frequency.linearRampToValueAtTime(350, ctx.currentTime + 0.15);
  o.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.35);
  gain(ctx, 0.12, 0, 0.35, o);
}

// 10. Secret (mystical reveal)
export function playSecret() {
  const ctx = getCtx();
  playChord(ctx, [N.E4, N.G4, N.B4], "sine", 0, 1.2, 0.2);
  playArp(ctx, [N.E5, N.G5, N.B4, N.E5], "sine", 0.12, 0.12);
}

// 11. Butterfly (flutter)
export function playButterfly() {
  const ctx = getCtx();
  for (let i = 0; i < 5; i++) {
    const o = osc(ctx, "sine", 900 + i * 150 + Math.random() * 200, i * 0.04, 0.06);
    gain(ctx, 0.06, i * 0.04, 0.06, o);
  }
}

// 12. Beat advance (page turn)
export function playBeatAdvance() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 500, 0, 0.12);
  o.frequency.exponentialRampToValueAtTime(750, ctx.currentTime + 0.08);
  gain(ctx, 0.12, 0, 0.12, o);
  // Paper rustle
  const { src } = noise(ctx, 0.08, 2000);
  gain(ctx, 0.05, 0, 0.08, src);
  src.start(ctx.currentTime);
}

// 13. Act transition (orchestral swell)
export function playActTransition() {
  const ctx = getCtx();
  playChord(ctx, [N.C4, N.E4, N.G4, N.C5], "sine", 0, 2, 0.15);
  playChord(ctx, [N.C4, N.E4, N.G4, N.C5], "triangle", 0.3, 1.5, 0.08);
}

// 14. Lore collect (ancient chime)
export function playLoreCollect() {
  const ctx = getCtx();
  playArp(ctx, [N.A4, N.C5, N.E5, N.A5], "triangle", 0.12, 0.15);
  // Resonance
  const o = osc(ctx, "sine", N.A4 * 2, 0.4, 1.5);
  gain(ctx, 0.04, 0.4, 1.5, o);
}

// 15. Critter find (cute chirp)
export function playCritterFind() {
  const ctx = getCtx();
  playArp(ctx, [N.E5, N.G5, N.E5, N.C5, N.E5], "sine", 0.06, 0.12);
}

// 16. Hover (subtle tone)
export function playHover() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 600, 0, 0.08);
  gain(ctx, 0.06, 0, 0.08, o);
}

// 17. Hover enter (rising chirp)
export function playHoverIn() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 400, 0, 0.1);
  o.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.08);
  gain(ctx, 0.08, 0, 0.1, o);
}

// 18. Hover exit (falling chirp)
export function playHoverOut() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 700, 0, 0.08);
  o.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
  gain(ctx, 0.06, 0, 0.08, o);
}

// 19. Paper fold (crisp)
export function playPaperFold() {
  const ctx = getCtx();
  const { src } = noise(ctx, 0.12, 3000);
  gain(ctx, 0.1, 0, 0.12, src);
  src.start(ctx.currentTime);
  const o = osc(ctx, "triangle", 500, 0, 0.06);
  gain(ctx, 0.08, 0, 0.06, o);
}

// 20. Paper unfold (spreading)
export function playPaperUnfold() {
  const ctx = getCtx();
  const { src } = noise(ctx, 0.2, 1500);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.08);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  src.connect(g);
  g.connect(sg());
  src.start(ctx.currentTime);
}

// 21. Water splash
export function playSplash() {
  const ctx = getCtx();
  const { src } = noise(ctx, 0.4, 800);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.15, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  src.connect(g);
  g.connect(sg());
  src.start(ctx.currentTime);
  // Bubble
  const o = osc(ctx, "sine", 300, 0.1, 0.15);
  o.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.25);
  gain(ctx, 0.08, 0.1, 0.15, o);
}

// 22. Thunder
export function playThunder() {
  const ctx = getCtx();
  const { src } = noise(ctx, 1.5, 200);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.2, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.1);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
  src.connect(g);
  g.connect(sg());
  src.start(ctx.currentTime);
  // Low rumble
  const o = osc(ctx, "sine", 60, 0, 1.5);
  gain(ctx, 0.1, 0, 1.5, o);
}

// 23. Rain
export function playRain() {
  const ctx = getCtx();
  const { src } = noise(ctx, 0.8, 400);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.06, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
  src.connect(g);
  g.connect(sg());
  src.start(ctx.currentTime);
}

// 24. Bird chirp
export function playBirdChirp() {
  const ctx = getCtx();
  const freq = 1800 + Math.random() * 800;
  const o = osc(ctx, "sine", freq, 0, 0.12);
  o.frequency.setValueAtTime(freq, ctx.currentTime);
  o.frequency.linearRampToValueAtTime(freq * 1.3, ctx.currentTime + 0.04);
  o.frequency.linearRampToValueAtTime(freq * 0.9, ctx.currentTime + 0.08);
  o.frequency.linearRampToValueAtTime(freq * 1.1, ctx.currentTime + 0.12);
  gain(ctx, 0.06, 0, 0.12, o);
}

// 25. Camera swoosh
export function playSwoosh() {
  const ctx = getCtx();
  const { src } = noise(ctx, 0.3, 2000);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  src.connect(g);
  g.connect(sg());
  src.start(ctx.currentTime);
}

// 26. UI open
export function playUIOpen() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 400, 0, 0.1);
  o.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);
  gain(ctx, 0.1, 0, 0.1, o);
}

// 27. UI close
export function playUIClose() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 800, 0, 0.1);
  o.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.08);
  gain(ctx, 0.1, 0, 0.1, o);
}

// 28. Success (ding)
export function playSuccess() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", N.D5, 0, 0.5);
  gain(ctx, 0.15, 0, 0.5, o);
  const o2 = osc(ctx, "sine", N.F5, 0.1, 0.4);
  gain(ctx, 0.1, 0.1, 0.4, o2);
}

// 29. Error (buzz)
export function playError() {
  const ctx = getCtx();
  const o = osc(ctx, "square", 150, 0, 0.15);
  gain(ctx, 0.1, 0, 0.15, o);
}

// 30. Key press (typewriter)
export function playKeypress() {
  const ctx = getCtx();
  const o = osc(ctx, "square", 800 + Math.random() * 400, 0, 0.02);
  gain(ctx, 0.05, 0, 0.02, o);
}

// 31. Secret word typed (triumphant)
export function playSecretWord() {
  const ctx = getCtx();
  playArp(ctx, [N.C4, N.E4, N.G4, N.C5, N.E5], "sine", 0.08, 0.18);
  playChord(ctx, [N.C5, N.E5, N.G5], "triangle", 0.45, 1, 0.1);
}

// 32. Interaction start (anticipation)
export function playInteractStart() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 300, 0, 0.15);
  o.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.12);
  gain(ctx, 0.1, 0, 0.15, o);
}

// 33. Interaction complete (reward)
export function playInteractComplete() {
  const ctx = getCtx();
  playArp(ctx, [N.G4, N.B4, N.D5, N.G5], "sine", 0.08, 0.15);
}

// ─── Background Music ─────────────────────────────────────────────────

type Mood = "warm" | "storm" | "calm" | "secret" | "sorrow" | "hope" | "final";

const MOOD_CONFIG: Record<Mood, { scale: number[]; type: OscillatorType; interval: number; ambientType: string }> = {
  warm:   { scale: [N.C4, N.E4, N.G4, N.A4, N.C5], type: "sine", interval: 1800, ambientType: "birds" },
  storm:  { scale: [N.D3, N.F3, N.A3, N.C4, N.D4], type: "sawtooth", interval: 700, ambientType: "rain" },
  calm:   { scale: [N.G3, N.B3, N.D4, N.G4, N.A4], type: "sine", interval: 2200, ambientType: "wind" },
  secret: { scale: [N.E3, N.G3, N.B3, N.D4, N.E4], type: "sine", interval: 2000, ambientType: "shimmer" },
  sorrow: { scale: [N.A3, N.C4, N.E4, N.F4, N.A4], type: "triangle", interval: 2500, ambientType: "drone" },
  hope:   { scale: [N.C4, N.E4, N.G4, N.B4, N.C5], type: "sine", interval: 1600, ambientType: "warm" },
  final:  { scale: [N.C4, N.E4, N.G4, N.C5, N.E5], type: "sine", interval: 1400, ambientType: "ethereal" },
};

let musicInterval: ReturnType<typeof setInterval> | null = null;
let currentMoodPlaying: Mood | null = null;
let musicNoteIndex = 0;

export function startMusic(mood: Mood) {
  if (currentMoodPlaying === mood) return;
  stopMusic();
  currentMoodPlaying = mood;
  const ctx = getCtx();
  const cfg = MOOD_CONFIG[mood];
  musicNoteIndex = 0;

  function playNote() {
    if (isMuted || !currentMoodPlaying) return;
    const freq = cfg.scale[musicNoteIndex % cfg.scale.length];
    musicNoteIndex++;
    const o = osc(ctx, cfg.type, freq * (Math.random() > 0.7 ? 0.5 : 1), 0, 1.8);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.4);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.8);
    o.connect(g);
    g.connect(mg());
    // Sometimes add harmony
    if (Math.random() > 0.6) {
      const freq2 = cfg.scale[(musicNoteIndex + 2) % cfg.scale.length] * 0.5;
      const o2 = osc(ctx, "sine", freq2, 0.2, 1.5);
      const g2 = ctx.createGain();
      g2.gain.setValueAtTime(0, ctx.currentTime + 0.2);
      g2.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.5);
      g2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.7);
      o2.connect(g2);
      g2.connect(mg());
    }
  }

  playNote();
  musicInterval = setInterval(playNote, cfg.interval);
}

export function stopMusic() {
  if (musicInterval) { clearInterval(musicInterval); musicInterval = null; }
  currentMoodPlaying = null;
}

// ─── Ambient Layers ───────────────────────────────────────────────────

let ambientInterval: ReturnType<typeof setInterval> | null = null;
let ambientTimeouts: ReturnType<typeof setTimeout>[] = [];

function clearAmbient() {
  if (ambientInterval) { clearInterval(ambientInterval); ambientInterval = null; }
  ambientTimeouts.forEach(clearTimeout);
  ambientTimeouts = [];
}

export function startAmbient(mood: Mood) {
  clearAmbient();
  const ctx = getCtx();
  const cfg = MOOD_CONFIG[mood];

  function tick() {
    if (isMuted) return;
    switch (cfg.ambientType) {
      case "rain": {
        const { src } = noise(ctx, 0.5, 500);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.04, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        src.connect(g); g.connect(ag()); src.start(ctx.currentTime);
        if (Math.random() > 0.85) {
          const t = setTimeout(() => {
            if (isMuted) return;
            playThunder();
          }, Math.random() * 3000);
          ambientTimeouts.push(t);
        }
        break;
      }
      case "birds": {
        if (Math.random() > 0.5) {
          const t = setTimeout(() => {
            if (isMuted) return;
            playBirdChirp();
          }, Math.random() * 800);
          ambientTimeouts.push(t);
        }
        break;
      }
      case "wind": {
        const { src, filterNode } = noise(ctx, 2, 300);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 0.8);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
        if (filterNode) filterNode.connect(g); else src.connect(g);
        g.connect(ag()); src.start(ctx.currentTime);
        break;
      }
      case "shimmer": {
        const freqs = [N.E5, N.G5, N.B4, N.D5];
        const f = freqs[Math.floor(Math.random() * freqs.length)];
        const o = osc(ctx, "sine", f, 0, 1.5);
        gain(ctx, 0.015, 0, 1.5, o);
        // Re-route to ambient
        o.disconnect();
        const g = ctx.createGain();
        g.gain.value = 0.015;
        o.connect(g); g.connect(ag());
        break;
      }
      case "drone": {
        const o = osc(ctx, "sine", N.A3 * 0.5, 0, 3);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 1);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 3);
        o.connect(g); g.connect(ag());
        break;
      }
      case "warm": {
        const o = osc(ctx, "sine", N.C4, 0, 2);
        const g = ctx.createGain();
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.02, ctx.currentTime + 0.5);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2);
        o.connect(g); g.connect(ag());
        break;
      }
      case "ethereal": {
        const chord = [N.C5, N.E5, N.G5];
        chord.forEach((f, i) => {
          const o = osc(ctx, "sine", f, i * 0.3, 2);
          const g = ctx.createGain();
          g.gain.setValueAtTime(0, ctx.currentTime + i * 0.3);
          g.gain.linearRampToValueAtTime(0.015, ctx.currentTime + i * 0.3 + 0.3);
          g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.3 + 2);
          o.connect(g); g.connect(ag());
        });
        break;
      }
    }
  }

  tick();
  ambientInterval = setInterval(tick, cfg.ambientType === "rain" ? 400 : cfg.ambientType === "birds" ? 1200 : 2500);
}

export function stopAmbient() { clearAmbient(); }

// ─── Controls ─────────────────────────────────────────────────────────

export function setMuted(muted: boolean) {
  isMuted = muted;
  if (masterGain) masterGain.gain.value = muted ? 0 : 0.35;
}

export function initAudio() { getCtx(); }

// ─── Event Wiring ─────────────────────────────────────────────────────

export function setupAudioEvents() {
  if (typeof window === "undefined") return;
  const on = (e: string, fn: () => void) => window.addEventListener(e, fn);
  on("milo-jump", playJump);
  on("collect-leaf", playCollect);
  on("toggle-cell", playToggle);
  on("row-boat", playRow);
  on("celebrate", playCelebrate);
  on("follow-butterfly", playButterfly);
  on("shatter", playShatter);
  on("pendulum-push", playPendulum);
  on("critter-found", playCritterFind);
  on("secret-found", playSecretWord);
  on("lore-collected", playLoreCollect);
  on("beat-advance", playBeatAdvance);
  on("act-transition", playActTransition);
  on("set-wind-force", playWind);
  on("paper-shower", playCollect);
  on("fold-crease", playPaperFold);
  on("hover-in", playHoverIn);
  on("hover-out", playHoverOut);
  on("ui-open", playUIOpen);
  on("ui-close", playUIClose);
  on("interaction-start", playInteractStart);
  on("interaction-complete", playInteractComplete);
  on("camera-swoosh", playSwoosh);
  on("splash", playSplash);
  on("success", playSuccess);
  on("error", playError);
}
