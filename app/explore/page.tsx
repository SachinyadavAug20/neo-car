"use client";

import { Suspense } from "react";
import { useRef, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sparkles } from "@react-three/drei";
import { useRouter } from "next/navigation";
import EffectBoundary from "../components/EffectBoundary";

function FloatingCore() {
  const inner = useRef<THREE.Mesh>(null);
  const outer = useRef<THREE.Group>(null);

  const icoGeometry = useMemo(() => new THREE.IcosahedronGeometry(4, 1), []);

  const innerMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#12021f",
        wireframe: true,
        emissive: "#00e5ff",
        emissiveIntensity: 1.4,
      }),
    [],
  );

  const outerMaterial = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        wireframe: true,
        color: "#ff2d95",
        transparent: true,
        opacity: 0.3,
      }),
    [],
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (outer.current) {
      outer.current.rotation.x = Math.sin(t * 0.2) * 0.4;
      outer.current.rotation.y = t * 0.25;
      outer.current.position.y = Math.sin(t * 0.8) * 1.2;
    }
    if (inner.current) {
      inner.current.rotation.y = -t * 0.4;
      inner.current.rotation.x = Math.cos(t * 0.15) * 0.2;
    }
  });

  return (
    <group ref={outer}>
      <mesh ref={inner} geometry={icoGeometry} material={innerMaterial} />
      <mesh scale={1.7} geometry={icoGeometry} material={outerMaterial} />
    </group>
  );
}

export default function ExplorePage() {
  const router = useRouter();

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-[#0a0118]">
      <Suspense fallback={<div className="h-screen w-screen bg-[#0a0118]" />}>
        <Canvas
          camera={{ position: [0, 3, 14], fov: 60, near: 0.1, far: 200 }}
          dpr={[1, 1]}
          gl={{
            antialias: false,
            alpha: false,
            stencil: false,
            depth: true,
            powerPreference: "default",
            failIfMajorPerformanceCaveat: false,
          }}
        >
        <color attach="background" args={["#0a0118"]} />
        <ambientLight intensity={1.1} />
        <pointLight position={[0, 10, 0]} intensity={120} distance={60} color="#00e5ff" />
        <pointLight position={[0, -6, 0]} intensity={120} distance={60} color="#ff2d95" />
        <EffectBoundary fallback={null}>
          <FloatingCore />
          <Sparkles count={150} scale={[30, 24, 30]} size={2.2} speed={0.35} color="#ff2d95" />
        </EffectBoundary>
        </Canvas>
      </Suspense>

      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-end gap-6 p-10">
        <h1 className="text-4xl font-black tracking-[0.3em] text-transparent sm:text-6xl">
          <span className="bg-gradient-to-r from-fuchsia-400 to-cyan-300 bg-clip-text drop-shadow-[0_0_18px_rgba(0,229,255,0.6)]">
            THE VAULT
          </span>
        </h1>
        <p className="text-xs tracking-[0.4em] text-cyan-300/70 sm:text-sm">
          BEYOND THE GRID · REACT THREE FIBER EXPERIENCE
        </p>
        <button
          type="button"
          onClick={() => router.back()}
          className="pointer-events-auto rounded-full border border-cyan-300/40 bg-black/40 px-8 py-3 font-bold tracking-[0.35em] text-cyan-300 shadow-[0_0_24px_rgba(0,229,255,0.3)] backdrop-blur-md transition hover:scale-105 active:scale-95"
        >
          RETURN TO THE GRID
        </button>
      </div>
    </main>
  );
}