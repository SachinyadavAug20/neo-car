"use client";

import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { NarrativeState, getCurrentAct, getCurrentBeat } from "@/app/lib/narrative";
import { ConeTree, BonsaiTree } from "./LSystemTree";
import FluidWater from "./FluidWater";

// ─── World Constants ──────────────────────────────────────────────────
// Act 1: [0, 0, 0]       — Cliff edge (center)
// Act 2: [40, 0, 0]      — Storm area (right)
// Act 3: [-40, 0, 0]     — Forest (left)
// Act 4/5: [0, 0, -40]   — Unfolded Lands (back)
// Act 6/7: [0, 0, 40]    — Water / Pip (front)
// Act 8: [0, 15, 0]      — Aerial finale

const ACT_POSITIONS = {
  cliff: [0, 0, 0] as [number, number, number],
  storm: [40, 0, 0] as [number, number, number],
  forest: [-40, 0, 0] as [number, number, number],
  unfolded: [0, 0, -40] as [number, number, number],
  water: [0, 0, 40] as [number, number, number],
  aerial: [0, 15, 0] as [number, number, number],
};

// ─── Poisson Disk Sampling ────────────────────────────────────────────

function poissonDisk(radius: number, k = 30, width = 120, height = 120): [number, number][] {
  const cellSize = radius / Math.SQRT2;
  const cols = Math.ceil(width / cellSize);
  const rows = Math.ceil(height / cellSize);
  const grid: (number | null)[][] = Array.from({ length: rows }, () => Array(cols).fill(null));
  const points: [number, number][] = [];
  const active: [number, number][] = [];
  const toGrid = (x: number, y: number) => [Math.floor((x + width / 2) / cellSize), Math.floor((y + height / 2) / cellSize)] as const;
  const start: [number, number] = [(Math.random() - 0.5) * width * 0.6, (Math.random() - 0.5) * height * 0.6];
  points.push(start);
  active.push(start);
  const [gx, gy] = toGrid(start[0], start[1]);
  if (gy >= 0 && gy < rows && gx >= 0 && gx < cols) grid[gy][gx] = 0;
  while (active.length > 0) {
    const idx = Math.floor(Math.random() * active.length);
    const [cx, cy] = active[idx];
    let found = false;
    for (let n = 0; n < k; n++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = radius + Math.random() * radius;
      const nx = cx + Math.cos(angle) * dist;
      const ny = cy + Math.sin(angle) * dist;
      if (Math.abs(nx) > width / 2 || Math.abs(ny) > height / 2) continue;
      const [ngx, ngy] = toGrid(nx, ny);
      if (ngx < 0 || ngx >= cols || ngy < 0 || ngy >= rows) continue;
      let ok = true;
      for (let dy = -2; dy <= 2 && ok; dy++) {
        for (let dx = -2; dx <= 2 && ok; dx++) {
          const g2x = ngx + dx, g2y = ngy + dy;
          if (g2x >= 0 && g2x < cols && g2y >= 0 && g2y < rows && grid[g2y][g2x] !== null) {
            const p = points[grid[g2y][g2x]!];
            if ((nx - p[0]) ** 2 + (ny - p[1]) ** 2 < radius * radius) ok = false;
          }
        }
      }
      if (ok) {
        const pi = points.length;
        points.push([nx, ny]);
        active.push([nx, ny]);
        if (ngy >= 0 && ngy < rows && ngx >= 0 && ngx < cols) grid[ngy][ngx] = pi;
        found = true;
      }
    }
    if (!found) active.splice(idx, 1);
  }
  return points;
}

// ─── Wind System ──────────────────────────────────────────────────────

const WIND = {
  strength: 0.3,
  speed: 1.2,
  gust: 0,
  getOffset(t: number, seed: number) {
    return Math.sin(t * this.speed + seed * 2.1) * this.strength + Math.sin(t * 0.3 + seed) * this.gust;
  }
};

// ─── Shared Geometry Cache ────────────────────────────────────────────

const GEO_CACHE = new Map<string, THREE.BufferGeometry>();
const EDGE_CACHE = new Map<string, THREE.EdgesGeometry>();

function getGeo(key: string, factory: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let g = GEO_CACHE.get(key);
  if (!g) { g = factory(); GEO_CACHE.set(key, g); }
  return g;
}

function getEdge(key: string, factory: () => THREE.EdgesGeometry): THREE.EdgesGeometry {
  let e = EDGE_CACHE.get(key);
  if (!e) { e = factory(); EDGE_CACHE.set(key, e); }
  return e;
}

const MAT_CACHE = new Map<string, THREE.MeshToonMaterial>();
const LINE_MAT = new THREE.LineBasicMaterial({ color: "#1a1a2e" });

function getMat(color: string): THREE.MeshToonMaterial {
  let m = MAT_CACHE.get(color);
  if (!m) { m = new THREE.MeshToonMaterial({ color }); MAT_CACHE.set(color, m); }
  return m;
}

const _v3 = new THREE.Vector3();
const _euler = new THREE.Euler();
const _obj3d = new THREE.Object3D();

// ─── Paper Shapes ─────────────────────────────────────────────────────

function PaperBox({ position, color, size = [1, 1, 1] as [number, number, number], rotation }: { position: [number, number, number]; color: string; size?: [number, number, number]; rotation?: [number, number, number] }) {
  const key = size.join(",");
  const geo = useMemo(() => getGeo(`box-${key}`, () => new THREE.BoxGeometry(...size)), [key]);
  const edge = useMemo(() => getEdge(`box-${key}`, () => new THREE.EdgesGeometry(new THREE.BoxGeometry(...size))), [key]);
  const mat = useMemo(() => getMat(color), [color]);
  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geo} material={mat} />
      <lineSegments geometry={edge} material={LINE_MAT} />
    </group>
  );
}

function PaperCone({ position, color, args = [1, 1.5, 6] as [number, number, number], rotation }: { position: [number, number, number]; color: string; args?: [number, number, number]; rotation?: [number, number, number] }) {
  const key = args.join(",");
  const geo = useMemo(() => getGeo(`cone-${key}`, () => new THREE.ConeGeometry(...args)), [key]);
  const edge = useMemo(() => getEdge(`cone-${key}`, () => new THREE.EdgesGeometry(new THREE.ConeGeometry(...args))), [key]);
  const mat = useMemo(() => getMat(color), [color]);
  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geo} material={mat} />
      <lineSegments geometry={edge} material={LINE_MAT} />
    </group>
  );
}

function PaperCylinder({ position, color, args = [0.5, 0.5, 1, 8] as [number, number, number, number], rotation }: { position: [number, number, number]; color: string; args?: [number, number, number, number]; rotation?: [number, number, number] }) {
  const key = args.join(",");
  const geo = useMemo(() => getGeo(`cyl-${key}`, () => new THREE.CylinderGeometry(...args)), [key]);
  const edge = useMemo(() => getEdge(`cyl-${key}`, () => new THREE.EdgesGeometry(new THREE.CylinderGeometry(...args))), [key]);
  const mat = useMemo(() => getMat(color), [color]);
  return (
    <group position={position} rotation={rotation}>
      <mesh geometry={geo} material={mat} />
      <lineSegments geometry={edge} material={LINE_MAT} />
    </group>
  );
}

function PaperSphere({ position, color, radius = 0.5 }: { position: [number, number, number]; color: string; radius?: number }) {
  const geo = useMemo(() => getGeo(`sph-${radius}`, () => new THREE.SphereGeometry(radius, 8, 8)), [radius]);
  const edge = useMemo(() => getEdge(`sph-${radius}`, () => new THREE.EdgesGeometry(new THREE.SphereGeometry(radius, 8, 8))), [radius]);
  const mat = useMemo(() => getMat(color), [color]);
  return (
    <group position={position}>
      <mesh geometry={geo} material={mat} />
      <lineSegments geometry={edge} material={LINE_MAT} />
    </group>
  );
}

function PaperTorus({ position, color, args = [0.5, 0.15, 8, 24] as [number, number, number, number] }: { position: [number, number, number]; color: string; args?: [number, number, number, number] }) {
  const key = args.join(",");
  const geo = useMemo(() => getGeo(`tor-${key}`, () => new THREE.TorusGeometry(...args)), [key]);
  const edge = useMemo(() => getEdge(`tor-${key}`, () => new THREE.EdgesGeometry(new THREE.TorusGeometry(...args))), [key]);
  const mat = useMemo(() => getMat(color), [color]);
  return (
    <group position={position}>
      <mesh geometry={geo} material={mat} />
      <lineSegments geometry={edge} material={LINE_MAT} />
    </group>
  );
}

function PaperOctahedron({ position, color, radius = 0.5 }: { position: [number, number, number]; color: string; radius?: number }) {
  const geo = useMemo(() => getGeo(`oct-${radius}`, () => new THREE.OctahedronGeometry(radius)), [radius]);
  const edge = useMemo(() => getEdge(`oct-${radius}`, () => new THREE.EdgesGeometry(new THREE.OctahedronGeometry(radius))), [radius]);
  const mat = useMemo(() => getMat(color), [color]);
  return (
    <group position={position}>
      <mesh geometry={geo} material={mat} />
      <lineSegments geometry={edge} material={LINE_MAT} />
    </group>
  );
}

function PaperTetrahedron({ position, color, radius = 0.5 }: { position: [number, number, number]; color: string; radius?: number }) {
  const geo = useMemo(() => getGeo(`tet-${radius}`, () => new THREE.TetrahedronGeometry(radius)), [radius]);
  const edge = useMemo(() => getEdge(`tet-${radius}`, () => new THREE.EdgesGeometry(new THREE.TetrahedronGeometry(radius))), [radius]);
  const mat = useMemo(() => getMat(color), [color]);
  return (
    <group position={position}>
      <mesh geometry={geo} material={mat} />
      <lineSegments geometry={edge} material={LINE_MAT} />
    </group>
  );
}

// ─── Terrain ──────────────────────────────────────────────────────────

function Terrain() {
  const mesh = useMemo(() => {
    const geo = new THREE.PlaneGeometry(240, 240, 80, 80);
    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const h = Math.sin(x * 0.012) * Math.cos(y * 0.012) * 0.5
        + Math.sin(x * 0.03 + 1.5) * Math.cos(y * 0.02) * 0.25;
      positions.setZ(i, h);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={mesh} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <meshToonMaterial color="#e8e0d4" />
    </mesh>
  );
}

// ─── Jump Particle Burst ─────────────────────────────────────────────

function JumpBurst({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particles = useRef<Array<{ pos: THREE.Vector3; vel: THREE.Vector3; life: number }>>([]);
  const activeRef = useRef(false);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    const handler = () => {
      activeRef.current = true;
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2;
        particles.current.push({
          pos: new THREE.Vector3(position[0], position[1] + 0.2, position[2]),
          vel: new THREE.Vector3(
            Math.cos(angle) * (1.5 + Math.random()),
            2 + Math.random() * 2,
            Math.sin(angle) * (1.5 + Math.random())
          ),
          life: 1,
        });
      }
    };
    window.addEventListener("milo-jump", handler);
    return () => window.removeEventListener("milo-jump", handler);
  }, [position]);

  useFrame((_, delta) => {
    if (!meshRef.current || particles.current.length === 0) return;
    let alive = 0;
    particles.current.forEach((p, i) => {
      p.life -= delta * 2;
      if (p.life <= 0) return;
      p.vel.y -= delta * 6;
      p.pos.addScaledVector(p.vel, delta);
      dummy.position.copy(p.pos);
      dummy.scale.setScalar(p.life * 0.08);
      dummy.rotation.set(p.life * 5, p.life * 3, 0);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      alive++;
    });
    if (alive > 0) meshRef.current.instanceMatrix.needsUpdate = true;
    if (alive === 0) particles.current.length = 0;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 12]} frustumCulled={false}>
      <tetrahedronGeometry args={[1, 0]} />
      <meshToonMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={0.5} />
    </instancedMesh>
  );
}

// ─── Characters ───────────────────────────────────────────────────────

function MiloCrane({ position, act }: { position: [number, number, number]; act: number }) {
  const ref = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Group>(null);
  const wingR = useRef<THREE.Group>(null);
  const jumpAnimRef = useRef(0);

  useEffect(() => {
    const handler = () => { jumpAnimRef.current = 1; };
    window.addEventListener("milo-jump", handler);
    return () => window.removeEventListener("milo-jump", handler);
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;

    jumpAnimRef.current *= 0.90;
    const jumpBoost = jumpAnimRef.current * 4;

    if (act <= 1) {
      ref.current.position.y = position[1] + Math.abs(Math.sin(t * 3)) * 0.3 + jumpBoost;
      ref.current.rotation.z = Math.sin(t * 2) * 0.15 + jumpAnimRef.current * 0.5;
      if (wingL.current) wingL.current.rotation.z = Math.sin(t * 6) * 0.3 + jumpAnimRef.current * 2;
      if (wingR.current) wingR.current.rotation.z = -Math.sin(t * 6) * 0.15 - jumpAnimRef.current * 2;
    } else if (act === 2) {
      ref.current.position.y = position[1] + Math.sin(t * 4) * 2;
      ref.current.rotation.x = t * 3;
      ref.current.rotation.z = Math.sin(t * 5) * 0.5;
      if (wingL.current) wingL.current.rotation.z = Math.sin(t * 8) * 0.6;
      if (wingR.current) wingR.current.rotation.z = -Math.sin(t * 8) * 0.6;
    } else {
      ref.current.position.y = position[1] + Math.sin(t * 1.5) * 0.5;
      ref.current.rotation.y = Math.sin(t * 0.3) * 0.3;
      ref.current.rotation.z = Math.sin(t * 2) * 0.05;
      if (wingL.current) wingL.current.rotation.z = Math.sin(t * 3) * 0.3;
      if (wingR.current) wingR.current.rotation.z = -Math.sin(t * 3) * 0.3;
    }
  });

  return (
    <group ref={ref} position={position}>
      <PaperBox position={[0, 0, 0]} color="#f97316" size={[0.4, 0.08, 0.2]} />
      <PaperCone position={[0.25, 0.02, 0]} color="#f97316" args={[0.05, 0.15, 3]} />
      <group ref={wingL} position={[-0.05, 0.06, 0.12]}>
        <PaperBox position={[0, 0, 0]} color="#fb923c" size={[0.28, 0.02, 0.28]} />
      </group>
      <group ref={wingR} position={[-0.05, 0.06, -0.12]}>
        <PaperBox position={[0, 0, 0]} color="#fb923c" size={[0.18, 0.02, 0.18]} />
      </group>
      <PaperSphere position={[0, -0.12, 0]} color="#fbbf24" radius={0.05} />
      <pointLight position={[0, -0.12, 0]} intensity={0.8} color="#fbbf24" distance={4} />
    </group>
  );
}

function LiraFox({ position, visible }: { position: [number, number, number]; visible: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = Math.sin(t * 0.5) * 0.3;
    if (tailRef.current) tailRef.current.rotation.z = Math.sin(t * 2) * 0.3;
  });

  if (!visible) return null;

  return (
    <group ref={ref} position={position}>
      <PaperBox position={[0, 0.3, 0]} color="#f97316" size={[0.35, 0.25, 0.2]} />
      <PaperCone position={[0.2, 0.4, 0]} color="#f97316" args={[0.08, 0.15, 4]} />
      <PaperCone position={[0.15, 0.35, 0.1]} color="#fbbf24" args={[0.06, 0.12, 4]} />
      <PaperCone position={[0.15, 0.35, -0.1]} color="#fbbf24" args={[0.06, 0.12, 4]} />
      <group ref={tailRef} position={[-0.2, 0.35, 0]}>
        <PaperCone position={[0, 0, 0]} color="#fbbf24" args={[0.04, 0.2, 4]} rotation={[0, 0, Math.PI / 2]} />
      </group>
      <PaperSphere position={[0, 0.05, 0]} color="#f97316" radius={0.03} />
      <pointLight position={[0, 0.3, 0]} intensity={0.5} color="#f97316" distance={3} />
    </group>
  );
}

function SageOwl({ position, visible }: { position: [number, number, number]; visible: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const eyeL = useRef<THREE.Mesh>(null);
  const eyeR = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = Math.sin(t * 0.3) * 0.2;
    if (eyeL.current) eyeL.current.scale.setScalar(0.8 + Math.sin(t * 2) * 0.2);
    if (eyeR.current) eyeR.current.scale.setScalar(0.8 + Math.sin(t * 2 + 0.5) * 0.2);
  });

  if (!visible) return null;

  return (
    <group ref={ref} position={position}>
      <PaperCylinder position={[0, 0, 0]} color="#a78bfa" args={[0.2, 0.15, 0.3, 6]} />
      <PaperCone position={[0, 0.3, 0]} color="#a78bfa" args={[0.25, 0.2, 6]} />
      <PaperCone position={[-0.1, 0.45, 0]} color="#c4b5fd" args={[0.08, 0.15, 3]} />
      <PaperCone position={[0.1, 0.45, 0]} color="#c4b5fd" args={[0.08, 0.15, 3]} />
      <mesh ref={eyeL} position={[-0.07, 0.3, 0.18]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshToonMaterial color="#1a1a2e" />
      </mesh>
      <mesh ref={eyeR} position={[0.07, 0.3, 0.18]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshToonMaterial color="#1a1a2e" />
      </mesh>
      <pointLight position={[0, 0.3, 0]} intensity={0.6} color="#a78bfa" distance={3} />
    </group>
  );
}

function PipBoat({ position, visible }: { position: [number, number, number]; visible: boolean }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = position[1] + Math.sin(t * 1.5) * 0.1;
    ref.current.rotation.z = Math.sin(t * 1.2) * 0.1;
  });

  if (!visible) return null;

  return (
    <group ref={ref} position={position}>
      <PaperBox position={[0, 0, 0]} color="#fbbf24" size={[0.5, 0.08, 0.3]} />
      <PaperCone position={[0.3, 0.05, 0]} color="#fbbf24" args={[0.06, 0.15, 3]} />
      <PaperCone position={[-0.1, 0.15, 0]} color="#ffffff" args={[0.08, 0.12, 3]} />
      <pointLight position={[0, 0.2, 0]} intensity={0.7} color="#fbbf24" distance={3} />
    </group>
  );
}

// ─── Cliff Edge (Act 1) ──────────────────────────────────────────────

function CliffEdge({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <PaperBox position={[0, -0.2, 0]} color="#a8a29e" size={[2, 0.4, 2]} />
      <PaperBox position={[0.8, -0.1, 0.5]} color="#d6d3d1" size={[0.6, 0.2, 0.6]} rotation={[0, 0.3, 0.05]} />
      <PaperBox position={[-0.5, -0.3, -0.3]} color="#78716c" size={[0.8, 0.3, 0.5]} rotation={[0, -0.2, -0.03]} />
      <PaperCone position={[0.3, 0.1, 0]} color="#d6d3d1" args={[0.2, 0.3, 5]} />
    </group>
  );
}

// ─── Secret Fold (Act 5) ─────────────────────────────────────────────

function SecretFold({ position, visible, onInteract }: { position: [number, number, number]; visible: boolean; onInteract: () => void }) {
  const ref = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const interacted = useRef(false);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    if (visible) {
      ref.current.rotation.y = t * 0.5;
      ref.current.position.y = position[1] + Math.sin(t * 2) * 0.15;
      ref.current.scale.setScalar(1);
    } else {
      ref.current.scale.setScalar(0.001);
    }
    if (glowRef.current && visible) {
      const s = 1 + Math.sin(t * 4) * 0.15;
      glowRef.current.scale.set(s, s, s);
    }
  });

  useEffect(() => {
    if (!visible) {
      interacted.current = false;
    }
  }, [visible]);

  return (
    <group ref={ref} position={position} name="secretfold-group" visible={true}>
      <PaperBox position={[0, 0, 0]} color="#fbbf24" size={[0.4, 0.5, 0.05]} />
      <PaperBox position={[0, 0, 0]} color="#f59e0b" size={[0.35, 0.45, 0.05]} />
      <PaperBox position={[0, 0, 0]} color="#fbbf24" size={[0.3, 0.4, 0.05]} />
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.6, 8, 8]} />
        <meshBasicMaterial color="#fbbf24" transparent opacity={visible ? 0.15 : 0} />
      </mesh>
      <pointLight position={[0, 0, 0]} intensity={visible ? 1.5 : 0} color="#fbbf24" distance={4} />
      <mesh
        position={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          if (visible && !interacted.current) {
            interacted.current = true;
            onInteract();
          }
        }}
        onPointerOver={() => { if (visible) document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { document.body.style.cursor = "default"; }}
      >
        <boxGeometry args={[3, 3.5, 0.5]} />
        <meshBasicMaterial visible={false} />
      </mesh>
    </group>
  );
}

// ─── Forest (Act 3) ──────────────────────────────────────────────────

function Forest({ position }: { position: [number, number, number] }) {
  const trees = useMemo(() => {
    const pts = poissonDisk(3, 30, 20, 20);
    return pts.slice(0, 15).map(([x, z], i) => ({
      x,
      z,
      scale: 0.4 + Math.random() * 0.6,
      leafColor: ["#22c55e", "#16a34a", "#4ade80", "#86efac"][i % 4],
      isBonsai: i % 4 === 0,
    }));
  }, []);

  return (
    <group position={position}>
      {trees.map((t, i) => t.isBonsai ? (
        <BonsaiTree
          key={i}
          position={[t.x, 0, t.z]}
          scale={t.scale}
          leafColor={t.leafColor}
        />
      ) : (
        <ConeTree
          key={i}
          position={[t.x, 0, t.z]}
          scale={t.scale}
          leafColor={t.leafColor}
        />
      ))}
    </group>
  );
}

// ─── Storm Debris (Act 2) ────────────────────────────────────────────

function StormDebris() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const debris = useMemo(() => Array.from({ length: 30 }, () => ({
    x: (Math.random() - 0.5) * 12,
    y: Math.random() * 4 + 0.5,
    z: (Math.random() - 0.5) * 12,
    speed: 3 + Math.random() * 5,
    rotSpeed: (Math.random() - 0.5) * 8,
    size: 0.05 + Math.random() * 0.1,
  })), []);

  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    debris.forEach((d, i) => {
      d.x += d.speed * 0.03 + Math.sin(t * 2 + i) * 0.05;
      d.y += Math.sin(t * 3 + i * 0.7) * 0.02;
      if (d.x > 8) d.x = -8;
      _obj3d.position.set(d.x, d.y, d.z);
      _obj3d.rotation.set(t * d.rotSpeed, t * d.rotSpeed * 0.7, 0);
      _obj3d.scale.set(d.size, d.size * 0.3, d.size);
      _obj3d.updateMatrix();
      meshRef.current!.setMatrixAt(i, _obj3d.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 30]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshToonMaterial color="#d6d3d1" transparent opacity={0.6} />
    </instancedMesh>
  );
}

// ─── Wind Visualizer (Act 2) ─────────────────────────────────────────

function WindVisualizer({ active }: { active: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const lines = useMemo(() => Array.from({ length: 40 }, () => ({
    x: (Math.random() - 0.5) * 20,
    y: Math.random() * 4,
    z: (Math.random() - 0.5) * 20,
    speed: 2 + Math.random() * 3,
    length: 0.5 + Math.random() * 1,
  })), []);

  useFrame((state) => {
    if (!meshRef.current || !active) return;
    const t = state.clock.elapsedTime;
    lines.forEach((l, i) => {
      l.x += l.speed * 0.05;
      if (l.x > 10) l.x = -10;
      _obj3d.position.set(l.x, l.y + Math.sin(t + i) * 0.2, l.z);
      _obj3d.scale.set(l.length, 0.005, 0.005);
      _obj3d.rotation.set(0, 0, 0);
      _obj3d.updateMatrix();
      meshRef.current!.setMatrixAt(i, _obj3d.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });

  if (!active) return null;
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 40]} frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#1a1a2e" transparent opacity={0.15} />
    </instancedMesh>
  );
}

// ─── Floating Clouds ──────────────────────────────────────────────────

function FloatingCloud({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.x = position[0] + Math.sin(t * 0.12 + position[2]) * 3 + WIND.getOffset(t, position[0]) * 2;
    ref.current.position.y = position[1] + Math.sin(t * 0.25 + position[0]) * 0.2;
    ref.current.rotation.z = WIND.getOffset(t, position[2]) * 0.1;
  });
  return (
    <group ref={ref} position={position}>
      <PaperSphere position={[0, 0, 0]} color="#ffffff" radius={0.7} />
      <PaperSphere position={[0.6, 0.05, 0]} color="#ffffff" radius={0.5} />
      <PaperSphere position={[-0.5, -0.05, 0.1]} color="#ffffff" radius={0.45} />
    </group>
  );
}

// ─── Wind Particles (global) ──────────────────────────────────────────

function WindParticles() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particles = useMemo(() => Array.from({ length: 100 }, () => ({
    x: (Math.random() - 0.5) * 100, y: Math.random() * 15, z: (Math.random() - 0.5) * 100,
    speed: 0.5 + Math.random() * 1.5, size: 0.02 + Math.random() * 0.03,
  })), []);
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.elapsedTime;
    particles.forEach((p, i) => {
      p.x += p.speed * 0.04 + WIND.getOffset(t, i) * 0.02;
      if (p.x > 50) p.x = -50;
      _obj3d.position.set(p.x, p.y + Math.sin(t + i) * 0.3, p.z);
      _obj3d.scale.setScalar(p.size);
      _obj3d.updateMatrix();
      meshRef.current!.setMatrixAt(i, _obj3d.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, 100]} frustumCulled={false}>
      <sphereGeometry args={[1, 4, 4]} />
      <meshBasicMaterial color="#1a1a2e" transparent opacity={0.06} />
    </instancedMesh>
  );
}

// ─── Water Surface ────────────────────────────────────────────────────

function WaterSurface({ position }: { position: [number, number, number] }) {
  return (
    <FluidWater
      position={position}
      radius={4}
      segments={48}
      waveHeight={0.08}
      waveFrequency={1.5}
      colorDeep="#1e40af"
      colorShallow="#7dd3fc"
      opacity={0.7}
    />
  );
}

// ─── Conway's Paper Grid (Act 4/5) ───────────────────────────────────

const CONWAY_SIZE = 20;
const CONWAY_CELLS = CONWAY_SIZE * CONWAY_SIZE;
const CONWAY_UPDATE_INTERVAL = 8;

function ConwayPaperGrid({ visible, playerPos }: { visible: boolean; playerPos: [number, number, number] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const edgeMeshRef = useRef<THREE.InstancedMesh>(null);
  const gridRef = useRef<number[]>(Array(CONWAY_CELLS).fill(0));
  const targetScales = useRef<Float32Array>(new Float32Array(CONWAY_CELLS));
  const frameCount = useRef(0);
  const initialized = useRef(false);

  const cellSize = 0.5;
  const halfGrid = (CONWAY_SIZE * cellSize) / 2;

  const cellGeo = useMemo(() => new THREE.BoxGeometry(cellSize * 0.9, 0.08, cellSize * 0.9), []);
  const edgeGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(cellSize * 0.9, 0.08, cellSize * 0.9)), []);
  const aliveMat = useMemo(() => new THREE.MeshToonMaterial({ color: "#e8e0d4" }), []);
  const edgeMat = useMemo(() => new THREE.LineBasicMaterial({ color: "#1a1a2e", transparent: true, opacity: 0.3 }), []);

  const seedGrid = useCallback(() => {
    const g = gridRef.current;
    for (let i = 0; i < CONWAY_CELLS; i++) g[i] = 0;
    const cx = CONWAY_SIZE / 2;
    const cy = CONWAY_SIZE / 2;
    const patterns = [
      [0, 1], [1, 2], [2, 0], [2, 1], [2, 2],
      [4, 5], [4, 6], [4, 7],
      [-3, -3], [-3, -2], [-2, -3], [-2, -2],
      ...Array.from({ length: 30 }, () => [
        Math.floor(Math.random() * CONWAY_SIZE),
        Math.floor(Math.random() * CONWAY_SIZE),
      ]),
    ];
    for (const [dy, dx] of patterns) {
      const x = cx + dx;
      const y = cy + dy;
      if (x >= 0 && x < CONWAY_SIZE && y >= 0 && y < CONWAY_SIZE) {
        g[y * CONWAY_SIZE + x] = 1;
      }
    }
    for (let i = 0; i < CONWAY_CELLS; i++) {
      targetScales.current[i] = g[i] ? 1 : 0;
    }
    initialized.current = true;
  }, []);

  const stepGrid = useCallback(() => {
    const g = gridRef.current;
    const next = new Array(CONWAY_CELLS).fill(0);
    for (let y = 0; y < CONWAY_SIZE; y++) {
      for (let x = 0; x < CONWAY_SIZE; x++) {
        let neighbors = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (dx === 0 && dy === 0) continue;
            const nx = (x + dx + CONWAY_SIZE) % CONWAY_SIZE;
            const ny = (y + dy + CONWAY_SIZE) % CONWAY_SIZE;
            neighbors += g[ny * CONWAY_SIZE + nx];
          }
        }
        const idx = y * CONWAY_SIZE + x;
        const alive = g[idx];
        if (alive) {
          next[idx] = (neighbors === 2 || neighbors === 3) ? 1 : 0;
        } else {
          next[idx] = neighbors === 3 ? 1 : 0;
        }
      }
    }
    for (let i = 0; i < CONWAY_CELLS; i++) {
      g[i] = next[i];
      targetScales.current[i] = next[i] ? 1 : 0;
    }
  }, []);

  useEffect(() => {
    if (visible && !initialized.current) {
      seedGrid();
    }
  }, [visible, seedGrid]);

  useFrame(() => {
    if (!meshRef.current || !visible || !initialized.current) return;
    frameCount.current++;
    if (frameCount.current % CONWAY_UPDATE_INTERVAL === 0) stepGrid();

    const mesh = meshRef.current;
    const edgeMesh = edgeMeshRef.current;
    const dummy = _obj3d;
    const g = gridRef.current;
    const ts = targetScales.current;

    for (let i = 0; i < CONWAY_CELLS; i++) {
      const row = Math.floor(i / CONWAY_SIZE);
      const col = i % CONWAY_SIZE;
      const x = col * cellSize - halfGrid;
      const z = row * cellSize - halfGrid;
      const alive = g[i];
      const targetScale = ts[i];

      dummy.position.set(x, alive ? 0.04 : 0, z);
      dummy.scale.set(1, targetScale, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);

      if (edgeMesh) {
        dummy.position.set(x, alive ? 0.05 : -0.1, z);
        dummy.scale.set(1, targetScale, 1);
        dummy.updateMatrix();
        edgeMesh.setMatrixAt(i, dummy.matrix);
      }
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (edgeMesh) edgeMesh.instanceMatrix.needsUpdate = true;
  });

  if (!visible) return null;

  return (
    <group position={[0, -0.47, -40]}>
      <instancedMesh ref={meshRef} args={[cellGeo, aliveMat, CONWAY_CELLS]} frustumCulled={false} castShadow receiveShadow />
      <instancedMesh ref={edgeMeshRef} args={[edgeGeo, edgeMat, CONWAY_CELLS]} frustumCulled={false} />
    </group>
  );
}

// ─── Lore Nodes ───────────────────────────────────────────────────────

export interface LoreEntry {
  id: string;
  title: string;
  content: string;
}

const LORE_ENTRIES: LoreEntry[] = [
  {
    id: "lore-1",
    title: "Sage's First Fold",
    content: `## On the Nature of Paper\n\n> "Every fold is a decision. Every crease is a memory.\n> The paper does not forget — it simply waits\n> for someone brave enough to unfold it."\n\n— Sage, the Keeper of Folds`,
  },
  {
    id: "lore-2",
    title: "The Wind's Dictionary",
    content: `## The Wind Speaks\n\nThe wind has no mouth, but it tells stories.\n\nIt folds cranes from flat sheets.\nIt tears mountains from plains.\nIt whispers to those who listen:\n\n*"You are not what you were made into.\nYou are what you choose to become."*`,
  },
  {
    id: "lore-3",
    title: "Pip's Logbook",
    content: `## Day 47 at Sea\n\nThe water is paper too.\nEverything is paper.\n\nI stopped being a crane\nand started being a boat\nwhen I stopped fighting\nthe fold and became it.\n\nThe wind does not destroy.\nIt transforms.`,
  },
  {
    id: "lore-4",
    title: "The Geometry of Grief",
    content: `## Lira's Notes\n\nWhen Pip left,\nI folded myself small.\nSmall enough to hide\nbetween the cone trees.\n\nBut small is not safe.\nSmall is just small.\n\nMilo taught me:\nunfold. Be everything.`,
  },
  {
    id: "lore-5",
    title: "The Secret Fold",
    content: `## The Last Instruction\n\nTo make the secret fold:\n\n1. Hold the paper to your heart\n2. Do not think about wings\n3. Think about wind\n4. Let go\n\nThe fold appears\nnot in the paper,\nbut in you.`,
  },
];

function LoreNodes({ visible, onCollect }: { visible: boolean; onCollect: (entry: LoreEntry) => void }) {
  const nodesRef = useRef<THREE.Group>(null);
  const [collected, setCollected] = useState<Set<string>>(new Set());
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const positions = useMemo(() => {
    const pts = poissonDisk(8, 20, 80, 80);
    return pts.slice(0, LORE_ENTRIES.length).map(([x, z]) => [x, 1.5, z] as [number, number, number]);
  }, []);

  useFrame((state) => {
    if (!nodesRef.current) return;
    const t = state.clock.elapsedTime;
    nodesRef.current.children.forEach((child, i) => {
      if (collected.has(LORE_ENTRIES[i]?.id)) {
        child.scale.setScalar(0);
        return;
      }
      child.rotation.y = t * 0.5 + i;
      child.position.y = positions[i][1] + Math.sin(t * 2 + i) * 0.15;
      const isHov = hoveredId === LORE_ENTRIES[i]?.id;
      child.scale.setScalar(isHov ? 1.3 : 1);
    });
  });

  if (!visible) return null;

  return (
    <group ref={nodesRef}>
      {positions.map((pos, i) => {
        const entry = LORE_ENTRIES[i];
        if (!entry || collected.has(entry.id)) return null;
        return (
          <group
            key={entry.id}
            position={pos}
            onPointerOver={(e) => { e.stopPropagation(); setHoveredId(entry.id); document.body.style.cursor = "pointer"; }}
            onPointerOut={() => { setHoveredId(null); document.body.style.cursor = "default"; }}
            onClick={(e) => {
              e.stopPropagation();
              setCollected(prev => new Set(prev).add(entry.id));
              document.body.style.cursor = "default";
              onCollect(entry);
            }}
          >
            <mesh>
              <octahedronGeometry args={[0.2, 0]} />
              <meshToonMaterial color="#a78bfa" emissive="#7c3aed" emissiveIntensity={0.3} />
            </mesh>
            <lineSegments>
              <edgesGeometry args={[new THREE.OctahedronGeometry(0.2, 0)]} />
              <lineBasicMaterial color="#c4b5fd" transparent opacity={0.6} />
            </lineSegments>
            <pointLight position={[0, 0, 0]} intensity={0.5} color="#a78bfa" distance={2} />
          </group>
        );
      })}
    </group>
  );
}

// ─── Console Easter Eggs ──────────────────────────────────────────────

function logConsoleEasterEggs() {
  if (typeof window === "undefined" || (window as any).__DRIFT_CONSOLE_LOGGED) return;
  (window as any).__DRIFT_CONSOLE_LOGGED = true;
  console.log(
    "%c✦ DRIFT: A Paper World ✦",
    "color: #a78bfa; font-size: 16px; font-weight: bold;"
  );
  console.log(
    "%cYou found the hidden console. The paper remembers those who look closely.",
    "color: #9ca3af; font-style: italic;"
  );
}

// ─── Main World ───────────────────────────────────────────────────────

interface PaperWorldProps {
  narrativeState: NarrativeState;
  onSecretFoldInteract: () => void;
  windForce?: number;
  onLoreCollect?: (entry: LoreEntry) => void;
}

export default function PaperWorld({ narrativeState, onSecretFoldInteract, windForce = 0.3, onLoreCollect }: PaperWorldProps) {
  const { scene, camera, gl } = useThree();
  if (!narrativeState) return <group><Terrain /></group>;
  const act = getCurrentAct(narrativeState);
  const beat = getCurrentBeat(narrativeState);
  const currentAct = (narrativeState.currentAct ?? 0) + 1;
  const windActive = currentAct === 2 && beat?.interaction === "drag-wind" && narrativeState.interactionState !== "complete";

  // DOM-level click fallback for SecretFold
  const secretFoldInteracted = useRef(false);
  useEffect(() => {
    if (currentAct !== 5 || secretFoldInteracted.current) return;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const onClick = (e: MouseEvent) => {
      if (secretFoldInteracted.current) return;
      // Exit pointer lock so we can get accurate mouse coords
      if (document.pointerLockElement) document.exitPointerLock();
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const secretFoldGroup = scene.getObjectByName("secretfold-group");
      if (secretFoldGroup) {
        const intersects = raycaster.intersectObject(secretFoldGroup, true);
        if (intersects.length > 0) {
          secretFoldInteracted.current = true;
          onSecretFoldInteract();
        }
      }
    };
    gl.domElement.addEventListener("click", onClick);
    return () => {
      gl.domElement.removeEventListener("click", onClick);
    };
  }, [currentAct, camera, gl, scene, onSecretFoldInteract]);

  useEffect(() => { secretFoldInteracted.current = false; }, [currentAct]);
  useEffect(() => { logConsoleEasterEggs(); }, []);
  useEffect(() => { WIND.strength = windForce; }, [windForce]);

  // Terminal mood override
  useEffect(() => {
    const handler = (e: Event) => {
      const mood = (e as CustomEvent).detail?.mood;
      if (!mood) return;
      let bgColor = "#fdf6e3";
      let fogNear = 30;
      let fogFar = 100;
      switch (mood) {
        case "storm": bgColor = "#e5e7eb"; fogNear = 20; fogFar = 60; break;
        case "calm": bgColor = "#f0fdf4"; fogNear = 35; fogFar = 100; break;
        case "secret": bgColor = "#faf5ff"; fogNear = 25; fogFar = 70; break;
        case "sorrow": bgColor = "#fef3c7"; fogNear = 30; fogFar = 80; break;
        case "hope": bgColor = "#fff7ed"; fogNear = 35; fogFar = 100; break;
        case "final": bgColor = "#fefce8"; fogNear = 40; fogFar = 120; break;
      }
      const targetColor = new THREE.Color(bgColor);
      gsap.to(scene.background as THREE.Color, { r: targetColor.r, g: targetColor.g, b: targetColor.b, duration: 1.5, ease: "power2.inOut" });
      if (scene.fog instanceof THREE.Fog) {
        gsap.to(scene.fog, { near: fogNear, far: fogFar, duration: 1.5, ease: "power2.inOut" });
        gsap.to(scene.fog.color, { r: targetColor.r, g: targetColor.g, b: targetColor.b, duration: 1.5, ease: "power2.inOut" });
      }
    };
    window.addEventListener("set-mood", handler);
    return () => window.removeEventListener("set-mood", handler);
  }, [scene]);

  // Mood-based environment changes
  useEffect(() => {
    if (!act) return;
    const mood = beat?.mood || "warm";
    let bgColor = "#fdf6e3";
    let fogNear = 30;
    let fogFar = 100;

    switch (mood) {
      case "storm": bgColor = "#e5e7eb"; fogNear = 20; fogFar = 60; break;
      case "calm": bgColor = "#f0fdf4"; fogNear = 35; fogFar = 100; break;
      case "secret": bgColor = "#faf5ff"; fogNear = 25; fogFar = 70; break;
      case "sorrow": bgColor = "#fef3c7"; fogNear = 30; fogFar = 80; break;
      case "hope": bgColor = "#fff7ed"; fogNear = 35; fogFar = 100; break;
      case "final": bgColor = "#fefce8"; fogNear = 40; fogFar = 120; break;
    }

    if (beat?.envChange) {
      if (beat.envChange.bgColor) bgColor = beat.envChange.bgColor;
      if (beat.envChange.fogNear) fogNear = beat.envChange.fogNear;
      if (beat.envChange.fogFar) fogFar = beat.envChange.fogFar;
    }

    const targetColor = new THREE.Color(bgColor);
    gsap.to(scene.background as THREE.Color, { r: targetColor.r, g: targetColor.g, b: targetColor.b, duration: 2, ease: "power2.inOut" });
    if (scene.fog instanceof THREE.Fog) {
      gsap.to(scene.fog, { near: fogNear, far: fogFar, duration: 2, ease: "power2.inOut" });
      gsap.to(scene.fog.color, { r: targetColor.r, g: targetColor.g, b: targetColor.b, duration: 2, ease: "power2.inOut" });
    }
  }, [currentAct, beat?.mood, beat?.envChange]);

  // Poisson positions for distant landmarks
  const landmarkPositions = useMemo(() => ({
    monoliths: poissonDisk(14, 25, 140, 140),
    rings: poissonDisk(20, 20, 140, 140),
  }), []);

  return (
    <group>
      <Terrain />
      <WindParticles />
      <WindVisualizer active={windActive} />

      {/* ═══ ACT 1: Cliff Edge [0, 0, 0] ═══ */}
      <CliffEdge position={ACT_POSITIONS.cliff} />
      {currentAct === 1 && (
        <>
          <MiloCrane position={[0, 0.5, 0]} act={currentAct} />
          <JumpBurst position={[0, 0.5, 0]} />
        </>
      )}

      {/* ═══ ACT 2: Storm [40, 0, 0] ═══ */}
      {currentAct >= 2 && (
        <group position={ACT_POSITIONS.storm}>
          <PaperCylinder position={[0, 0.3, 0]} color="#78716c" args={[0.3, 0.35, 0.6, 6]} />
          <PaperCylinder position={[2, 0.2, -1]} color="#a8a29e" args={[0.25, 0.3, 0.4, 6]} />
          <PaperCone position={[1, 0.15, 0.5]} color="#d6d3d1" args={[0.2, 0.3, 5]} />
          {currentAct === 2 && <StormDebris />}
        </group>
      )}
      {currentAct === 2 && <MiloCrane position={[40, 0.5, 0]} act={currentAct} />}

      {/* ═══ ACT 3: Forest [-40, 0, 0] ═══ */}
      {currentAct >= 3 && <Forest position={ACT_POSITIONS.forest} />}
      {currentAct >= 3 && currentAct <= 4 && (
        <>
          <LiraFox position={[-40, 0, -3]} visible={true} />
          <MiloCrane position={[-40, 0.5, 3]} act={currentAct} />
        </>
      )}

      {/* ═══ ACT 4/5: Unfolded Lands [0, 0, -40] ═══ */}
      {currentAct >= 4 && (
        <group position={ACT_POSITIONS.unfolded}>
          <ConwayPaperGrid visible={currentAct >= 4} playerPos={[0, 0, -40]} />
          <group position={[0, -0.48, 0]}>
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[6, 24]} />
              <meshToonMaterial color="#ffffff" transparent opacity={0.3} />
            </mesh>
            <PaperBox position={[0, 0, 0]} color="#d6d3d1" size={[0.5, 0.3, 0.5]} />
            <PaperBox position={[0, 0.3, 0]} color="#a8a29e" size={[0.45, 0.3, 0.45]} />
            <PaperBox position={[0, 0.6, 0]} color="#d6d3d1" size={[0.4, 0.3, 0.4]} />
            <PaperBox position={[0, 0.9, 0]} color="#a8a29e" size={[0.35, 0.3, 0.35]} />
            <SageOwl position={[0, 1.2, 0]} visible={currentAct >= 4} />
          </group>
        </group>
      )}
      {currentAct >= 4 && currentAct <= 5 && <MiloCrane position={[0, 0.5, -37]} act={currentAct} />}
      <SecretFold position={[0, 1.5, -40]} visible={currentAct === 5} onInteract={onSecretFoldInteract} />

      {/* ═══ ACT 6/7: Water / Pip [0, 0, 40] ═══ */}
      <WaterSurface position={[0, -0.3, 40]} />
      <PipBoat position={[0, 0, 40]} visible={currentAct >= 6} />
      {currentAct >= 6 && currentAct <= 7 && <LiraFox position={[-3, 0, 40]} visible={true} />}
      {currentAct >= 6 && <MiloCrane position={[0, 1, 38]} act={currentAct} />}

      {/* ═══ ACT 8: Aerial [0, 15, 0] ═══ */}
      {currentAct === 8 && <MiloCrane position={[0, 15, 0]} act={currentAct} />}

      {/* ═══ Lore Nodes ═══ */}
      <LoreNodes visible={currentAct >= 3} onCollect={(entry) => onLoreCollect?.(entry)} />

      {/* ═══ Clouds ═══ */}
      {[-40, 0, 40, -25, 25, -45, 45].map((x, i) => (
        <FloatingCloud key={i} position={[x, 10 + (i % 3) * 2, -18 - i * 5]} />
      ))}

      {/* ═══ Distant Landmarks ═══ */}
      {landmarkPositions.monoliths.slice(0, 5).map(([x, z], i) => (
        <group key={`mono-${i}`} position={[x, -0.5, z]}>
          {Array.from({ length: 4 + i }, (_, j) => (
            <PaperBox key={j} position={[0, j * 0.5, 0]} color={["#a8a29e", "#d6d3d1"][j % 2]} size={[0.3, 0.4, 0.3]} rotation={[0, j * 0.2, 0]} />
          ))}
          <PaperOctahedron position={[0, (4 + i) * 0.5 + 0.3, 0]} color="#fbbf24" radius={0.12} />
        </group>
      ))}

      {landmarkPositions.rings.slice(0, 3).map(([x, z], i) => (
        <group key={`ring-${i}`} position={[x, 6 + i, z]}>
          <PaperTorus position={[0, 0, 0]} color={["#a78bfa", "#f472b6", "#67e8f9"][i]} args={[0.6, 0.03, 8, 24]} />
          {[0, 1, 2, 3].map((j) => {
            const a = (j / 4) * Math.PI * 2;
            return <PaperTetrahedron key={j} position={[Math.cos(a) * 0.8, 0, Math.sin(a) * 0.8]} color={["#a78bfa", "#f472b6", "#67e8f9"][i]} radius={0.08} />;
          })}
        </group>
      ))}
    </group>
  );
}
