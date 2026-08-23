"use client";

import { useEffect, useRef, useCallback } from "react";
import { useNarrative } from "@/app/lib/narrativeStore";
import { useStore } from "@/app/lib/store";

const SCALES: Record<string, number[]> = {
  wonder: [261.63, 293.66, 329.63, 392.00, 440.00, 523.25],
  courage: [220.00, 261.63, 293.66, 329.63, 392.00, 440.00],
  loss: [261.63, 277.18, 329.63, 349.23, 415.30, 523.25],
  hope: [293.66, 329.63, 369.99, 440.00, 493.88, 587.33],
};

export default function ProceduralMusic() {
  const { started, mood, currentChapter } = useNarrative();
  const audioEnabled = useStore((s) => s.audioEnabled);
  const ctxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastMoodRef = useRef(mood);

  const playNote = useCallback((ctx: AudioContext, freq: number, duration: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "sine";
    osc.frequency.value = freq;

    filter.type = "lowpass";
    filter.frequency.value = 800;
    filter.Q.value = 1;

    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }, []);

  const playChord = useCallback((ctx: AudioContext, mood: string) => {
    const scale = SCALES[mood] || SCALES.wonder;
    const baseIdx = Math.floor(Math.random() * 3);
    const notes = [scale[baseIdx], scale[baseIdx + 2], scale[baseIdx + 4]];
    notes.forEach((freq) => {
      playNote(ctx, freq, 2 + Math.random() * 2);
    });
  }, [playNote]);

  useEffect(() => {
    if (!started || !audioEnabled) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    try {
      ctxRef.current = new AudioContext();
    } catch {
      return;
    }

    const ctx = ctxRef.current;
    if (!ctx) return;

    if (ctx.state === "suspended") ctx.resume();

    const baseInterval = mood === "wonder" ? 4000 : mood === "loss" ? 6000 : 5000;

    intervalRef.current = setInterval(() => {
      playChord(ctx, mood || "wonder");
    }, baseInterval);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [started, audioEnabled, mood, playChord]);

  useEffect(() => {
    if (!ctxRef.current || !audioEnabled || !started) return;
    if (lastMoodRef.current !== mood) {
      lastMoodRef.current = mood;
      playChord(ctxRef.current, mood || "wonder");
    }
  }, [mood, audioEnabled, started, playChord]);

  useEffect(() => {
    return () => {
      if (ctxRef.current) {
        ctxRef.current.close();
      }
    };
  }, []);

  return null;
}
