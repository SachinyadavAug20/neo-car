"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import gsap from "gsap";
import { useFrame, useThree } from "@react-three/fiber";
import { Grid } from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import type { BloomEffect } from "postprocessing";
import { Model as Car } from "./Car";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";

const GRID_CELL_SIZE = 0.5;
const BASE_SPEED = 14;
const BASS_SPEED_BOOST = 18;
const CAR_REST_Y = 0.97;

export default function Scene() {
  const camera = useThree((state) => state.camera);
  const { getFrequencies } = useAudioAnalyzer();

  const gridRef = useRef<THREE.Mesh>(null);
  const bloomRef = useRef<BloomEffect>(null);
  const carRef = useRef<THREE.Group>(null);

  useEffect(() => {
    camera.position.set(0, 50, -50);

    const timeline = gsap.timeline({ defaults: { ease: "expo.out", duration: 3 } });
    timeline.to(camera.position, { x: 0, y: 8, z: 26 });

    return () => {
      timeline.kill();
    };
  }, [camera]);

  useFrame((state) => {
    const camera = state.camera;
    const [bass] = getFrequencies();
    const t = state.clock.elapsedTime;

    if (gridRef.current) {
      const speed = BASE_SPEED + bass * BASS_SPEED_BOOST;
      gridRef.current.position.z = -((t * speed) % GRID_CELL_SIZE);
    }

    if (bloomRef.current) {
      const targetIntensity = 1.0 + bass * 2.5;
      bloomRef.current.intensity = THREE.MathUtils.lerp(
        bloomRef.current.intensity,
        targetIntensity,
        0.2,
      );
    }

    if (carRef.current) {
      carRef.current.position.y =
        CAR_REST_Y + Math.sin(t * 2.2) * 0.1 + (Math.random() - 0.5) * bass * 0.15;
      carRef.current.position.x = (Math.random() - 0.5) * bass * 0.12;
      carRef.current.rotation.y = Math.sin(t * 0.6) * 0.08;
    }

    camera.rotation.x = THREE.MathUtils.lerp(
      camera.rotation.x,
      -state.pointer.y * 0.05,
      0.06,
    );
    camera.rotation.y = THREE.MathUtils.lerp(
      camera.rotation.y,
      state.pointer.x * 0.06,
      0.06,
    );
  });

  return (
    <>
      <color attach="background" args={["#12021f"]} />
      <fog attach="fog" args={["#12021f", 18, 55]} />

      <ambientLight intensity={0.55} color="#ffffff" />
      <directionalLight position={[10, 20, 12]} intensity={2.2} color="#8fe8ff" />
      <pointLight position={[-18, 6, -25]} intensity={160} distance={70} color="#ff2d95" />
      <pointLight position={[18, 6, -25]} intensity={160} distance={70} color="#00e5ff" />

      <Grid
        ref={gridRef}
        position={[0, -0.01, 0]}
        infiniteGrid
        cellSize={GRID_CELL_SIZE}
        cellThickness={0.55}
        cellColor="#ff2d95"
        sectionSize={2.5}
        sectionThickness={1.1}
        sectionColor="#00e5ff"
        fadeDistance={40}
        fadeStrength={1.4}
        followCamera={false}
      />

      <group ref={carRef} position={[0, CAR_REST_Y, 0]} scale={0.05}>
        <Car />
      </group>

      <EffectComposer>
        <Bloom
          ref={bloomRef}
          mipmapBlur
          intensity={1.25}
          luminanceThreshold={0.12}
          luminanceSmoothing={0.9}
        />
      </EffectComposer>
    </>
  );
}