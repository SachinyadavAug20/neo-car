"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

function PaperMountain({ position, color, scale = 1 }: { position: [number, number, number]; color: string; scale?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    }
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh position={[0, 1.2, 0]}>
        <coneGeometry args={[2, 2.5, 4]} />
        <meshToonMaterial color={color} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.ConeGeometry(2, 2.5, 4)]} />
        <lineBasicMaterial color="#1a1a2e" linewidth={2} />
      </lineSegments>
    </group>
  );
}

function PaperTree({ position, color = "#4ade80" }: { position: [number, number, number]; color?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.15, 0.15, 0.8, 6]} />
        <meshToonMaterial color="#8b6914" />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.CylinderGeometry(0.15, 0.15, 0.8, 6)]} />
        <lineBasicMaterial color="#1a1a2e" linewidth={2} />
      </lineSegments>
      <mesh position={[0, 1.2, 0]}>
        <coneGeometry args={[0.5, 1, 6]} />
        <meshToonMaterial color={color} />
      </mesh>
      <lineSegments position={[0, 1.2, 0]}>
        <edgesGeometry args={[new THREE.ConeGeometry(0.5, 1, 6)]} />
        <lineBasicMaterial color="#1a1a2e" linewidth={2} />
      </lineSegments>
    </group>
  );
}

function PaperHouse({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1, 0.8, 0.8]} />
        <meshToonMaterial color="#fef3c7" />
      </mesh>
      <lineSegments position={[0, 0.4, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(1, 0.8, 0.8)]} />
        <lineBasicMaterial color="#1a1a2e" linewidth={2} />
      </lineSegments>
      <mesh position={[0, 1, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[0.7, 0.6, 4]} />
        <meshToonMaterial color="#ef4444" />
      </mesh>
      <lineSegments position={[0, 1, 0]}>
        <edgesGeometry args={[new THREE.ConeGeometry(0.7, 0.6, 4)]} />
        <lineBasicMaterial color="#1a1a2e" linewidth={2} />
      </lineSegments>
      <mesh position={[0, 0.25, 0.41]}>
        <boxGeometry args={[0.25, 0.35, 0.01]} />
        <meshToonMaterial color="#92400e" />
      </mesh>
    </group>
  );
}

function PaperCloud({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const speed = useMemo(() => 0.2 + Math.random() * 0.3, []);
  const startX = useMemo(() => position[0], [position]);

  useFrame((state) => {
    if (ref.current) {
      ref.current.position.x = startX + Math.sin(state.clock.elapsedTime * speed) * 2;
    }
  });

  return (
    <group ref={ref} position={position}>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshToonMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.4, 0.1, 0]}>
        <sphereGeometry args={[0.35, 8, 8]} />
        <meshToonMaterial color="#ffffff" />
      </mesh>
      <mesh position={[-0.4, 0.05, 0]}>
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshToonMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

function PaperBoat({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.15;
      ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
    }
  });

  return (
    <group ref={ref} position={position}>
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.8, 0.15, 0.4]} />
        <meshToonMaterial color="#fbbf24" />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(0.8, 0.15, 0.4)]} />
        <lineBasicMaterial color="#1a1a2e" linewidth={2} />
      </lineSegments>
      <mesh position={[0, 0.3, 0]}>
        <coneGeometry args={[0.15, 0.4, 3]} />
        <meshToonMaterial color="#ffffff" />
      </mesh>
      <lineSegments position={[0, 0.3, 0]}>
        <edgesGeometry args={[new THREE.ConeGeometry(0.15, 0.4, 3)]} />
        <lineBasicMaterial color="#1a1a2e" linewidth={2} />
      </lineSegments>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.6, 4]} />
        <meshToonMaterial color="#92400e" />
      </mesh>
    </group>
  );
}

function PaperSun() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.z = state.clock.elapsedTime * 0.1;
    }
  });

  return (
    <group ref={ref} position={[6, 6, -8]}>
      <mesh>
        <circleGeometry args={[1, 12]} />
        <meshToonMaterial color="#fbbf24" />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.CircleGeometry(1, 12)]} />
        <lineBasicMaterial color="#1a1a2e" linewidth={2} />
      </lineSegments>
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(angle) * 1.3, Math.sin(angle) * 1.3, 0]}>
            <boxGeometry args={[0.08, 0.4, 0.02]} />
            <meshToonMaterial color="#fbbf24" />
          </mesh>
        );
      })}
    </group>
  );
}

function PaperBird({ position, delay }: { position: [number, number, number]; delay: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.elapsedTime + delay;
      ref.current.position.x = position[0] + ((t * 1.5) % 20) - 10;
      ref.current.position.y = position[1] + Math.sin(t * 3) * 0.3;
      ref.current.position.z = position[2];
    }
  });

  return (
    <group ref={ref} position={position} scale={0.3}>
      <mesh position={[-0.15, 0, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.4, 0.08, 0.02]} />
        <meshToonMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[0.15, 0, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.4, 0.08, 0.02]} />
        <meshToonMaterial color="#1a1a2e" />
      </mesh>
    </group>
  );
}

export default function PaperWorld() {
  return (
    <group>
      <PaperSun />

      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshToonMaterial color="#86efac" />
      </mesh>
      <lineSegments position={[0, -0.49, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(30, 30)]} />
        <lineBasicMaterial color="#1a1a2e" linewidth={2} />
      </lineSegments>

      <PaperMountain position={[-5, -0.5, -6]} color="#a3a3a3" scale={1.2} />
      <PaperMountain position={[0, -0.5, -8]} color="#d4d4d4" scale={1.5} />
      <PaperMountain position={[5, -0.5, -7]} color="#a3a3a3" scale={1} />
      <PaperMountain position={[-3, -0.5, -4]} color="#e5e5e5" scale={0.8} />

      <PaperTree position={[-2, -0.5, 2]} />
      <PaperTree position={[-1, -0.5, 3]} color="#22c55e" />
      <PaperTree position={[2, -0.5, 1]} />
      <PaperTree position={[3, -0.5, 3]} color="#16a34a" />
      <PaperTree position={[-4, -0.5, 1]} />
      <PaperTree position={[4, -0.5, 2]} color="#22c55e" />

      <PaperHouse position={[0, -0.5, 0]} />
      <PaperHouse position={[-3, -0.5, -1]} />

      <PaperCloud position={[-3, 4, -3]} />
      <PaperCloud position={[4, 5, -5]} />
      <PaperCloud position={[0, 4.5, -4]} />

      <PaperBoat position={[-2, -0.2, 5]} />
      <PaperBoat position={[3, -0.2, 6]} />

      <PaperBird position={[-5, 3, -2]} delay={0} />
      <PaperBird position={[-3, 3.5, -1]} delay={1} />
      <PaperBird position={[2, 4, -3]} delay={2} />

      <mesh position={[3, -0.3, 5]}>
        <circleGeometry args={[1.5, 16]} />
        <meshToonMaterial color="#7dd3fc" />
      </mesh>
      <lineSegments position={[3, -0.29, 5]} rotation={[-Math.PI / 2, 0, 0]}>
        <edgesGeometry args={[new THREE.CircleGeometry(1.5, 16)]} />
        <lineBasicMaterial color="#1a1a2e" linewidth={2} />
      </lineSegments>

      <mesh position={[-2, -0.3, 5.5]}>
        <circleGeometry args={[1, 12]} />
        <meshToonMaterial color="#93c5fd" />
      </mesh>
    </group>
  );
}
