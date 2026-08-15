"use client";

import { useCallback, useMemo } from "react";

type PlayState = "playing" | "paused";
type FrequencyTuple = [number, number, number];
type StateListener = (state: PlayState) => void;

const AUDIO_SRC = "/audio/track.mp3";
const FFT_SIZE = 512;
const MAX_BYTE = 255;

const BASS_BINS: readonly [number, number] = [1, 5];
const MIDS_BINS: readonly [number, number] = [5, 21];
const HIGHS_BINS: readonly [number, number] = [21, 65];

const IDLE_FREQUENCIES: FrequencyTuple = [0, 0, 0];

class AudioEngine {
  private audio: HTMLAudioElement | null = null;
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private freqData: Uint8Array<ArrayBuffer> | null = null;
  private result: FrequencyTuple = [0, 0, 0];
  private state: PlayState = "paused";
  private readonly listeners = new Set<StateListener>();

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

    const audio = new Audio(AUDIO_SRC);
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
    void this.ctx?.resume().catch(() => undefined);
    void this.audio?.play().catch(() => this.setState("paused"));
  }

  pause(): void {
    this.audio?.pause();
    void this.ctx?.suspend().catch(() => undefined);
  }

  getFrequencies(): FrequencyTuple {
    this.refresh();
    return this.result;
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
  getState: () => PlayState;
  subscribe: (listener: StateListener) => () => void;
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
    getState: useCallback(() => engine?.getState() ?? "paused", [engine]),
    subscribe: useCallback(
      (listener: StateListener) => engine?.subscribe(listener) ?? (() => undefined),
      [engine],
    ),
  };
}