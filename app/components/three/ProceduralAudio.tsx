"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/app/lib/store";
import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";

const MOOD_FREQUENCIES: Record<string, number[]> = {
  courage: [220, 277, 330],
  wonder: [262, 330, 392],
  loss: [196, 233, 294],
  hope: [330, 392, 494],
};

const ISLAND_DRONES: Record<string, number> = {
  crystal: 330,
  mushroom: 262,
  ruins: 196,
  garden: 392,
};

export default function ProceduralAudio() {
  const { audioEnabled } = useStore();
  const { started, playing, currentChapter, mood } = useNarrative();
  const ctxRef = useRef<AudioContext | null>(null);
  const oscillatorsRef = useRef<OscillatorNode[]>([]);
  const gainsRef = useRef<GainNode[]>([]);

  useEffect(() => {
    if (!audioEnabled || !started) {
      oscillatorsRef.current.forEach((o) => {
        try { o.stop(); } catch {}
      });
      oscillatorsRef.current = [];
      gainsRef.current = [];
      if (ctxRef.current) {
        ctxRef.current.close();
        ctxRef.current = null;
      }
      return;
    }

    const ctx = new AudioContext();
    ctxRef.current = ctx;

    const chapter = CHAPTERS[currentChapter];
    if (!chapter) return;

    const freqs = mood
      ? MOOD_FREQUENCIES[mood] || [220, 277, 330]
      : [ISLAND_DRONES[chapter.islandId] || 220, (ISLAND_DRONES[chapter.islandId] || 220) * 1.25, (ISLAND_DRONES[chapter.islandId] || 220) * 1.5];

    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.Q.setValueAtTime(2, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.03 / (i + 1), ctx.currentTime + 2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscillatorsRef.current.push(osc);
      gainsRef.current.push(gain);
    });

    return () => {
      gainsRef.current.forEach((g, i) => {
        try {
          g.gain.linearRampToValueAtTime(0, ctx.currentTime + 1);
          setTimeout(() => {
            oscillatorsRef.current[i]?.stop();
          }, 1100);
        } catch {}
      });
      setTimeout(() => {
        ctx.close();
      }, 1500);
    };
  }, [audioEnabled, started, currentChapter, mood]);

  return null;
}
