"use client";

import { useCallback, useMemo } from "react";

type PlayState = "playing" | "paused";
type FrequencyTuple = [number, number, number];
type StateListener = (state: PlayState) => void;

const PLAYLIST: readonly string[] = [
  "/audio/alexgrohl-retro-electronic-535019.mp3",
  "/audio/deltax-music-vice-city-vibes-grand-theft-auto-style-soundtrack-301060.mp3",
  "/audio/everything01unique-gta-vi-theme-music-174952.mp3",
];
const FFT_SIZE = 512;
const MAX_BYTE = 255;
const FRAME_BUCKET_MS = 16;

const BASS_BINS: readonly [number, number] = [1, 5];
const MIDS_BINS: readonly [number, number] = [5, 21];
const HIGHS_BINS: readonly [number, number] = [21, 65];

const IDLE_FREQUENCIES: FrequencyTuple = [0, 0, 0];
const IDLE_SPECTRUM = new Uint8Array(256);

class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private freqData: Uint8Array<ArrayBuffer> | null = null;
  private result: FrequencyTuple = [0, 0, 0];
  private state: PlayState = "paused";
  private currentTrackIndex = 0;
  private readonly listeners = new Set<StateListener>();
  private lastFrameId = -1;

  private average(data: Uint8Array, [start, end]: readonly [number, number]): number {
    let sum = 0;
    for (let i = start; i < end; i++) sum += data[i];
    return Math.min(1, sum / (end - start) / MAX_BYTE);
  }

  private setState(next: PlayState): void {
    if (this.state === next) return;
    this.state = next;
    this.listeners.forEach((listener) => listener(next));
  }

  private ensure(): void {
    if (this.ctx) return;

    const audio = new Audio(PLAYLIST[this.currentTrackIndex]);
    audio.loop = true;
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";

    const ctx = new AudioContext();
    const source = ctx.createMediaElementSource(audio);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0.8;

    source.connect(analyser);
    analyser.connect(ctx.destination);

    this.freqData = new Uint8Array(analyser.frequencyBinCount);

    audio.addEventListener("play", () => this.setState("playing"));
    audio.addEventListener("pause", () => this.setState("paused"));
    audio.addEventListener("ended", () => this.setState("paused"));

    this.audio = audio;
    this.ctx = ctx;
    this.analyser = analyser;
  }

  private playTrack(): void {
    if (!this.audio) return;
    this.audio.src = PLAYLIST[this.currentTrackIndex];
    void this.ctx?.resume().catch(() => undefined);
    void this.audio.play().catch(() => this.setState("paused"));
  }

  private refresh(): void {
    if (!this.ctx || !this.analyser || !this.freqData || this.state === "paused") {
      this.result[0] = 0;
      this.result[1] = 0;
      this.result[2] = 0;
      return;
    }
    this.analyser.getByteFrequencyData(this.freqData);
    this.result[0] = this.average(this.freqData, BASS_BINS);
    this.result[1] = this.average(this.freqData, MIDS_BINS);
    this.result[2] = this.average(this.freqData, HIGHS_BINS);
  }

  play(): void {
    this.ensure();
    this.playTrack();
  }

  pause(): void {
    this.audio?.pause();
    void this.ctx?.suspend().catch(() => undefined);
  }

  nextTrack(): void {
    this.ensure();
    this.currentTrackIndex = (this.currentTrackIndex + 1) % PLAYLIST.length;
    this.playTrack();
  }

  prevTrack(): void {
    this.ensure();
    this.currentTrackIndex =
      (this.currentTrackIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
    this.playTrack();
  }

  getProgress(): number {
    if (!this.audio) return 0;
    const { currentTime, duration } = this.audio;
    if (!Number.isFinite(duration) || duration <= 0) return 0;
    const progress = currentTime / duration;
    return Number.isFinite(progress) ? Math.min(1, Math.max(0, progress)) : 0;
  }

  getFrequencies(): FrequencyTuple {
    const frameId = Math.floor(performance.now() / FRAME_BUCKET_MS);
    if (frameId !== this.lastFrameId) {
      this.lastFrameId = frameId;
      this.refresh();
    }
    return this.result;
  }

  getSpectrum(): Uint8Array<ArrayBuffer> {
    if (!this.ctx || !this.analyser || !this.freqData || this.state === "paused") {
      return IDLE_SPECTRUM;
    }
    this.analyser.getByteFrequencyData(this.freqData);
    return this.freqData;
  }

  getState(): PlayState {
    return this.state;
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

let engine: AudioEngine | null = null;

function getEngine(): AudioEngine {
  if (!engine) engine = new AudioEngine();
  return engine;
}

export interface AudioAnalyzerApi {
  play: () => void;
  pause: () => void;
  getFrequencies: () => FrequencyTuple;
  getSpectrum: () => Uint8Array<ArrayBuffer>;
  getState: () => PlayState;
  subscribe: (listener: StateListener) => () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  getProgress: () => number;
}

export function useAudioAnalyzer(): AudioAnalyzerApi {
  const engine = useMemo<AudioEngine | null>(() => {
    if (typeof window === "undefined") return null;
    return getEngine();
  }, []);

  return {
    play: useCallback(() => engine?.play(), [engine]),
    pause: useCallback(() => engine?.pause(), [engine]),
    getFrequencies: useCallback(
      () => engine?.getFrequencies() ?? IDLE_FREQUENCIES,
      [engine],
    ),
    getSpectrum: useCallback(
      () => engine?.getSpectrum() ?? IDLE_SPECTRUM,
      [engine],
    ),
    getState: useCallback(() => engine?.getState() ?? "paused", [engine]),
    subscribe: useCallback(
      (listener: StateListener) => engine?.subscribe(listener) ?? (() => undefined),
      [engine],
    ),
    nextTrack: useCallback(() => engine?.nextTrack(), [engine]),
    prevTrack: useCallback(() => engine?.prevTrack(), [engine]),
    getProgress: useCallback(() => engine?.getProgress() ?? 0, [engine]),
  };
}