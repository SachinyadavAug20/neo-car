"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { Model as Car } from "./Car";

function FloatingCar() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!group.current) return;
    const t = state.clock.elapsedTime;
    group.current.position.y = 0.97 + Math.sin(t * 2.2) * 0.15;
    group.current.rotation.y = Math.sin(t * 0.6) * 0.08;
  });

  return (
    <group ref={group} position={[0, 0.97, 0]} scale={0.05}>
      <Car />
    </group>
  );
}

export default function Scene() {
  return (
    <>
      <color attach="background" args={["#12021f"]} />
      <fog attach="fog" args={["#12021f", 18, 55]} />

      <ambientLight intensity={0.55} color="#ffffff" />
      <directionalLight position={[10, 20, 12]} intensity={2.2} color="#8fe8ff" />
      <pointLight position={[-18, 6, -25]} intensity={160} distance={70} color="#ff2d95" />
      <pointLight position={[18, 6, -25]} intensity={160} distance={70} color="#00e5ff" />

      <Grid
        position={[0, -0.01, 0]}
        infiniteGrid
        cellSize={0.5}
        cellThickness={0.55}
        cellColor="#ff2d95"
        sectionSize={2.5}
        sectionThickness={1.1}
        sectionColor="#00e5ff"
        fadeDistance={40}
        fadeStrength={1.4}
        followCamera={false}
      />

      <FloatingCar />

      <EffectComposer>
        <Bloom
          mipmapBlur
          intensity={1.25}
          luminanceThreshold={0.12}
          luminanceSmoothing={0.9}
        />
      </EffectComposer>
    </>
  );
}