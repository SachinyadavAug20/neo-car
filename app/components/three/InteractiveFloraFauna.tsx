"use client";

import { useRef, useState, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";

// ─── Blooming Paper Flower ─────────────────────────────────────────────
interface BloomingFlowerProps {
  position: [number, number, number];
  color?: string;
  petalCount?: number;
  scale?: number;
}

export function BloomingPaperFlower({
  position,
  color = "#f472b6",
  petalCount = 6,
  scale = 1,
}: BloomingFlowerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [bloomed, setBloomed] = useState(false);
  const bloomProgress = useRef(0);

  const petalGeo = useMemo(() => new THREE.ConeGeometry(0.18, 0.5, 3), []);
  const petalEdgeGeo = useMemo(() => new THREE.EdgesGeometry(petalGeo), [petalGeo]);
  const centerGeo = useMemo(() => new THREE.SphereGeometry(0.12, 6, 6), []);

  const petals = useMemo(() => {
    return Array.from({ length: petalCount }, (_, i) => {
      const angle = (i / petalCount) * Math.PI * 2;
      return { angle };
    });
  }, [petalCount]);

  useFrame(() => {
    if (!groupRef.current) return;
    const target = bloomed ? 1 : 0.2;
    bloomProgress.current = THREE.MathUtils.lerp(bloomProgress.current, target, 0.1);

    groupRef.current.children.forEach((child, i) => {
      if (i === 0) return; // skip stem
      const p = petals[i - 1];
      if (!p) return;
      child.rotation.z = (1 - bloomProgress.current) * 0.9;
    });
  });

  const triggerBloom = () => {
    setBloomed((prev) => !prev);
    window.dispatchEvent(new CustomEvent("magic-sparkle"));
    window.dispatchEvent(new CustomEvent("crystal-resonance"));
  };

  return (
    <group
      ref={groupRef}
      position={position}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        triggerBloom();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setBloomed(true);
        window.dispatchEvent(new CustomEvent("cursor-change", { detail: { cursor: "interact", label: "BLOOM" } }));
      }}
      onPointerOut={() => {
        window.dispatchEvent(new CustomEvent("cursor-change", { detail: { cursor: "default" } }));
      }}
    >
      {/* Stem */}
      <mesh position={[0, -0.3, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.6, 4]} />
        <meshToonMaterial color="#16a34a" />
      </mesh>

      {/* Flower Center */}
      <mesh position={[0, 0.05, 0]}>
        <primitive object={centerGeo} />
        <meshToonMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={bloomed ? 0.4 : 0} />
      </mesh>

      {/* Petals */}
      {petals.map((p, i) => (
        <group key={i} rotation={[0, p.angle, 0]}>
          <group position={[0.12, 0, 0]} rotation={[0, 0, 0.5]}>
            <mesh geometry={petalGeo}>
              <meshToonMaterial color={color} side={THREE.DoubleSide} />
            </mesh>
            <lineSegments geometry={petalEdgeGeo}>
              <lineBasicMaterial color="#1a1a2e" transparent opacity={0.35} />
            </lineSegments>
          </group>
        </group>
      ))}

      {/* Glow light when bloomed */}
      {bloomed && <pointLight color={color} intensity={0.4} distance={2} />}
    </group>
  );
}

// ─── Leaping Paper Frog ────────────────────────────────────────────────
interface LeapingFrogProps {
  position: [number, number, number];
  color?: string;
}

export function LeapingPaperFrog({ position, color = "#22c55e" }: LeapingFrogProps) {
  const groupRef = useRef<THREE.Group>(null);
  const isJumping = useRef(false);

  const bodyGeo = useMemo(() => new THREE.DodecahedronGeometry(0.2, 0), []);
  const bodyEdgeGeo = useMemo(() => new THREE.EdgesGeometry(bodyGeo), [bodyGeo]);
  const eyeGeo = useMemo(() => new THREE.SphereGeometry(0.04, 4, 4), []);

  const leap = () => {
    if (isJumping.current || !groupRef.current) return;
    isJumping.current = true;
    window.dispatchEvent(new CustomEvent("bubble-pop"));
    window.dispatchEvent(new CustomEvent("pop"));

    const startY = position[1];
    const tl = gsap.timeline({
      onComplete: () => {
        isJumping.current = false;
      },
    });

    // Squash before leap
    tl.to(groupRef.current.scale, { x: 1.3, y: 0.7, z: 1.3, duration: 0.1, ease: "power1.in" })
      // Launch up & stretch
      .to(groupRef.current.position, { y: startY + 1.2, duration: 0.3, ease: "power2.out" })
      .to(groupRef.current.scale, { x: 0.8, y: 1.3, z: 0.8, duration: 0.2 }, "-=0.3")
      // Rotate in air
      .to(groupRef.current.rotation, { x: "+=6.28", duration: 0.5, ease: "power1.inOut" }, "-=0.3")
      // Land & squash
      .to(groupRef.current.position, { y: startY, duration: 0.25, ease: "bounce.out" })
      .to(groupRef.current.scale, { x: 1, y: 1, z: 1, duration: 0.15 });
  };

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        leap();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent("cursor-change", { detail: { cursor: "interact", label: "CROAK" } }));
      }}
      onPointerOut={() => {
        window.dispatchEvent(new CustomEvent("cursor-change", { detail: { cursor: "default" } }));
      }}
    >
      {/* Body */}
      <mesh geometry={bodyGeo}>
        <meshToonMaterial color={color} />
      </mesh>
      <lineSegments geometry={bodyEdgeGeo}>
        <lineBasicMaterial color="#1a1a2e" transparent opacity={0.4} />
      </lineSegments>

      {/* Eyes */}
      <mesh position={[-0.08, 0.15, 0.1]} geometry={eyeGeo}>
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[0.08, 0.15, 0.1]} geometry={eyeGeo}>
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>

      {/* Legs */}
      <mesh position={[-0.15, -0.08, -0.05]} rotation={[0, 0, -0.6]}>
        <coneGeometry args={[0.06, 0.18, 3]} />
        <meshToonMaterial color={color} />
      </mesh>
      <mesh position={[0.15, -0.08, -0.05]} rotation={[0, 0, 0.6]}>
        <coneGeometry args={[0.06, 0.18, 3]} />
        <meshToonMaterial color={color} />
      </mesh>
    </group>
  );
}
