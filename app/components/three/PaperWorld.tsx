"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { chapters } from "@/app/lib/chapters";

// ─── Reusable paper shapes ────────────────────────────────────────────

function PaperBox({ position, color, size = [1, 1, 1], rotation }: { position: [number, number, number]; color: string; size?: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh><boxGeometry args={size} /><meshToonMaterial color={color} /></mesh>
      <lineSegments><edgesGeometry args={[new THREE.BoxGeometry(...size)]} /><lineBasicMaterial color="#1a1a2e" linewidth={2} /></lineSegments>
    </group>
  );
}

function PaperCone({ position, color, args = [1, 1.5, 6], rotation }: { position: [number, number, number]; color: string; args?: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh><coneGeometry args={args} /><meshToonMaterial color={color} /></mesh>
      <lineSegments><edgesGeometry args={[new THREE.ConeGeometry(...args)]} /><lineBasicMaterial color="#1a1a2e" linewidth={2} /></lineSegments>
    </group>
  );
}

function PaperCylinder({ position, color, args = [0.5, 0.5, 1, 8] }: { position: [number, number, number]; color: string; args?: [number, number, number, number] }) {
  return (
    <group position={position}>
      <mesh><cylinderGeometry args={args} /><meshToonMaterial color={color} /></mesh>
      <lineSegments><edgesGeometry args={[new THREE.CylinderGeometry(...args)]} /><lineBasicMaterial color="#1a1a2e" linewidth={2} /></lineSegments>
    </group>
  );
}

function PaperSphere({ position, color, radius = 0.5 }: { position: [number, number, number]; color: string; radius?: number }) {
  return (
    <group position={position}>
      <mesh><sphereGeometry args={[radius, 12, 12]} /><meshToonMaterial color={color} /></mesh>
      <lineSegments><edgesGeometry args={[new THREE.SphereGeometry(radius, 12, 12)]} /><lineBasicMaterial color="#1a1a2e" linewidth={1} /></lineSegments>
    </group>
  );
}

function PaperCircle({ position, color, radius = 1 }: { position: [number, number, number]; color: string; radius?: number }) {
  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}><circleGeometry args={[radius, 16]} /><meshToonMaterial color={color} /></mesh>
      <lineSegments rotation={[-Math.PI / 2, 0, 0]}><edgesGeometry args={[new THREE.CircleGeometry(radius, 16)]} /><lineBasicMaterial color="#1a1a2e" linewidth={1} /></lineSegments>
    </group>
  );
}

function PaperTorus({ position, color, args = [0.5, 0.15, 8, 24] }: { position: [number, number, number]; color: string; args?: [number, number, number, number] }) {
  return (
    <group position={position}>
      <mesh><torusGeometry args={args} /><meshToonMaterial color={color} /></mesh>
      <lineSegments><edgesGeometry args={[new THREE.TorusGeometry(...args)]} /><lineBasicMaterial color="#1a1a2e" linewidth={1} /></lineSegments>
    </group>
  );
}

function PaperOctahedron({ position, color, radius = 0.5 }: { position: [number, number, number]; color: string; radius?: number }) {
  return (
    <group position={position}>
      <mesh><octahedronGeometry args={[radius]} /><meshToonMaterial color={color} /></mesh>
      <lineSegments><edgesGeometry args={[new THREE.OctahedronGeometry(radius)]} /><lineBasicMaterial color="#1a1a2e" linewidth={1} /></lineSegments>
    </group>
  );
}

function PaperDodecahedron({ position, color, radius = 0.5 }: { position: [number, number, number]; color: string; radius?: number }) {
  return (
    <group position={position}>
      <mesh><dodecahedronGeometry args={[radius]} /><meshToonMaterial color={color} /></mesh>
      <lineSegments><edgesGeometry args={[new THREE.DodecahedronGeometry(radius)]} /><lineBasicMaterial color="#1a1a2e" linewidth={1} /></lineSegments>
    </group>
  );
}

// ─── Animated elements ────────────────────────────────────────────────

function FlyingCrane({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Group>(null);
  const wingR = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = position[1] + Math.sin(t * 1.5) * 0.8 + Math.sin(t * 0.3) * 2;
    ref.current.position.x = position[0] + Math.sin(t * 0.4) * 4;
    ref.current.position.z = position[2] + Math.cos(t * 0.3) * 3;
    ref.current.rotation.y = t * 0.5;
    ref.current.rotation.z = Math.sin(t * 2) * 0.08;
    if (wingL.current) wingL.current.rotation.z = Math.sin(t * 4) * 0.4;
    if (wingR.current) wingR.current.rotation.z = -Math.sin(t * 4) * 0.4;
  });
  return (
    <group ref={ref} position={position}>
      <PaperBox position={[0, 0, 0]} color="#f97316" size={[0.3, 0.06, 0.15]} />
      <PaperCone position={[0.2, 0.02, 0]} color="#f97316" args={[0.04, 0.12, 3]} />
      <group ref={wingL} position={[-0.05, 0.05, 0.1]}>
        <PaperBox position={[0, 0, 0]} color="#fb923c" size={[0.22, 0.02, 0.22]} />
      </group>
      <group ref={wingR} position={[-0.05, 0.05, -0.1]}>
        <PaperBox position={[0, 0, 0]} color="#fb923c" size={[0.22, 0.02, 0.12]} />
      </group>
      <PaperSphere position={[0, -0.1, 0]} color="#fbbf24" radius={0.04} />
      <pointLight position={[0, -0.1, 0]} intensity={0.5} color="#fbbf24" distance={3} />
    </group>
  );
}

function SwimmingBoat({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = position[1] + Math.sin(t * 1.2) * 0.1;
    ref.current.rotation.z = Math.sin(t * 1.2) * 0.06;
    ref.current.position.x = position[0] + Math.sin(t * 0.2) * 0.5;
  });
  return (
    <group ref={ref} position={position}>
      <PaperBox position={[0, 0, 0]} color="#fbbf24" size={[0.6, 0.1, 0.3]} />
      <PaperCylinder position={[0, 0.25, 0]} color="#92400e" args={[0.015, 0.015, 0.4, 4]} />
      <PaperCone position={[0.06, 0.3, 0]} color="#ffffff" args={[0.1, 0.3, 3]} />
    </group>
  );
}

function SittingOwl({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
  });
  return (
    <group ref={ref} position={position}>
      <PaperBox position={[0, 0.3, 0]} color="#78716c" size={[0.25, 0.35, 0.2]} />
      <PaperBox position={[0, 0.55, 0]} color="#a8a29e" size={[0.22, 0.18, 0.18]} />
      <PaperSphere position={[-0.04, 0.56, 0.1]} color="#1a1a2e" radius={0.025} />
      <PaperSphere position={[0.04, 0.56, 0.1]} color="#1a1a2e" radius={0.025} />
    </group>
  );
}

function HidingFox({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.position.x = position[0] + Math.sin(state.clock.elapsedTime * 0.3) * 0.2;
      ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });
  return (
    <group ref={ref} position={position}>
      <PaperBox position={[0, 0.2, 0]} color="#f97316" size={[0.4, 0.2, 0.2]} />
      <PaperBox position={[0.25, 0.28, 0]} color="#f97316" size={[0.18, 0.18, 0.18]} />
      <PaperCone position={[0.3, 0.42, 0.05]} color="#f97316" args={[0.04, 0.1, 3]} />
      <PaperCone position={[0.3, 0.42, -0.05]} color="#f97316" args={[0.04, 0.1, 3]} />
      <PaperBox position={[-0.3, 0.28, 0]} color="#fb923c" size={[0.25, 0.05, 0.05]} />
    </group>
  );
}

function FloatingCloud({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const speed = useMemo(() => 0.1 + Math.random() * 0.15, []);
  const startX = position[0];
  useFrame((state) => {
    if (ref.current) ref.current.position.x = startX + Math.sin(state.clock.elapsedTime * speed) * 1.5;
  });
  return (
    <group ref={ref} position={position}>
      <PaperSphere position={[0, 0, 0]} color="#ffffff" radius={0.4} />
      <PaperSphere position={[0.3, 0.05, 0]} color="#ffffff" radius={0.28} />
      <PaperSphere position={[-0.3, 0.03, 0]} color="#ffffff" radius={0.32} />
    </group>
  );
}

function DriftingBird({ position, delay = 0 }: { position: [number, number, number]; delay?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime + delay;
    ref.current.position.x = position[0] + ((t * 1.0) % 20) - 10;
    ref.current.position.y = position[1] + Math.sin(t * 2.5) * 0.2;
  });
  return (
    <group ref={ref} position={position} scale={0.2}>
      <PaperBox position={[-0.12, 0, 0]} color="#1a1a2e" size={[0.35, 0.05, 0.02]} />
      <PaperBox position={[0.12, 0, 0]} color="#1a1a2e" size={[0.35, 0.05, 0.02]} />
    </group>
  );
}

// ─── Interactive objects ──────────────────────────────────────────────

function CollectibleCrystal({ position, color = "#a78bfa", onCollect }: { position: [number, number, number]; color?: string; onCollect?: () => void }) {
  const ref = useRef<THREE.Group>(null);
  const [collected, setCollected] = useState(false);
  const { camera } = useThree();

  useFrame((state) => {
    if (!ref.current || collected) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 1.5;
    ref.current.position.y = position[1] + Math.sin(t * 2) * 0.15;

    const dist = camera.position.distanceTo(new THREE.Vector3(...position));
    if (dist < 1.5) {
      setCollected(true);
      onCollect?.();
    }
  });

  if (collected) return null;

  return (
    <group ref={ref} position={position}>
      <PaperOctahedron position={[0, 0, 0]} color={color} radius={0.2} />
      <pointLight position={[0, 0, 0]} intensity={0.3} color={color} distance={2} />
    </group>
  );
}

function StoryFragment({ position, text, visible }: { position: [number, number, number]; text: string; visible: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) {
      ref.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  if (!visible) return null;

  return (
    <group ref={ref} position={position}>
      <PaperDodecahedron position={[0, 0, 0]} color="#fbbf24" radius={0.3} />
      <pointLight position={[0, 0, 0]} intensity={0.5} color="#fbbf24" distance={3} />
    </group>
  );
}

function PortalArch({ position, color = "#a78bfa", active }: { position: [number, number, number]; color?: string; active: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.y = state.clock.elapsedTime * 0.2;
  });

  return (
    <group ref={ref} position={position}>
      <PaperCylinder position={[-0.5, 0.5, 0]} color={color} args={[0.08, 0.08, 1, 6]} />
      <PaperCylinder position={[0.5, 0.5, 0]} color={color} args={[0.08, 0.08, 1, 6]} />
      <PaperBox position={[0, 1, 0]} color={color} size={[1.2, 0.1, 0.1]} />
      {active && (
        <mesh position={[0, 0.5, 0]}>
          <planeGeometry args={[0.8, 0.9]} />
          <meshBasicMaterial color={color} transparent opacity={0.15} side={THREE.DoubleSide} />
        </mesh>
      )}
    </group>
  );
}

function AncientRuin({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <PaperCylinder position={[0, 0.5, 0]} color="#d6d3d1" args={[0.3, 0.35, 1, 6]} />
      <PaperCylinder position={[1.5, 0.3, 0]} color="#d6d3d1" args={[0.25, 0.3, 0.6, 6]} />
      <PaperCylinder position={[-1, 0.2, 0.5]} color="#d6d3d1" args={[0.2, 0.25, 0.4, 6]} />
      <PaperBox position={[0.75, 0.8, 0]} color="#d6d3d1" size={[2, 0.1, 0.5]} rotation={[0, 0, 0.05]} />
      <PaperOctahedron position={[0, 1.2, 0]} color="#a78bfa" radius={0.15} />
    </group>
  );
}

function Windmill({ position }: { position: [number, number, number] }) {
  const blades = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (blades.current) blades.current.rotation.z = state.clock.elapsedTime * 0.8;
  });
  return (
    <group position={position}>
      <PaperCylinder position={[0, 0.8, 0]} color="#fef3c7" args={[0.2, 0.3, 1.6, 6]} />
      <PaperCone position={[0, 1.8, 0]} color="#ef4444" args={[0.35, 0.3, 4]} />
      <group ref={blades} position={[0, 1.2, 0.25]}>
        <PaperBox position={[0, 0.4, 0]} color="#92400e" size={[0.08, 0.8, 0.02]} />
        <PaperBox position={[0, -0.4, 0]} color="#92400e" size={[0.08, 0.8, 0.02]} />
        <PaperBox position={[0.4, 0, 0]} color="#92400e" size={[0.8, 0.08, 0.02]} />
        <PaperBox position={[-0.4, 0, 0]} color="#92400e" size={[0.8, 0.08, 0.02]} />
      </group>
    </group>
  );
}

function Bridge({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <PaperBox position={[0, 0, 0]} color="#92400e" size={[3, 0.1, 0.8]} />
      <PaperCylinder position={[-1.2, -0.2, 0]} color="#92400e" args={[0.06, 0.06, 0.5, 6]} />
      <PaperCylinder position={[1.2, -0.2, 0]} color="#92400e" args={[0.06, 0.06, 0.5, 6]} />
      <PaperCylinder position={[0, -0.15, 0]} color="#92400e" args={[0.05, 0.05, 0.4, 6]} />
    </group>
  );
}

function Lighthouse({ position }: { position: [number, number, number] }) {
  const light = useRef<THREE.PointLight>(null);
  useFrame((state) => {
    if (light.current) {
      const t = state.clock.elapsedTime;
      light.current.intensity = 0.5 + Math.sin(t * 3) * 0.3;
    }
  });
  return (
    <group position={position}>
      <PaperCylinder position={[0, 1, 0]} color="#ffffff" args={[0.2, 0.3, 2, 8]} />
      <PaperCylinder position={[0, 2.2, 0]} color="#ef4444" args={[0.15, 0.2, 0.3, 8]} />
      <PaperSphere position={[0, 2.5, 0]} color="#fbbf24" radius={0.15} />
      <pointLight ref={light} position={[0, 2.5, 0]} intensity={0.5} color="#fbbf24" distance={8} />
    </group>
  );
}

function WindParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => Array.from({ length: 80 }, () => ({
    x: (Math.random() - 0.5) * 40,
    y: Math.random() * 10,
    z: (Math.random() - 0.5) * 40,
    speed: 0.5 + Math.random() * 1.5,
    size: 0.02 + Math.random() * 0.03,
  })), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    particles.forEach((p, i) => {
      p.x += p.speed * 0.02;
      if (p.x > 20) p.x = -20;
      dummy.position.set(p.x, p.y + Math.sin(t + i) * 0.3, p.z);
      dummy.scale.setScalar(p.size);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 80]} frustumCulled={false}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#1a1a2e" transparent opacity={0.15} />
    </instancedMesh>
  );
}

function FireflySwarm() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const flies = useMemo(() => Array.from({ length: 30 }, () => ({
    x: (Math.random() - 0.5) * 15,
    y: 0.5 + Math.random() * 3,
    z: (Math.random() - 0.5) * 15,
    phase: Math.random() * Math.PI * 2,
    speed: 0.5 + Math.random(),
  })), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    flies.forEach((f, i) => {
      dummy.position.set(
        f.x + Math.sin(t * f.speed + f.phase) * 1.5,
        f.y + Math.sin(t * f.speed * 1.3 + f.phase) * 0.5,
        f.z + Math.cos(t * f.speed + f.phase) * 1.5,
      );
      const pulse = 0.03 + Math.abs(Math.sin(t * 3 + f.phase)) * 0.04;
      dummy.scale.setScalar(pulse);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 30]} frustumCulled={false}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial color="#fbbf24" transparent opacity={0.8} />
    </instancedMesh>
  );
}

// ─── Zones ────────────────────────────────────────────────────────────

function Village() {
  return (
    <group>
      <PaperBox position={[0, -0.15, 0]} color="#fef3c7" size={[0.9, 0.7, 0.7]} />
      <PaperCone position={[0, 0.5, 0]} color="#ef4444" args={[0.65, 0.5, 4]} />
      <PaperBox position={[0, -0.05, 0.36]} color="#92400e" size={[0.2, 0.3, 0.01]} />
      <PaperBox position={[-3, -0.15, -1]} color="#fef3c7" size={[0.8, 0.6, 0.6]} />
      <PaperCone position={[-3, 0.35, -1]} color="#ef4444" args={[0.55, 0.45, 4]} />
      <Windmill position={[2, -0.5, -2]} />
      <Bridge position={[0, -0.3, 4]} />
      <PaperBox position={[3, -0.2, 1]} color="#fef3c7" size={[0.7, 0.5, 0.5]} />
      <PaperCone position={[3, 0.2, 1]} color="#3b82f6" args={[0.45, 0.4, 4]} />
    </group>
  );
}

function Forest() {
  const trees = useMemo(() => [
    { pos: [-2, 0, 2] as [number, number, number], color: "#4ade80" },
    { pos: [-1, 0, 3] as [number, number, number], color: "#22c55e" },
    { pos: [-3, 0, 1] as [number, number, number], color: "#16a34a" },
    { pos: [-4, 0, 3] as [number, number, number], color: "#4ade80" },
    { pos: [-2.5, 0, 4] as [number, number, number], color: "#22c55e" },
    { pos: [-5, 0, 2] as [number, number, number], color: "#15803d" },
    { pos: [-1.5, 0, 0] as [number, number, number], color: "#4ade80" },
    { pos: [-3.5, 0, 5] as [number, number, number], color: "#16a34a" },
    { pos: [-6, 0, 3] as [number, number, number], color: "#22c55e" },
  ], []);
  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={t.pos}>
          <PaperCylinder position={[0, 0.4, 0]} color="#92400e" args={[0.1, 0.1, 0.8, 6]} />
          <PaperCone position={[0, 1.1, 0]} color={t.color} args={[0.45, 0.9, 6]} />
        </group>
      ))}
      <FireflySwarm />
    </group>
  );
}

function Mountain() {
  return (
    <group>
      <PaperCone position={[0, 1, -8]} color="#d4d4d4" args={[2.5, 3, 4]} />
      <PaperCone position={[0, 3, -8]} color="#ffffff" args={[0.7, 0.6, 4]} />
      <PaperCone position={[-4, 0.5, -6]} color="#a3a3a3" args={[1.8, 2.2, 4]} />
      <PaperCone position={[4, 0.5, -7]} color="#a3a3a3" args={[1.5, 2, 4]} />
      <SittingOwl position={[0, 3.2, -7.5]} />
      <Lighthouse position={[5, -0.5, -3]} />
    </group>
  );
}

function UnfoldedLands() {
  return (
    <group>
      <PaperCircle position={[8, -0.45, 0]} color="#f5f5f4" radius={4} />
      <PaperCircle position={[10, -0.44, 3]} color="#e5e5e5" radius={2} />
      <AncientRuin position={[9, -0.5, 1]} />
      <PaperTorus position={[9, 1, 1]} color="#d6d3d1" args={[0.4, 0.08, 8, 16]} />
    </group>
  );
}

function Lake() {
  return (
    <group>
      <PaperCircle position={[5, -0.4, 5]} color="#7dd3fc" radius={2} />
      <PaperCircle position={[6, -0.39, 6]} color="#93c5fd" radius={1.2} />
      <SwimmingBoat position={[5, -0.1, 5]} />
    </group>
  );
}

function River() {
  const geo = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 40; i++) {
      const t = i / 40;
      pts.push(new THREE.Vector3(
        Math.sin(t * 6) * 1.5 - 5 + t * 10,
        -0.4,
        6 + Math.sin(t * 3) * 0.5,
      ));
    }
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, 40, 0.25, 6, false);
  }, []);
  return (
    <mesh>
      <primitive object={geo} />
      <meshToonMaterial color="#93c5fd" transparent opacity={0.5} />
    </mesh>
  );
}

function Sky() {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (ref.current) ref.current.rotation.z = state.clock.elapsedTime * 0.06;
  });
  return (
    <group ref={ref} position={[6, 6, -8]}>
      <PaperCircle position={[0, 0, 0]} color="#fbbf24" radius={1} />
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2;
        return (
          <PaperBox key={i} position={[Math.cos(angle) * 1.3, Math.sin(angle) * 1.3, 0]} color="#fbbf24" size={[0.06, 0.35, 0.02]} />
        );
      })}
    </group>
  );
}

function Ground() {
  return (
    <group>
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[60, 60]} />
        <meshToonMaterial color="#86efac" />
      </mesh>
      <lineSegments position={[0, -0.49, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <edgesGeometry args={[new THREE.PlaneGeometry(60, 60)]} />
        <lineBasicMaterial color="#1a1a2e" linewidth={1} />
      </lineSegments>
    </group>
  );
}

// ─── Main World ───────────────────────────────────────────────────────

export default function PaperWorld() {
  const { camera } = useThree();
  const [chapter, setChapter] = useState(0);
  const targetPos = useRef(new THREE.Vector3(...chapters[0].position));
  const targetLook = useRef(new THREE.Vector3(...chapters[0].lookAt));
  const [crystals, setCrystals] = useState(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      const ch = ce.detail.chapter as number;
      setChapter(ch);
      targetPos.current.set(...chapters[ch].position);
      targetLook.current.set(...chapters[ch].lookAt);
    };
    window.addEventListener("chapter-change", handler);
    return () => window.removeEventListener("chapter-change", handler);
  }, []);

  useFrame(() => {
    if (document.pointerLockElement) return;
    camera.position.lerp(targetPos.current, 0.02);
    camera.lookAt(targetLook.current);
  });

  return (
    <group>
      <Sky />
      <Ground />
      <Village />
      <Forest />
      <Mountain />
      <UnfoldedLands />
      <Lake />
      <River />

      <FlyingCrane position={[0, 2, 0]} />
      <HidingFox position={[-2.5, -0.5, 2.5]} />

      <FloatingCloud position={[-3, 4, -3]} />
      <FloatingCloud position={[4, 5, -5]} />
      <FloatingCloud position={[0, 4.5, -4]} />
      <FloatingCloud position={[-5, 3.5, -2]} />
      <FloatingCloud position={[7, 4, 2]} />

      <DriftingBird position={[-5, 3, -2]} delay={0} />
      <DriftingBird position={[-3, 3.5, -1]} delay={1.5} />
      <DriftingBird position={[2, 4, -3]} delay={3} />

      <WindParticles />

      {/* Collectible crystals scattered around */}
      <CollectibleCrystal position={[1, 1, 2]} color="#a78bfa" onCollect={() => setCrystals(c => c + 1)} />
      <CollectibleCrystal position={[-2, 1.5, 5]} color="#f472b6" onCollect={() => setCrystals(c => c + 1)} />
      <CollectibleCrystal position={[7, 1, -1]} color="#67e8f9" onCollect={() => setCrystals(c => c + 1)} />
      <CollectibleCrystal position={[4, 1.5, 6]} color="#fbbf24" onCollect={() => setCrystals(c => c + 1)} />
      <CollectibleCrystal position={[-4, 1, 4]} color="#4ade80" onCollect={() => setCrystals(c => c + 1)} />

      {/* Story fragments */}
      <StoryFragment position={[8, 0.5, 0]} text="" visible={chapter >= 3} />
      <StoryFragment position={[0, 1.5, -7]} text="" visible={chapter >= 5} />
      <StoryFragment position={[5, 0.5, 5]} text="" visible={chapter >= 6} />

      {/* Portals */}
      <PortalArch position={[-1, 0, 6]} color="#a78bfa" active={chapter >= 2} />
      <PortalArch position={[6, 0, 0]} color="#f472b6" active={chapter >= 4} />
    </group>
  );
}
