"use client";

import { useRef, useMemo, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── GPU-Instanced Particle System ────────────────────────────────────
// High-performance instanced particles with custom behavior

const _boidSep = new THREE.Vector3();
const _boidAli = new THREE.Vector3();

interface InstancedParticlesProps {
  position?: [number, number, number];
  count?: number;
  spread?: number;
  color?: string;
  size?: number;
  speed?: number;
  behavior?: "orbit" | "fall" | "rise" | "swirl" | "boid";
}

export function InstancedParticles({
  position = [0, 0, 0],
  count = 200,
  spread = 5,
  color = "#fbbf24",
  size = 0.08,
  speed = 1,
  behavior = "swirl",
}: InstancedParticlesProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const particles = useMemo(() => {
    const arr: {
      pos: THREE.Vector3;
      vel: THREE.Vector3;
      phase: number;
      speed: number;
    }[] = [];
    const rng = mulberry32(42);
    for (let i = 0; i < count; i++) {
      arr.push({
        pos: new THREE.Vector3(
          (rng() - 0.5) * spread * 2,
          (rng() - 0.5) * spread * 2,
          (rng() - 0.5) * spread * 2
        ),
        vel: new THREE.Vector3(
          (rng() - 0.5) * 0.02,
          (rng() - 0.5) * 0.02,
          (rng() - 0.5) * 0.02
        ),
        phase: rng() * Math.PI * 2,
        speed: 0.5 + rng() * 1.5,
      });
    }
    return arr;
  }, [count, spread]);

  useFrame((state) => {
    if (!meshRef.current) return;
    const time = state.clock.elapsedTime * speed;

    particles.forEach((p, i) => {
      const t = time * p.speed + p.phase;

      switch (behavior) {
        case "orbit":
          p.pos.x = Math.cos(t) * spread * 0.5;
          p.pos.y = Math.sin(t * 0.7) * spread * 0.3;
          p.pos.z = Math.sin(t) * spread * 0.5;
          break;
        case "fall":
          p.pos.y -= 0.02 * speed;
          if (p.pos.y < -spread) p.pos.y = spread;
          break;
        case "rise":
          p.pos.y += 0.02 * speed;
          if (p.pos.y > spread) p.pos.y = -spread;
          break;
        case "swirl":
          p.pos.x += Math.cos(t * 0.5) * 0.01;
          p.pos.y += Math.sin(t * 0.3) * 0.008;
          p.pos.z += Math.sin(t * 0.5) * 0.01;
          // Wrap
          if (Math.abs(p.pos.x) > spread) p.pos.x *= -0.9;
          if (Math.abs(p.pos.y) > spread) p.pos.y *= -0.9;
          if (Math.abs(p.pos.z) > spread) p.pos.z *= -0.9;
          break;
        case "boid": {
          let neighborCount = 0;
          const _sep = _boidSep.set(0, 0, 0);
          const _ali = _boidAli.set(0, 0, 0);
          for (let j = 0; j < particles.length; j++) {
            if (i === j) continue;
            const other = particles[j];
            const dx = p.pos.x - other.pos.x;
            const dy = p.pos.y - other.pos.y;
            const dz = p.pos.z - other.pos.z;
            const distSq = dx * dx + dy * dy + dz * dz;
            if (distSq < 4) {
              const dist = Math.sqrt(distSq);
              if (dist < 0.5 && dist > 0.001) {
                _sep.x += dx / dist * 0.003;
                _sep.y += dy / dist * 0.003;
                _sep.z += dz / dist * 0.003;
              }
              _ali.x += other.vel.x;
              _ali.y += other.vel.y;
              _ali.z += other.vel.z;
              neighborCount++;
              if (neighborCount >= 8) break;
            }
          }
          if (neighborCount > 0) {
            _ali.multiplyScalar(1 / neighborCount);
            _ali.x = (_ali.x - p.vel.x) * 0.001;
            _ali.y = (_ali.y - p.vel.y) * 0.001;
            _ali.z = (_ali.z - p.vel.z) * 0.001;
            p.vel.x += _sep.x + _ali.x;
            p.vel.y += _sep.y + _ali.y;
            p.vel.z += _sep.z + _ali.z;
          }
          p.vel.x -= p.pos.x * 0.0005;
          p.vel.y -= p.pos.y * 0.0005;
          p.vel.z -= p.pos.z * 0.0005;
          p.vel.clampLength(0, 0.05);
          p.pos.add(p.vel);
          if (Math.abs(p.pos.x) > spread) p.vel.x *= -1;
          if (Math.abs(p.pos.y) > spread) p.vel.y *= -1;
          if (Math.abs(p.pos.z) > spread) p.vel.z *= -1;
          break;
        }
      }

      dummy.position.copy(p.pos);
      const s = size * (0.5 + Math.sin(t * 2) * 0.5);
      dummy.scale.set(s, s, s);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]} frustumCulled={false}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshToonMaterial color={color} emissive={color} emissiveIntensity={0.2} />
    </instancedMesh>
  );
}

// ─── Physics Pendulum ─────────────────────────────────────────────────
// Realistic pendulum with gravity and damping

interface PhysicsPendulumProps {
  position?: [number, number, number];
  length?: number;
  bobSize?: number;
  color?: string;
  initialAngle?: number;
  damping?: number;
  autoPush?: boolean;
}

export function PhysicsPendulum({
  position = [0, 0, 0],
  length = 3,
  bobSize = 0.3,
  color = "#f472b6",
  initialAngle = Math.PI / 4,
  damping = 0.999,
  autoPush = true,
}: PhysicsPendulumProps) {
  const groupRef = useRef<THREE.Group>(null);
  const angleRef = useRef(initialAngle);
  const velocityRef = useRef(0);
  const lastPush = useRef(0);

  useFrame((state, delta) => {
    const g = 9.81;
    // Angular acceleration: -g/L * sin(θ)
    const acc = (-g / length) * Math.sin(angleRef.current);
    velocityRef.current += acc * delta;
    velocityRef.current *= damping;
    angleRef.current += velocityRef.current * delta;

    // Auto-push every 3 seconds
    if (autoPush && state.clock.elapsedTime - lastPush.current > 3) {
      velocityRef.current += 2;
      lastPush.current = state.clock.elapsedTime;
      window.dispatchEvent(new CustomEvent("pendulum-push"));
    }

    if (groupRef.current) {
      groupRef.current.rotation.z = angleRef.current;
    }
  });

  return (
    <group position={position}>
      {/* Pivot */}
      <mesh>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshToonMaterial color="#78716c" />
      </mesh>
      {/* Rod + Bob */}
      <group ref={groupRef}>
        <mesh position={[0, -length / 2, 0]}>
          <cylinderGeometry args={[0.02, 0.02, length, 4]} />
          <meshToonMaterial color="#78716c" />
        </mesh>
        <group position={[0, -length, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[bobSize, 12, 8]} />
            <meshToonMaterial color={color} emissive={color} emissiveIntensity={0.15} />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[new THREE.SphereGeometry(bobSize, 12, 8)]} />
            <lineBasicMaterial color="#1a1a2e" transparent opacity={0.4} />
          </lineSegments>
          <pointLight intensity={0.3} color={color} distance={2} />
        </group>
      </group>
    </group>
  );
}

// ─── Origami Crane (Animated Unfold) ──────────────────────────────────
// Paper crane that unfolds from a flat sheet

interface OrigamiCraneProps {
  position?: [number, number, number];
  color?: string;
  size?: number;
  foldProgress?: number; // 0 = flat, 1 = fully folded
  animate?: boolean;
}

export function OrigamiCrane({
  position = [0, 0, 0],
  color = "#fdf6e3",
  size = 1,
  foldProgress = 1,
  animate = false,
}: OrigamiCraneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const progress = useRef(foldProgress);

  useFrame((state, delta) => {
    if (!animate || !groupRef.current) return;
    progress.current = Math.min(1, progress.current + delta * 0.3);
    groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.1;
  });

  const fold = animate ? progress.current : foldProgress;

  // Create crane geometry from triangles
  const bodyGeo = useMemo(() => {
    const shape = new THREE.Shape();
    // Diamond body
    shape.moveTo(0, size * 0.5);
    shape.lineTo(size * 0.3, 0);
    shape.lineTo(0, -size * 0.5);
    shape.lineTo(-size * 0.3, 0);
    shape.closePath();
    const geo = new THREE.ShapeGeometry(shape);
    return geo;
  }, [size]);

  const wingAngle = (1 - fold) * Math.PI * 0.3;

  return (
    <group ref={groupRef} position={position}>
      {/* Body */}
      <mesh geometry={bodyGeo} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <meshToonMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {/* Left wing */}
      <group rotation={[0, 0, wingAngle]}>
        <mesh position={[-size * 0.2, 0, 0]} castShadow>
          <coneGeometry args={[size * 0.2, size * 0.6, 3]} />
          <meshToonMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* Right wing */}
      <group rotation={[0, 0, -wingAngle]}>
        <mesh position={[size * 0.2, 0, 0]} castShadow>
          <coneGeometry args={[size * 0.2, size * 0.6, 3]} />
          <meshToonMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* Head */}
      <group rotation={[0, 0, 0]} position={[0, 0, -size * 0.3]}>
        <mesh rotation={[0.3, 0, 0]} castShadow>
          <coneGeometry args={[0.05, size * 0.25, 3]} />
          <meshToonMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* Tail */}
      <group position={[0, 0, size * 0.3]}>
        <mesh rotation={[-0.4, 0, 0]} castShadow>
          <coneGeometry args={[0.04, size * 0.2, 3]} />
          <meshToonMaterial color={color} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {/* Edge outlines */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(size * 0.6, 0.01, size * 1)]} />
        <lineBasicMaterial color="#1a1a2e" transparent opacity={0.3} />
      </lineSegments>
    </group>
  );
}

// ─── Tetrahedron Chain ────────────────────────────────────────────────
// Connected tetrahedrons forming a DNA-like helix

interface TetrahedronChainProps {
  position?: [number, number, number];
  count?: number;
  radius?: number;
  spacing?: number;
  color?: string;
  autoRotate?: boolean;
}

export function TetrahedronChain({
  position = [0, 0, 0],
  count = 16,
  radius = 1,
  spacing = 0.5,
  color = "#c084fc",
  autoRotate = true,
}: TetrahedronChainProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.3;
    }
  });

  const PHI = 1.618033988749895;

  return (
    <group ref={groupRef} position={position}>
      {Array.from({ length: count }, (_, i) => {
        const t = i / count;
        const angle = i * PHI * Math.PI * 2;
        const y = (t - 0.5) * count * spacing;
        const r = radius * (1 - Math.abs(t - 0.5) * 0.5);
        const x = Math.cos(angle) * r;
        const z = Math.sin(angle) * r;
        const hue = t * 0.2;
        const c = new THREE.Color(color);
        c.offsetHSL(hue, 0, 0);
        return (
          <group key={i} position={[x, y, z]} rotation={[angle, 0, 0]}>
            <mesh castShadow>
              <tetrahedronGeometry args={[0.2, 0]} />
              <meshToonMaterial color={c} emissive={c} emissiveIntensity={0.1} />
            </mesh>
            <lineSegments>
              <edgesGeometry args={[new THREE.TetrahedronGeometry(0.2, 0)]} />
              <lineBasicMaterial color="#1a1a2e" transparent opacity={0.4} />
            </lineSegments>
            {/* Connect to next */}
            {i < count - 1 && (
              <mesh position={[0, -spacing * 0.5, 0]}>
                <cylinderGeometry args={[0.01, 0.01, spacing * 0.8, 3]} />
                <meshToonMaterial color="#1a1a2e" transparent opacity={0.2} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

// ─── Wave Surface ─────────────────────────────────────────────────────
// Animated sine wave surface with paper craft edges

interface WaveSurfaceProps {
  position?: [number, number, number];
  width?: number;
  depth?: number;
  resolution?: number;
  amplitude?: number;
  frequency?: number;
  color?: string;
  autoAnimate?: boolean;
}

export function WaveSurface({
  position = [0, 0, 0],
  width = 6,
  depth = 6,
  resolution = 40,
  amplitude = 0.5,
  frequency = 2,
  color = "#67e8f9",
  autoAnimate = true,
}: WaveSurfaceProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const basePositions = useRef<Float32Array | null>(null);

  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(width, depth, resolution, resolution);
    basePositions.current = new Float32Array(g.attributes.position.array);
    g.rotateX(-Math.PI / 2);
    return g;
  }, [width, depth, resolution]);

  const _waveEdgeGeo = useMemo(() => new THREE.EdgesGeometry(geo, 20), [geo]);

  useFrame((state) => {
    if (!meshRef.current || !basePositions.current || !autoAnimate) return;
    const time = state.clock.elapsedTime;
    const pos = meshRef.current.geometry.attributes.position;
    const base = basePositions.current;

    for (let i = 0; i < pos.count; i++) {
      const bx = base[i * 3];
      const bz = base[i * 3 + 2];
      // Two-wave interference pattern
      const wave1 = Math.sin(bx * frequency + time) * amplitude;
      const wave2 = Math.cos(bz * frequency * 0.7 + time * 0.8) * amplitude * 0.5;
      const wave3 = Math.sin((bx + bz) * frequency * 0.5 + time * 1.2) * amplitude * 0.3;
      pos.setY(i, wave1 + wave2 + wave3);
    }
    pos.needsUpdate = true;
    meshRef.current.geometry.computeVertexNormals();
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} geometry={geo} receiveShadow castShadow>
        <meshToonMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      <lineSegments geometry={_waveEdgeGeo}>
        <lineBasicMaterial color="#1a1a2e" transparent opacity={0.15} />
      </lineSegments>
    </group>
  );
}

// ─── Util: Mulberry32 PRNG ────────────────────────────────────────────
function mulberry32(seed: number) {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
