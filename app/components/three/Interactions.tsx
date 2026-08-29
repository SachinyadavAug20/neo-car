"use client";

import { useRef, useMemo, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

// ─── Mouse Parallax Effect ────────────────────────────────────────────
// Subtle camera offset based on mouse position for diorama depth feel

export function MouseParallaxEffect({ strength = 0.3 }: { strength?: number }) {
  const { camera } = useThree();
  const target = useRef(new THREE.Vector3());
  const mouseRef = useRef({ nx: 0, ny: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouseRef.current.nx = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.ny = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  useFrame(() => {
    target.current.set(
      mouseRef.current.nx * strength,
      -mouseRef.current.ny * strength * 0.5,
      0
    );
    camera.position.lerp(target.current.clone().add(camera.position), 0.02);
  });

  return null;
}

// ─── Interactive Pendulum Push ─────────────────────────────────────────

interface PushPendulumProps {
  position: [number, number, number];
  length?: number;
  color?: string;
  label?: string;
}

export function PushPendulum({ position, length = 2, color = "#f472b6", label }: PushPendulumProps) {
  const pendRef = useRef<{ angle: number; angularVel: number }>({ angle: 0, angularVel: 0 });
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const boxEdgeGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(0.5, 0.4, 0.5)), []);

  useFrame((_, delta) => {
    const s = pendRef.current;
    const dt = Math.min(delta, 0.05);
    s.angularVel += (-9.8 / length * Math.sin(s.angle)) * dt;
    s.angularVel *= 0.985;
    s.angle += s.angularVel * dt;
    if (groupRef.current) {
      groupRef.current.rotation.z = s.angle;
    }
  });

  const push = () => {
    pendRef.current.angularVel += (Math.random() > 0.5 ? 1 : -1) * 2;
  };

  return (
    <group position={position}>
      <mesh position={[0, -length / 2, 0]}>
        <cylinderGeometry args={[0.02, 0.02, length, 4]} />
        <meshToonMaterial color="#78716c" />
      </mesh>
      <group
        ref={groupRef}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; window.dispatchEvent(new CustomEvent("tooltip")); }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = "default"; window.dispatchEvent(new CustomEvent("hover-out")); }}
        onClick={(e) => { e.stopPropagation(); push(); window.dispatchEvent(new CustomEvent("pendulum-push")); }}
      >
        <group position={[0, -length, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.4, 0.5]} />
            <meshToonMaterial color={hovered ? "#fbbf24" : color} emissive={hovered ? "#fbbf24" : "#000"} emissiveIntensity={hovered ? 0.3 : 0} />
          </mesh>
          <lineSegments geometry={boxEdgeGeo}>
            <lineBasicMaterial color="#1a1a2e" />
          </lineSegments>
        </group>
      </group>
    </group>
  );
}

// ─── Hidden Critter (Easter Egg) ──────────────────────────────────────
// Tiny creatures that peek out when hovered

interface HiddenCritterProps {
  position: [number, number, number];
  type?: "fox" | "bird" | "bug" | "rabbit" | "owl";
  peekDistance?: number;
}

export function HiddenCritter({ position, type = "fox", peekDistance = 3 }: HiddenCritterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [found, setFound] = useState(false);
  const [hovered, setHovered] = useState(false);
  const bodyEdgeGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.SphereGeometry(0.15, 8, 6)), []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;
    // Subtle idle animation
    groupRef.current.rotation.y = Math.sin(t * 0.5 + position[0]) * 0.1;
    // Peek out when hovered or found
    const targetY = found ? 0 : hovered ? 0.3 : 0;
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, position[1] + targetY, 0.1);
  });

  const colors: Record<string, string> = {
    fox: "#f97316",
    bird: "#67e8f9",
    bug: "#22c55e",
    rabbit: "#d6d3d1",
    owl: "#a78bfa",
  };

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation(); setHovered(true); setFound(true);
        window.dispatchEvent(new CustomEvent("cursor-change", { detail: { cursor: "inspect" } }));
        // Different sound per creature type
        const critterSounds: Record<string, string> = { fox: "critter-found", bird: "magic-sparkle", bug: "pop", rabbit: "bubble-pop", owl: "bell" };
        window.dispatchEvent(new CustomEvent(critterSounds[type] || "critter-found"));
        window.dispatchEvent(new CustomEvent("tooltip"));
      }}
      onPointerOut={() => { setHovered(false); window.dispatchEvent(new CustomEvent("cursor-change", { detail: { cursor: "default" } })); window.dispatchEvent(new CustomEvent("hover-out")); }}
    >
      {/* Body */}
      <mesh>
        <sphereGeometry args={[0.15, 8, 6]} />
        <meshToonMaterial color={colors[type]} />
      </mesh>
      <lineSegments geometry={bodyEdgeGeo}>
        <lineBasicMaterial color="#1a1a2e" transparent opacity={0.4} />
      </lineSegments>
      {/* Eyes */}
      <mesh position={[-0.05, 0.05, 0.13]}>
        <sphereGeometry args={[0.025, 6, 4]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[0.05, 0.05, 0.13]}>
        <sphereGeometry args={[0.025, 6, 4]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>
      {/* Ears (for fox/rabbit) */}
      {(type === "fox" || type === "rabbit") && (
        <>
          <mesh position={[-0.07, 0.15, 0]} rotation={[0, 0, -0.3]}>
            <coneGeometry args={[0.04, 0.12, 4]} />
            <meshToonMaterial color={colors[type]} />
          </mesh>
          <mesh position={[0.07, 0.15, 0]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.04, 0.12, 4]} />
            <meshToonMaterial color={colors[type]} />
          </mesh>
        </>
      )}
      {/* Glow when found */}
      {found && <pointLight intensity={0.3} color={colors[type]} distance={1.5} />}
    </group>
  );
}

// ─── Ambient Dust / Paper Particles ────────────────────────────────────
// Floating particles that drift through the scene

interface AmbientDustProps {
  count?: number;
  area?: [number, number, number];
  speed?: number;
  color?: string;
}

export function AmbientDust({ count = 200, area = [60, 20, 60], speed = 0.3, color = "#d6d3d1" }: AmbientDustProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * area[0],
      y: Math.random() * area[1] + 1,
      z: (Math.random() - 0.5) * area[2],
      vx: (Math.random() - 0.5) * speed * 0.5,
      vy: (Math.random() - 0.5) * speed * 0.2,
      vz: (Math.random() - 0.5) * speed * 0.5,
      rotSpeed: (Math.random() - 0.5) * 2,
      phase: Math.random() * Math.PI * 2,
      scale: 0.02 + Math.random() * 0.04,
    }));
  }, [count, area, speed]);

  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  const mat = useMemo(() => new THREE.MeshToonMaterial({
    color,
    transparent: true,
    opacity: 0.4,
    side: THREE.DoubleSide,
  }), [color]);

  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      p.x += p.vx * 0.016;
      p.y += Math.sin(t * 0.5 + p.phase) * 0.002;
      p.z += p.vz * 0.016;

      // Wrap around
      if (p.x > area[0] / 2) p.x = -area[0] / 2;
      if (p.x < -area[0] / 2) p.x = area[0] / 2;
      if (p.z > area[2] / 2) p.z = -area[2] / 2;
      if (p.z < -area[2] / 2) p.z = area[2] / 2;
      if (p.y > area[1] + 1) p.y = 1;

      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(t * p.rotSpeed, t * p.rotSpeed * 0.7, 0);
      dummy.scale.setScalar(p.scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[geo, mat, count]} frustumCulled={false}>
    </instancedMesh>
  );
}

// ─── Paper Shatter ────────────────────────────────────────────────────
// Click to shatter a paper barrier into pieces

interface PaperShatterProps {
  position: [number, number, number];
  size?: [number, number, number];
  color?: string;
  onShatter?: () => void;
}

export function PaperShatter({ position, size = [3, 3, 0.2], color = "#e5e7eb", onShatter }: PaperShatterProps) {
  const groupRef = useRef<THREE.Group>(null);
  const shatterEdgeGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(...size)), [size[0], size[1], size[2]]);
  const [shattered, setShattered] = useState(false);
  const fragmentsRef = useRef<Array<{
    pos: THREE.Vector3;
    vel: THREE.Vector3;
    rot: THREE.Vector3;
    rotVel: THREE.Vector3;
    scale: number;
  }>>([]);

  const fragments = useMemo(() => {
    const frags = [];
    const cols = 4;
    const rows = 4;
    const fw = size[0] / cols;
    const fh = size[1] / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        frags.push({
          pos: new THREE.Vector3(
            (c - cols / 2 + 0.5) * fw + (Math.random() - 0.5) * 0.1,
            (r - rows / 2 + 0.5) * fh + (Math.random() - 0.5) * 0.1,
            0
          ),
          vel: new THREE.Vector3((Math.random() - 0.5) * 4, Math.random() * 3 + 1, (Math.random() - 0.5) * 3),
          rot: new THREE.Vector3(0, 0, 0),
          rotVel: new THREE.Vector3((Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5, (Math.random() - 0.5) * 5),
          scale: 0.8 + Math.random() * 0.4,
        });
      }
    }
    return frags;
  }, [size]);

  useFrame((_, delta) => {
    if (!shattered) return;
    const dt = Math.min(delta, 0.05);
    fragmentsRef.current.forEach((f, i) => {
      f.vel.y -= 9.8 * dt;
      f.pos.addScaledVector(f.vel, dt);
      f.rot.addScaledVector(f.rotVel, dt);
      f.scale *= 0.995;
    });
  });

  const shatter = () => {
    if (shattered) return;
    fragmentsRef.current = fragments.map(f => ({ ...f }));
    setShattered(true);
    onShatter?.();
  };

  if (shattered) {
    return (
      <group position={position}>
        {fragmentsRef.current.map((f, i) => (
          <mesh key={i} position={[f.pos.x, f.pos.y, f.pos.z]} rotation={[f.rot.x, f.rot.y, f.rot.z]} scale={f.scale}>
            <boxGeometry args={[size[0] / 4, size[1] / 4, size[2]]} />
            <meshToonMaterial color={color} transparent opacity={0.8} />
          </mesh>
        ))}
      </group>
    );
  }

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => {
        e.stopPropagation(); shatter();
        // Different sound per shatter
        const shatterSounds = ["shatter", "crumple-intense", "tear", "gong"];
        window.dispatchEvent(new CustomEvent(shatterSounds[Math.floor(Math.random() * shatterSounds.length)]));
      }}
      onPointerOver={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("cursor-change", { detail: { cursor: "interact" } })); window.dispatchEvent(new CustomEvent("tooltip")); }}
      onPointerOut={() => window.dispatchEvent(new CustomEvent("cursor-change", { detail: { cursor: "default" } }))}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshToonMaterial color={color} />
      </mesh>
      <lineSegments geometry={shatterEdgeGeo}>
        <lineBasicMaterial color="#1a1a2e" />
      </lineSegments>
      {/* Glow hint */}
      <pointLight intensity={0.5} color="#fbbf24" distance={3} />
    </group>
  );
}

// ─── Ripple Effect (on click) ─────────────────────────────────────────
// Visual ripple that expands from click point

interface RippleEffectProps {
  position: [number, number, number];
  color?: string;
  onComplete?: () => void;
}

export function RippleEffect({ position, color = "#fbbf24", onComplete }: RippleEffectProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRefs = useRef<THREE.Mesh[]>([]);
  const startTime = useRef(-1);

  useFrame((state) => {
    if (startTime.current < 0) startTime.current = state.clock.elapsedTime;
    const elapsed = state.clock.elapsedTime - startTime.current;
    ringRefs.current.forEach((ring, i) => {
      if (!ring) return;
      const delay = i * 0.15;
      const t = Math.max(0, elapsed - delay);
      const scale = t * 3;
      ring.scale.setScalar(scale);
      (ring.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 1 - t / 1.5);
    });
    if (elapsed > 2) onComplete?.();
  });

  return (
    <group ref={groupRef} position={position}>
      {[0, 1, 2].map(i => (
        <mesh key={i} ref={(el) => { if (el) ringRefs.current[i] = el; }} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.8, 1, 32]} />
          <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

// ─── Paper Rain Ribbons (Act 2 Storm) ──────────────────────────────────
export function PaperRain({ count = 120, area = [30, 20, 30] }: { count?: number; area?: [number, number, number] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geo = useMemo(() => new THREE.PlaneGeometry(0.04, 0.4), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#93c5fd", transparent: true, opacity: 0.55, side: THREE.DoubleSide }), []);

  const particles = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * area[0],
      y: Math.random() * area[1] + 2,
      z: (Math.random() - 0.5) * area[2],
      speed: 12 + Math.random() * 10,
      sway: (Math.random() - 0.5) * 1.5,
    }));
  }, [count, area]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const dt = Math.min(delta, 0.05);

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      p.y -= p.speed * dt;
      p.x += p.sway * dt - 0.8 * dt; // slant in wind direction
      if (p.y < 0) {
        p.y = area[1] + Math.random() * 2;
        p.x = (Math.random() - 0.5) * area[0];
        p.z = (Math.random() - 0.5) * area[2];
      }
      dummy.position.set(p.x, p.y, p.z);
      dummy.rotation.set(0, 0, -0.35); // angle in wind
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geo, mat, count]} frustumCulled={false} />;
}

// ─── Forest Spores / Fireflies (Act 3 Forest) ──────────────────────────
export function ForestSpores({ count = 60, center = [-12, 2, -10] }: { count?: number; center?: [number, number, number] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geo = useMemo(() => new THREE.SphereGeometry(0.06, 6, 6), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: "#86efac", transparent: true, opacity: 0.75 }), []);

  const spores = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: center[0] + (Math.random() - 0.5) * 16,
      y: center[1] + Math.random() * 6,
      z: center[2] + (Math.random() - 0.5) * 16,
      phase: Math.random() * Math.PI * 2,
      speed: 0.4 + Math.random() * 0.6,
      radius: 0.5 + Math.random() * 1.2,
    }));
  }, [count, center]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;

    for (let i = 0; i < count; i++) {
      const s = spores[i];
      const px = s.x + Math.sin(t * s.speed + s.phase) * s.radius;
      const py = s.y + Math.cos(t * 0.7 + s.phase) * 0.4;
      const pz = s.z + Math.cos(t * s.speed + s.phase) * s.radius;

      dummy.position.set(px, py, pz);
      const scale = 0.8 + Math.sin(t * 3 + s.phase) * 0.3;
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geo, mat, count]} frustumCulled={false} />;
}

// ─── Origami Embers (Act 5 Secret Fold) ─────────────────────────────────
export function OrigamiEmbers({ count = 50, center = [0, 1, -25] }: { count?: number; center?: [number, number, number] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geo = useMemo(() => new THREE.ConeGeometry(0.08, 0.14, 3), []);
  const mat = useMemo(() => new THREE.MeshToonMaterial({ color: "#fbbf24", emissive: "#f59e0b", emissiveIntensity: 0.5 }), []);

  const embers = useMemo(() => {
    return Array.from({ length: count }, () => ({
      x: center[0] + (Math.random() - 0.5) * 12,
      y: center[1] + Math.random() * 8,
      z: center[2] + (Math.random() - 0.5) * 12,
      vy: 0.6 + Math.random() * 0.8,
      rotSpeed: (Math.random() - 0.5) * 3,
      phase: Math.random() * Math.PI * 2,
    }));
  }, [count, center]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    const dt = Math.min(delta, 0.05);

    for (let i = 0; i < count; i++) {
      const e = embers[i];
      e.y += e.vy * dt;
      if (e.y > center[1] + 9) {
        e.y = center[1];
        e.x = center[0] + (Math.random() - 0.5) * 12;
        e.z = center[2] + (Math.random() - 0.5) * 12;
      }
      const px = e.x + Math.sin(t * 2 + e.phase) * 0.3;
      const pz = e.z + Math.cos(t * 1.5 + e.phase) * 0.3;

      dummy.position.set(px, e.y, pz);
      dummy.rotation.set(t * e.rotSpeed, t * e.rotSpeed * 0.8, t * e.rotSpeed * 0.5);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);
    }
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geo, mat, count]} frustumCulled={false} />;
}

// ─── Crane Flock (Act 8 Finale) ────────────────────────────────────────
export function CraneFlock({ count = 16 }: { count?: number }) {
  const flockRef = useRef<THREE.Group>(null);
  const cranes = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const angle = (i / count) * Math.PI * 2;
      const radius = 10 + (i % 3) * 4;
      const y = 8 + (i % 4) * 2;
      return { angle, radius, y, speed: 0.4 + (i % 3) * 0.1, flapOffset: i * 0.7 };
    });
  }, [count]);

  const wingEdgeGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.ConeGeometry(0.3, 0.8, 3)), []);

  useFrame((state) => {
    if (!flockRef.current) return;
    const t = state.clock.elapsedTime;
    flockRef.current.children.forEach((child, i) => {
      const c = cranes[i];
      if (!c) return;
      const curAngle = c.angle + t * c.speed * 0.3;
      const x = Math.cos(curAngle) * c.radius;
      const z = Math.sin(curAngle) * c.radius;
      child.position.set(x, c.y + Math.sin(t * 2 + c.flapOffset) * 0.5, z);
      child.rotation.y = -curAngle + Math.PI / 2;
      child.rotation.z = Math.sin(t * 4 + c.flapOffset) * 0.15;
    });
  });

  return (
    <group ref={flockRef}>
      {cranes.map((_, i) => (
        <group key={i}>
          {/* Mini Crane Body */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <coneGeometry args={[0.25, 0.7, 4]} />
            <meshToonMaterial color="#fff" />
          </mesh>
          <lineSegments geometry={wingEdgeGeo}>
            <lineBasicMaterial color="#1a1a2e" transparent opacity={0.35} />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}
