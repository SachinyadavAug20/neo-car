"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useNarrative } from "@/app/lib/narrativeStore";

export default function TimeDilation() {
  const { started, mood, currentBeat } = useNarrative();
  const speedRef = useRef(1);

  useFrame((_, delta) => {
    const targetSpeed = mood === "loss" ? 0.4 : mood === "wonder" ? 1.5 : 1.0;
    speedRef.current += (targetSpeed - speedRef.current) * 0.02;
  });

  if (!started) return null;
  return null;
}
