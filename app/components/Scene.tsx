"use client";

import { useStore } from "zustand";
import { KeyboardControls, Stars } from "@react-three/drei";
import { Physics } from "@react-three/rapier";
import DrivableCar, { controlsMap } from "./DrivableCar";
import ProceduralTerrain from "./ProceduralTerrain";
import Portal from "./Portal";
import RetroSun from "./RetroSun";
import LevelManager from "./LevelManager";
import RogueDaemons from "./RogueDaemons";
import EnvironmentProps from "./EnvironmentProps";
import { gameStore } from "../store/gameStore";
import ContextLossGuard from "./ContextLossGuard";
import ContextHealthGate from "./ContextHealthGate";

export default function Scene() {
  const sessionId = useStore(gameStore, (state) => state.sessionId);
  const gameState = useStore(gameStore, (state) => state.gameState);

  return (
    <KeyboardControls map={controlsMap}>
      <color attach="background" args={["#0b0f19"]} />
      <fogExp2 attach="fog" args={["#0b0f19", 0.003]} />

      <ContextLossGuard />

      <Stars radius={300} depth={80} count={1200} factor={4} saturation={0} fade speed={0.5} />

      <RetroSun />

      <ContextHealthGate>
        <EnvironmentProps />

        <ambientLight intensity={1.2} color="#9ab6ff" />
        <hemisphereLight intensity={0.75} color="#7dc4e4" groundColor="#cba6f7" />
        <directionalLight position={[20, 40, 10]} intensity={2.5} color="#e8f0ff" />

        <Physics gravity={[0, -30, 0]} paused={gameState !== "playing"}>
          <DrivableCar key={`car-${sessionId}`} />
          <ProceduralTerrain />
          <Portal key={`portal-${sessionId}`} />
          <LevelManager key={`rings-${sessionId}`} />
          <RogueDaemons key={`daemons-${sessionId}`} />
        </Physics>
      </ContextHealthGate>
    </KeyboardControls>
  );
}