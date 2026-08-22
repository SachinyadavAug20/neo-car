"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/app/lib/store";

export default function AudioEngine() {
  const audioEnabled = useAppStore((s) => s.audioEnabled);
  const activeIsland = useAppStore((s) => s.activeIsland);
  const ctxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (!audioEnabled) {
      if (ctxRef.current) {
        ctxRef.current.suspend();
      }
      return;
    }

    if (!ctxRef.current) {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 220;
      gain.gain.value = 0;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      ctxRef.current = ctx;
      oscRef.current = osc;
      gainRef.current = gain;
    }

    ctxRef.current.resume();
  }, [audioEnabled]);

  useEffect(() => {
    if (!oscRef.current || !gainRef.current || !audioEnabled) return;

    const freqMap: Record<string, number> = {
      crystal: 330,
      mushroom: 262,
      ruins: 196,
      garden: 392,
    };

    const freq = activeIsland ? freqMap[activeIsland.id] || 220 : 220;
    oscRef.current.frequency.setTargetAtTime(freq, ctxRef.current!.currentTime, 0.5);
    gainRef.current.gain.setTargetAtTime(
      activeIsland ? 0.04 : 0.015,
      ctxRef.current!.currentTime,
      0.3,
    );
  }, [activeIsland, audioEnabled]);

  return null;
}
