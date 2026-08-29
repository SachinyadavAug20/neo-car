"use client";

// ─── Procedural Audio Engine v4 ───────────────────────────────────────
// 110 unique sounds, all generated via Web Audio API.

import { type Mood } from "./narrative";

let audioCtx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let musicGain: GainNode | null = null;
let sfxGain: GainNode | null = null;
let ambientGain: GainNode | null = null;
let analyserNode: AnalyserNode | null = null;
let freqDataArray: Uint8Array | null = null;
let isMuted = false;

function getCtx(): AudioContext {
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioCtxClass();
    masterGain = audioCtx.createGain();
    masterGain.gain.value = 0.35;

    analyserNode = audioCtx.createAnalyser();
    analyserNode.fftSize = 64;
    analyserNode.smoothingTimeConstant = 0.8;
    freqDataArray = new Uint8Array(analyserNode.frequencyBinCount);

    masterGain.connect(analyserNode);
    analyserNode.connect(audioCtx.destination);

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

export function getAudioFrequencyData(): Uint8Array | null {
  if (!analyserNode || !freqDataArray) return null;
  analyserNode.getByteFrequencyData(freqDataArray as unknown as Uint8Array<ArrayBuffer>);
  return freqDataArray;
}

function sg() { getCtx(); return sfxGain!; }
function mg() { getCtx(); return musicGain!; }
function ag() { getCtx(); return ambientGain!; }

// ─── Notes ────────────────────────────────────────────────────────────
const N = {
  C3:130.81,D3:146.83,E3:164.81,F3:174.61,G3:196,A3:220,B3:246.94,
  C4:261.63,D4:293.66,E4:329.63,F4:349.23,G4:392,A4:440,B4:493.88,
  C5:523.25,D5:587.33,E5:659.25,F5:698.46,G5:783.99,A5:880,B5:987.77,
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

// 34. Button click (crisp UI tap)
export function playButtonTap() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 1200, 0, 0.04);
  gain(ctx, 0.18, 0, 0.04, o);
  const o2 = osc(ctx, "triangle", 2400, 0.01, 0.02);
  gain(ctx, 0.08, 0.01, 0.02, o2);
}

// 35. Button hover (soft tick)
export function playButtonHover() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 800, 0, 0.03);
  gain(ctx, 0.06, 0, 0.03, o);
}

// 36. Toggle on (rising ding)
export function playToggleOn() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 600, 0, 0.15);
  o.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
  gain(ctx, 0.18, 0, 0.15, o);
  const o2 = osc(ctx, "sine", 1200, 0.08, 0.12);
  gain(ctx, 0.1, 0.08, 0.12, o2);
}

// 37. Toggle off (falling tone)
export function playToggleOff() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 1000, 0, 0.12);
  o.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.1);
  gain(ctx, 0.15, 0, 0.12, o);
}

// 38. Leaf rustle (dry whisper)
export function playLeafRustle() {
  const ctx = getCtx();
  const { src, filterNode } = noise(ctx, 0.25, 4000);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 0.04);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
  if (filterNode) filterNode.connect(g); else src.connect(g);
  g.connect(sg());
  src.start(ctx.currentTime);
}

// 39. Water droplet (plop)
export function playWaterDrop() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 1200, 0, 0.15);
  o.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.12);
  gain(ctx, 0.14, 0, 0.15, o);
  const o2 = osc(ctx, "sine", 600, 0.04, 0.1);
  gain(ctx, 0.06, 0.04, 0.1, o2);
}

// 40. Wind chime (bright tinkle)
export function playWindChime() {
  const ctx = getCtx();
  const chimes = [N.E5, N.G5, N.A5, N.C5, N.E5];
  chimes.forEach((f, i) => {
    const o = osc(ctx, "sine", f * (1 + Math.random() * 0.02), i * 0.12, 0.8);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
    g.gain.linearRampToValueAtTime(0.06, ctx.currentTime + i * 0.12 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.8);
    o.connect(g);
    g.connect(sg());
  });
}

// 41. Crumple paper (crunch)
export function playCrumple() {
  const ctx = getCtx();
  for (let i = 0; i < 8; i++) {
    const { src, filterNode } = noise(ctx, 0.06, 2000 + Math.random() * 3000);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.03);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.03 + 0.06);
    if (filterNode) filterNode.connect(g); else src.connect(g);
    g.connect(sg());
    src.start(ctx.currentTime + i * 0.03);
  }
}

// 42. Paper tear (rip)
export function playTear() {
  const ctx = getCtx();
  const { src, filterNode } = noise(ctx, 0.3, 2500);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.18, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.22, ctx.currentTime + 0.05);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  if (filterNode) filterNode.connect(g); else src.connect(g);
  g.connect(sg());
  src.start(ctx.currentTime);
  // High freq accent
  const o = osc(ctx, "sawtooth", 3000, 0, 0.15);
  gain(ctx, 0.04, 0, 0.15, o);
}

// 43. Paper slide (swish)
export function playSlide() {
  const ctx = getCtx();
  const { src, filterNode } = noise(ctx, 0.2, 3500);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.1, ctx.currentTime + 0.06);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  if (filterNode) filterNode.connect(g); else src.connect(g);
  g.connect(sg());
  src.start(ctx.currentTime);
}

// 44. Wonder / Awe (ethereal swell)
export function playWonder() {
  const ctx = getCtx();
  playChord(ctx, [N.C4, N.E4, N.G4, N.C5], "sine", 0, 1.2, 0.08);
  playArp(ctx, [N.E5, N.G5, N.C5, N.E5], "sine", 0.2, 0.06);
}

// 45. Discovery (sparkle cascade)
export function playDiscovery() {
  const ctx = getCtx();
  const notes = [N.C5, N.E5, N.G5, N.C5, N.E5, N.G5, N.C5];
  notes.forEach((f, i) => {
    const o = osc(ctx, "sine", f + Math.random() * 10, i * 0.06, 0.4);
    gain(ctx, 0.07, i * 0.06, 0.4, o);
  });
}

// 46. Joy (happy bounce)
export function playJoy() {
  const ctx = getCtx();
  const o = osc(ctx, "triangle", 400, 0, 0.12);
  o.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.06);
  gain(ctx, 0.15, 0, 0.12, o);
  const o2 = osc(ctx, "sine", 1000, 0.12, 0.1);
  o2.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.18);
  gain(ctx, 0.12, 0.12, 0.1, o2);
  const o3 = osc(ctx, "sine", 1600, 0.22, 0.15);
  gain(ctx, 0.1, 0.22, 0.15, o3);
}

// 47. Sorrow (mournful tone)
export function playSorrow() {
  const ctx = getCtx();
  const o = osc(ctx, "triangle", N.A4, 0, 0.8);
  o.frequency.linearRampToValueAtTime(N.A3, ctx.currentTime + 0.8);
  gain(ctx, 0.12, 0, 0.8, o);
  const o2 = osc(ctx, "sine", N.C4, 0.1, 0.6);
  gain(ctx, 0.06, 0.1, 0.6, o2);
}

// 48. Footstep (soft tap)
export function playFootstep() {
  const ctx = getCtx();
  const { src, filterNode } = noise(ctx, 0.08, 800);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.15, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
  if (filterNode) filterNode.connect(g); else src.connect(g);
  g.connect(sg());
  src.start(ctx.currentTime);
  const o = osc(ctx, "sine", 100, 0, 0.06);
  gain(ctx, 0.08, 0, 0.06, o);
}

// 49. Whoosh fast (quick pass)
export function playWhooshFast() {
  const ctx = getCtx();
  const { src, filterNode } = noise(ctx, 0.15, 2000);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.04);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  if (filterNode) filterNode.connect(g); else src.connect(g);
  g.connect(sg());
  src.start(ctx.currentTime);
}

// 50. Coin collect (classic ding)
export function playCoinCollect() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", N.B5, 0, 0.2);
  gain(ctx, 0.18, 0, 0.2, o);
  const o2 = osc(ctx, "sine", N.E5 * 2, 0.05, 0.15);
  gain(ctx, 0.12, 0.05, 0.15, o2);
}

// 51. Star collect (twinkle)
export function playStarCollect() {
  const ctx = getCtx();
  playArp(ctx, [N.C5, N.E5, N.G5, N.C5 * 2], "sine", 0.05, 0.1);
  const { src } = noise(ctx, 0.4, 6000);
  gain(ctx, 0.03, 0, 0.4, src);
}

// 52. Gem collect (crystalline)
export function playGemCollect() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 1760, 0, 0.3);
  o.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.1);
  gain(ctx, 0.15, 0, 0.3, o);
  const o2 = osc(ctx, "triangle", 2640, 0.02, 0.2);
  gain(ctx, 0.08, 0.02, 0.2, o2);
}

// 53. Notification (gentle ping)
export function playNotification() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 880, 0, 0.2);
  gain(ctx, 0.12, 0, 0.2, o);
  const o2 = osc(ctx, "sine", 1100, 0.15, 0.15);
  gain(ctx, 0.08, 0.15, 0.15, o2);
}

// 54. Error buzz (low buzz)
export function playErrorBuzz() {
  const ctx = getCtx();
  const o = osc(ctx, "sawtooth", 80, 0, 0.2);
  gain(ctx, 0.1, 0, 0.2, o);
  const o2 = osc(ctx, "square", 120, 0, 0.15);
  gain(ctx, 0.06, 0, 0.15, o2);
}

// 55. Page turn (flip)
export function playPageTurn() {
  const ctx = getCtx();
  const { src, filterNode } = noise(ctx, 0.12, 5000);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  if (filterNode) filterNode.connect(g); else src.connect(g);
  g.connect(sg());
  src.start(ctx.currentTime);
}

// 56. Compass point (needle click)
export function playCompassClick() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 2000, 0, 0.02);
  gain(ctx, 0.15, 0, 0.02, o);
  const o2 = osc(ctx, "triangle", 3000, 0.015, 0.015);
  gain(ctx, 0.08, 0.015, 0.015, o2);
}

// 57. Map pin (drop)
export function playMapPin() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 800, 0, 0.1);
  o.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.08);
  gain(ctx, 0.14, 0, 0.1, o);
  const { src, filterNode } = noise(ctx, 0.06, 1000);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.08, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
  if (filterNode) filterNode.connect(g); else src.connect(g);
  g.connect(sg());
  src.start(ctx.currentTime);
}

// 58. Scroll (soft drag)
export function playScroll() {
  const ctx = getCtx();
  const { src, filterNode } = noise(ctx, 0.08, 2000);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.06, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
  if (filterNode) filterNode.connect(g); else src.connect(g);
  g.connect(sg());
  src.start(ctx.currentTime);
}

// 59. Zoom in (rising sweep)
export function playZoomIn() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 400, 0, 0.2);
  o.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
  gain(ctx, 0.1, 0, 0.2, o);
}

// 60. Zoom out (falling sweep)
export function playZoomOut() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 1200, 0, 0.2);
  o.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.15);
  gain(ctx, 0.1, 0, 0.2, o);
}

// 61. Level up (triumphant fanfare)
export function playLevelUp() {
  const ctx = getCtx();
  playArp(ctx, [N.C4, N.E4, N.G4, N.C5, N.E5, N.G5], "sine", 0.08, 0.12);
  playChord(ctx, [N.C5, N.E5, N.G5], "triangle", 0.5, 0.8, 0.08);
}

// 62. Achievement unlock (celebration burst)
export function playAchievement() {
  const ctx = getCtx();
  // Rising sparkles
  for (let i = 0; i < 6; i++) {
    const o = osc(ctx, "sine", 800 + i * 200, i * 0.04, 0.3);
    gain(ctx, 0.06, i * 0.04, 0.3, o);
  }
  // Final chord
  playChord(ctx, [N.C4, N.E4, N.G4, N.C5], "sine", 0.3, 1, 0.1);
}

// 63. Ambient pulse (soft heartbeat)
export function playAmbientPulse() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 60, 0, 0.4);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.1);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  o.connect(g);
  g.connect(sg());
  o.start(ctx.currentTime);
}

// 64. Crystal resonance (harmonic ring)
export function playCrystalResonance() {
  const ctx = getCtx();
  const freqs = [523, 659, 784, 1047];
  freqs.forEach((f, i) => {
    const o = osc(ctx, "sine", f, i * 0.05, 1.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, ctx.currentTime + i * 0.05);
    g.gain.linearRampToValueAtTime(0.04, ctx.currentTime + i * 0.05 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.05 + 1.5);
    o.connect(g);
    g.connect(sg());
  });
}

// 65. Double click (quick double tap)
export function playDoubleClick() {
  const ctx = getCtx();
  const o1 = osc(ctx, "sine", 1000, 0, 0.03);
  gain(ctx, 0.2, 0, 0.03, o1);
  const o2 = osc(ctx, "sine", 1200, 0.05, 0.03);
  gain(ctx, 0.15, 0.05, 0.03, o2);
}

// 66. Long press (building tension)
export function playLongPress() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 200, 0, 0.4);
  o.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.4);
  gain(ctx, 0.1, 0, 0.4, o);
  const { src, filterNode } = noise(ctx, 0.4, 300);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.4);
  if (filterNode) filterNode.connect(g); else src.connect(g);
  g.connect(sg());
  src.start(ctx.currentTime);
}

// 67. Swipe right (whoosh right)
export function playSwipeRight() {
  const ctx = getCtx();
  const { src, filterNode } = noise(ctx, 0.12, 2500);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.03);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  if (filterNode) filterNode.connect(g); else src.connect(g);
  g.connect(sg());
  src.start(ctx.currentTime);
  // Rising sine accent
  const o = osc(ctx, "sine", 600, 0, 0.08);
  o.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.06);
  gain(ctx, 0.06, 0, 0.08, o);
}

// 68. Swipe left (whoosh left)
export function playSwipeLeft() {
  const ctx = getCtx();
  const { src, filterNode } = noise(ctx, 0.12, 2500);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.18, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
  if (filterNode) filterNode.connect(g); else src.connect(g);
  g.connect(sg());
  src.start(ctx.currentTime);
  const o = osc(ctx, "sine", 1200, 0, 0.08);
  o.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.06);
  gain(ctx, 0.06, 0, 0.08, o);
}

// 69. Pinch zoom (tight squeeze)
export function playPinch() {
  const ctx = getCtx();
  const o1 = osc(ctx, "sine", 800, 0, 0.08);
  o1.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.04);
  gain(ctx, 0.1, 0, 0.08, o1);
  const o2 = osc(ctx, "sine", 800, 0.04, 0.08);
  o2.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.12);
  gain(ctx, 0.1, 0.04, 0.08, o2);
}

// 70. Shake (rattle)
export function playShake() {
  const ctx = getCtx();
  for (let i = 0; i < 6; i++) {
    const o = osc(ctx, "square", 150 + Math.random() * 200, i * 0.03, 0.04);
    gain(ctx, 0.08, i * 0.03, 0.04, o);
  }
  const { src } = noise(ctx, 0.2, 1500);
  gain(ctx, 0.06, 0, 0.2, src);
}

// 71. Pop (bubble burst)
export function playPop() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 600, 0, 0.08);
  o.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.06);
  gain(ctx, 0.2, 0, 0.08, o);
  const { src } = noise(ctx, 0.04, 4000);
  gain(ctx, 0.1, 0, 0.04, src);
}

// 72. Ding (bell)
export function playDing() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 1318.51, 0, 0.6);
  gain(ctx, 0.15, 0, 0.6, o);
  const o2 = osc(ctx, "sine", 2637.02, 0, 0.4);
  gain(ctx, 0.06, 0, 0.4, o2);
}

// 73. Chime (gentle bell)
export function playChime() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 880, 0, 0.5);
  gain(ctx, 0.12, 0, 0.5, o);
  const o2 = osc(ctx, "triangle", 1320, 0.02, 0.4);
  gain(ctx, 0.06, 0.02, 0.4, o2);
}

// 74. Bell (deep resonance)
export function playBell() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 440, 0, 1.2);
  gain(ctx, 0.12, 0, 1.2, o);
  const o2 = osc(ctx, "sine", 880, 0, 0.8);
  gain(ctx, 0.06, 0, 0.8, o2);
  const o3 = osc(ctx, "sine", 1320, 0, 0.6);
  gain(ctx, 0.03, 0, 0.6, o3);
}

// 75. Gong (deep wash)
export function playGong() {
  const ctx = getCtx();
  const freqs = [130.81, 196, 261.63, 329.63];
  freqs.forEach((f, i) => {
    const o = osc(ctx, "sine", f, i * 0.02, 2);
    gain(ctx, 0.08, i * 0.02, 2, o);
  });
  const { src } = noise(ctx, 0.3, 800);
  gain(ctx, 0.06, 0, 0.3, src);
}

// 76. Typewriter key (mechanical click)
export function playTypewriterKey() {
  const ctx = getCtx();
  const { src, filterNode } = noise(ctx, 0.02, 6000);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.15, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
  if (filterNode) filterNode.connect(g); else src.connect(g);
  g.connect(sg());
  src.start(ctx.currentTime);
  const o = osc(ctx, "square", 150, 0, 0.015);
  gain(ctx, 0.08, 0, 0.015, o);
}

// 77. Typewriter carriage return (ding + slide)
export function playCarriageReturn() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 1200, 0, 0.15);
  gain(ctx, 0.12, 0, 0.15, o);
  const { src, filterNode } = noise(ctx, 0.2, 2000);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.08, ctx.currentTime + 0.1);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
  if (filterNode) { filterNode.frequency.value = 2000; filterNode.connect(g); } else src.connect(g);
  g.connect(sg());
  src.start(ctx.currentTime + 0.1);
}

// 78. Laser zap (sci-fi)
export function playLaser() {
  const ctx = getCtx();
  const o = osc(ctx, "sawtooth", 1200, 0, 0.15);
  o.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.12);
  gain(ctx, 0.12, 0, 0.15, o);
  const { src } = noise(ctx, 0.05, 8000);
  gain(ctx, 0.04, 0, 0.05, src);
}

// 79. Teleport (materialize)
export function playTeleport() {
  const ctx = getCtx();
  // Descending then ascending
  const o1 = osc(ctx, "sine", 2000, 0, 0.15);
  o1.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
  gain(ctx, 0.1, 0, 0.15, o1);
  const o2 = osc(ctx, "sine", 200, 0.15, 0.2);
  o2.frequency.exponentialRampToValueAtTime(2000, ctx.currentTime + 0.35);
  gain(ctx, 0.12, 0.15, 0.2, o2);
  // Shimmer
  for (let i = 0; i < 4; i++) {
    const o = osc(ctx, "sine", 1000 + i * 500, 0.3 + i * 0.02, 0.3);
    gain(ctx, 0.04, 0.3 + i * 0.02, 0.3, o);
  }
}

// 80. Magic sparkle (fairy dust)
export function playMagicSparkle() {
  const ctx = getCtx();
  for (let i = 0; i < 8; i++) {
    const o = osc(ctx, "sine", 1500 + Math.random() * 2000, i * 0.04, 0.2);
    gain(ctx, 0.04, i * 0.04, 0.2, o);
  }
}

// 81. Power up (ascending energy)
export function playPowerUp() {
  const ctx = getCtx();
  for (let i = 0; i < 5; i++) {
    const o = osc(ctx, "sawtooth", 200 + i * 150, i * 0.06, 0.15);
    gain(ctx, 0.06, i * 0.06, 0.15, o);
  }
  const o = osc(ctx, "sine", 1200, 0.3, 0.3);
  gain(ctx, 0.12, 0.3, 0.3, o);
}

// 82. Power down (descending energy)
export function playPowerDown() {
  const ctx = getCtx();
  for (let i = 0; i < 5; i++) {
    const o = osc(ctx, "sawtooth", 1000 - i * 150, i * 0.06, 0.15);
    gain(ctx, 0.06, i * 0.06, 0.15, o);
  }
  const o = osc(ctx, "sine", 80, 0.3, 0.3);
  gain(ctx, 0.1, 0.3, 0.3, o);
}

// 83. Checkmark (validation pass)
export function playCheck() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 800, 0, 0.1);
  gain(ctx, 0.15, 0, 0.1, o);
  const o2 = osc(ctx, "sine", 1200, 0.06, 0.12);
  gain(ctx, 0.12, 0.06, 0.12, o2);
}

// 84. Cross (validation fail)
export function playCross() {
  const ctx = getCtx();
  const o = osc(ctx, "sawtooth", 300, 0, 0.15);
  gain(ctx, 0.1, 0, 0.15, o);
  const o2 = osc(ctx, "square", 200, 0.08, 0.12);
  gain(ctx, 0.08, 0.08, 0.12, o2);
}

// 85. Whoosh up (ascending pass)
export function playWhooshUp() {
  const ctx = getCtx();
  const { src, filterNode } = noise(ctx, 0.2, 1500);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.06);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  if (filterNode) { filterNode.frequency.value = 1500; filterNode.connect(g); } else src.connect(g);
  g.connect(sg());
  src.start(ctx.currentTime);
  const o = osc(ctx, "sine", 300, 0, 0.15);
  o.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.12);
  gain(ctx, 0.06, 0, 0.15, o);
}

// 86. Whoosh down (descending pass)
export function playWhooshDown() {
  const ctx = getCtx();
  const { src, filterNode } = noise(ctx, 0.2, 1500);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.15, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  if (filterNode) { filterNode.frequency.value = 1500; filterNode.connect(g); } else src.connect(g);
  g.connect(sg());
  src.start(ctx.currentTime);
  const o = osc(ctx, "sine", 900, 0, 0.15);
  o.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.12);
  gain(ctx, 0.06, 0, 0.15, o);
}

// 87. Bubble pop (cute pop)
export function playBubblePop() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 1000, 0, 0.06);
  o.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);
  gain(ctx, 0.18, 0, 0.06, o);
}

// 88. Click meta (UI state change)
export function playClickMeta() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 700, 0, 0.03);
  gain(ctx, 0.12, 0, 0.03, o);
  const o2 = osc(ctx, "triangle", 1400, 0.015, 0.02);
  gain(ctx, 0.06, 0.015, 0.02, o2);
}

// 89. Context open (menu appear)
export function playContextOpen() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 500, 0, 0.08);
  o.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.06);
  gain(ctx, 0.1, 0, 0.08, o);
  const { src } = noise(ctx, 0.05, 4000);
  gain(ctx, 0.04, 0.02, 0.05, src);
}

// 90. Context close (menu disappear)
export function playContextClose() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 800, 0, 0.06);
  o.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.05);
  gain(ctx, 0.08, 0, 0.06, o);
}

// 91. Tooltip appear (subtle reveal)
export function playTooltip() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 900, 0, 0.04);
  gain(ctx, 0.06, 0, 0.04, o);
}

// 92. Drag start (grab)
export function playDragStart() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 500, 0, 0.06);
  o.frequency.exponentialRampToValueAtTime(700, ctx.currentTime + 0.04);
  gain(ctx, 0.1, 0, 0.06, o);
}

// 93. Drag end (release)
export function playDragEnd() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 700, 0, 0.06);
  o.frequency.exponentialRampToValueAtTime(500, ctx.currentTime + 0.04);
  gain(ctx, 0.08, 0, 0.06, o);
}

// 94. Drop (landing)
export function playDrop() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 400, 0, 0.1);
  o.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.08);
  gain(ctx, 0.14, 0, 0.1, o);
  const { src } = noise(ctx, 0.05, 800);
  gain(ctx, 0.08, 0, 0.05, src);
}

// 95. Select (highlight)
export function playSelect() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 1000, 0, 0.06);
  gain(ctx, 0.12, 0, 0.06, o);
  const o2 = osc(ctx, "sine", 1500, 0.03, 0.04);
  gain(ctx, 0.08, 0.03, 0.04, o2);
}

// 96. Deselect (unhighlight)
export function playDeselect() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 1500, 0, 0.06);
  o.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
  gain(ctx, 0.08, 0, 0.06, o);
}

// 97. Tab switch (lateral move)
export function playTabSwitch() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 600, 0, 0.04);
  o.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.03);
  gain(ctx, 0.08, 0, 0.04, o);
}

// 98. Accordion open (expand)
export function playAccordionOpen() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 400, 0, 0.12);
  o.frequency.linearRampToValueAtTime(700, ctx.currentTime + 0.1);
  gain(ctx, 0.08, 0, 0.12, o);
}

// 99. Accordion close (collapse)
export function playAccordionClose() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 700, 0, 0.1);
  o.frequency.linearRampToValueAtTime(400, ctx.currentTime + 0.08);
  gain(ctx, 0.06, 0, 0.1, o);
}

// 100. Game over (sad trombone)
export function playGameOver() {
  const ctx = getCtx();
  const notes = [N.E4, N.D4, N.C4, N.B3];
  notes.forEach((f, i) => {
    const o = osc(ctx, "triangle", f, i * 0.25, 0.3);
    o.frequency.linearRampToValueAtTime(f * 0.95, i * 0.25 + 0.3);
    gain(ctx, 0.1, i * 0.25, 0.3, o);
  });
}

// 101. Victory fanfare (triumphant)
export function playVictory() {
  const ctx = getCtx();
  playArp(ctx, [N.C4, N.E4, N.G4, N.C5, N.E5, N.G5, N.C5 * 2], "sine", 0.07, 0.1);
  playChord(ctx, [N.C5, N.E5, N.G5, N.C5 * 2], "triangle", 0.55, 1.5, 0.08);
}

// 102. Quest complete (reward chime)
export function playQuestComplete() {
  const ctx = getCtx();
  playArp(ctx, [N.G4, N.B4, N.D5, N.G5, N.B5], "sine", 0.08, 0.1);
  playChord(ctx, [N.G5, N.B5], "triangle", 0.4, 1, 0.06);
}

// 103. Item pickup (quick grab)
export function playItemPickup() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 800, 0, 0.08);
  o.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.06);
  gain(ctx, 0.15, 0, 0.08, o);
}

// 104. Item drop (quick release)
export function playItemDrop() {
  const ctx = getCtx();
  const o = osc(ctx, "sine", 1400, 0, 0.08);
  o.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.06);
  gain(ctx, 0.12, 0, 0.08, o);
}

// 105. Paper crumple (intense)
export function playCrumpleIntense() {
  const ctx = getCtx();
  for (let i = 0; i < 12; i++) {
    const { src, filterNode } = noise(ctx, 0.05, 1500 + Math.random() * 4000);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.1, ctx.currentTime + i * 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.02 + 0.05);
    if (filterNode) filterNode.connect(g); else src.connect(g);
    g.connect(sg());
    src.start(ctx.currentTime + i * 0.02);
  }
}

// 106. Paper unfold (dramatic)
export function playUnfoldDramatic() {
  const ctx = getCtx();
  const { src, filterNode } = noise(ctx, 0.4, 1200);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.1);
  g.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.25);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
  if (filterNode) filterNode.connect(g); else src.connect(g);
  g.connect(sg());
  src.start(ctx.currentTime);
  // Rising tone
  const o = osc(ctx, "sine", 300, 0, 0.3);
  o.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.25);
  gain(ctx, 0.06, 0, 0.3, o);
}

// 107. Sticker peel (sticky release)
export function playStickerPeel() {
  const ctx = getCtx();
  const { src, filterNode } = noise(ctx, 0.15, 5000);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.12, ctx.currentTime);
  g.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.05);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
  if (filterNode) filterNode.connect(g); else src.connect(g);
  g.connect(sg());
  src.start(ctx.currentTime);
}

// 108. Tape rip (quick tear)
export function playTapeRip() {
  const ctx = getCtx();
  const { src, filterNode } = noise(ctx, 0.1, 4000);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.16, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
  if (filterNode) filterNode.connect(g); else src.connect(g);
  g.connect(sg());
  src.start(ctx.currentTime);
}

// 109. Rubber band (twang)
export function playRubberBand() {
  const ctx = getCtx();
  const o = osc(ctx, "triangle", 300, 0, 0.2);
  o.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);
  gain(ctx, 0.12, 0, 0.2, o);
}

// 110. Marble drop (bouncing settle)
export function playMarbleDrop() {
  const ctx = getCtx();
  const bounces = [0, 0.08, 0.14, 0.18, 0.21, 0.23];
  bounces.forEach((t, i) => {
    const o = osc(ctx, "sine", 800 - i * 100, t, 0.05);
    gain(ctx, 0.12 / (i + 1), t, 0.05, o);
  });
}

// ─── Background Music ─────────────────────────────────────────────────

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

export function playCameraShutter() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  const n1 = noise(ctx, 0.04);
  const filter = ctx.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(2400, t);
  filter.Q.setValueAtTime(4, t);
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.5, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
  n1.src.connect(filter); filter.connect(gain); gain.connect(sg());
  n1.src.start(t);

  const n2 = noise(ctx, 0.04);
  const gain2 = ctx.createGain();
  gain2.gain.setValueAtTime(0.4, t + 0.08);
  gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  n2.src.connect(filter); filter.connect(gain2); gain2.connect(sg());
  n2.src.start(t + 0.08);
}

export function playCameraFocus() {
  const ctx = getCtx();
  const t = ctx.currentTime;
  const o = osc(ctx, "sine", 1800, 0, 0.06);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.12, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
  o.connect(g); g.connect(sg());
}

export function setMuted(muted: boolean) {
  isMuted = muted;
  if (masterGain) masterGain.gain.value = muted ? 0 : 0.35;
}

export function initAudio() { getCtx(); }

// ─── Event Wiring ─────────────────────────────────────────────────────

export function setupAudioEvents() {
  if (typeof window === "undefined") return;
  const cleanups: (() => void)[] = [];
  const on = (e: string, fn: () => void) => {
    window.addEventListener(e, fn);
    cleanups.push(() => window.removeEventListener(e, fn));
  };
  // Core interactions
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
  on("camera-swoosh", playSwoosh);
  on("splash", playSplash);
  on("success", playSuccess);
  on("error", playError);
  // UI feedback
  on("button-tap", playButtonTap);
  on("button-hover", playButtonHover);
  on("toggle-on", playToggleOn);
  on("toggle-off", playToggleOff);
  on("page-turn", playPageTurn);
  on("scroll-sound", playScroll);
  on("zoom-in", playZoomIn);
  on("zoom-out", playZoomOut);
  on("notification", playNotification);
  on("error-buzz", playErrorBuzz);
  // Nature/environment
  on("leaf-rustle", playLeafRustle);
  on("water-drop", playWaterDrop);
  on("wind-chime", playWindChime);
  // Paper interactions
  on("crumple", playCrumple);
  on("tear", playTear);
  on("slide", playSlide);
  // Emotional responses
  on("wonder", playWonder);
  on("discovery", playDiscovery);
  on("joy", playJoy);
  on("sorrow", playSorrow);
  // Movement
  on("footstep", playFootstep);
  on("whoosh-fast", playWhooshFast);
  // Collection/reward
  on("coin-collect", playCoinCollect);
  on("star-collect", playStarCollect);
  on("gem-collect", playGemCollect);
  on("level-up", playLevelUp);
  on("achievement", playAchievement);
  // System
  on("compass-click", playCompassClick);
  on("map-pin", playMapPin);
  on("ambient-pulse", playAmbientPulse);
  on("crystal-resonance", playCrystalResonance);
  // Gesture sounds
  on("double-click", playDoubleClick);
  on("long-press", playLongPress);
  on("swipe-right", playSwipeRight);
  on("swipe-left", playSwipeLeft);
  on("pinch", playPinch);
  on("shake", playShake);
  on("pop", playPop);
  on("ding", playDing);
  on("chime", playChime);
  on("bell", playBell);
  on("gong", playGong);
  // Typewriter
  on("typewriter-key", playTypewriterKey);
  on("carriage-return", playCarriageReturn);
  // Sci-fi/fantasy
  on("laser", playLaser);
  on("teleport", playTeleport);
  on("magic-sparkle", playMagicSparkle);
  on("power-up", playPowerUp);
  on("power-down", playPowerDown);
  // Validation
  on("check", playCheck);
  on("cross", playCross);
  // Directional
  on("whoosh-up", playWhooshUp);
  on("whoosh-down", playWhooshDown);
  // UI state
  on("bubble-pop", playBubblePop);
  on("click-meta", playClickMeta);
  on("context-open", playContextOpen);
  on("context-close", playContextClose);
  on("tooltip", playTooltip);
  on("drag-start", playDragStart);
  on("drag-end", playDragEnd);
  on("drop", playDrop);
  on("select", playSelect);
  on("deselect", playDeselect);
  on("tab-switch", playTabSwitch);
  on("accordion-open", playAccordionOpen);
  on("accordion-close", playAccordionClose);
  // Game state
  on("game-over", playGameOver);
  on("victory", playVictory);
  on("quest-complete", playQuestComplete);
  // Item interactions
  on("item-pickup", playItemPickup);
  on("item-drop", playItemDrop);
  on("sticker-peel", playStickerPeel);
  on("tape-rip", playTapeRip);
  on("rubber-band", playRubberBand);
  on("marble-drop", playMarbleDrop);
  // Paper variants
  on("crumple-intense", playCrumpleIntense);
  on("unfold-dramatic", playUnfoldDramatic);
  // Camera & Photo Mode
  on("camera-shutter", playCameraShutter);
  on("camera-focus", playCameraFocus);
  return () => cleanups.forEach(fn => fn());
}
