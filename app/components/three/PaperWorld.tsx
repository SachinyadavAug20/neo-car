"use client";

import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import gsap from "gsap";
import { NarrativeState, getCurrentAct, getCurrentBeat } from "@/app/lib/narrative";
import { ConeTree, BonsaiTree } from "./LSystemTree";
import FluidWater from "./FluidWater";
import GLTFModel from "./GLTFModel";
import { MouseParallaxEffect, PushPendulum, HiddenCritter, AmbientDust, PaperShatter, RippleEffect, PaperRain, ForestSpores, OrigamiEmbers, CraneFlock } from "./Interactions";
import { ProceduralCrystal, MengerSponge, MobiusStrip, KleinBottle, SpiralTower, VoronoiTerrain, PaperWindmill, LissajousCurve, GeodesicDome, DNAHelix, FractalIcosahedron } from "./ProceduralShapes";
import { InstancedParticles, PhysicsPendulum, OrigamiCrane, TetrahedronChain, WaveSurface } from "./InteractiveElements";
import { PaperClouds } from "./PaperClouds";
import { LightShafts } from "./LightShafts";
import { BloomingPaperFlower, LeapingPaperFrog } from "./InteractiveFloraFauna";

// ─── External Models Config ───────────────────────────────────────────
// Polyfork models (CC0, no attribution required).
// Drop .glb files in public/models/ and add entries here.
// Models are rendered with toon shading to match the paper craft aesthetic.

interface ExternalModel {
  path: string;
  position: [number, number, number];
  scale?: number;
  rotation?: [number, number, number];
  animate?: "float" | "rotate" | "bob" | "none";
  animateSpeed?: number;
  acts?: number[];
  tint?: string;
}

const EXTERNAL_MODELS: ExternalModel[] = [
  // Act 1 (Cliff) — Field Radio Set near the cliff edge
  { path: "/models/field-radio-set-b6f3fd.glb", position: [4, 0, -1], scale: 0.6, rotation: [0, 0.5, 0], acts: [1], tint: "#d6d3d1" },

  // Act 2 (Storm) — Duckboard Walkway + Dragon's Teeth as storm barriers
  { path: "/models/duckboard-walkway-b523bc.glb", position: [38, 0, 2], scale: 0.25, rotation: [0, 0.3, 0], acts: [2], tint: "#a8a29e" },
  { path: "/models/duckboard-walkway-b523bc.glb", position: [42, 0, -2], scale: 0.25, rotation: [0, -0.5, 0], acts: [2], tint: "#78716c" },
  { path: "/models/dragon-s-tooth-block-2f980d.glb", position: [44, 0, 1], scale: 0.35, rotation: [0, 0.8, 0], acts: [2], tint: "#d6d3d1" },
  { path: "/models/dragon-s-tooth-block-2f980d.glb", position: [36, 0, -1], scale: 0.35, rotation: [0, -0.3, 0], acts: [2], tint: "#a8a29e" },

  // Act 3 (Forest) — Market Stall + Duckboard as forest path
  { path: "/models/market-stall-94937d.glb", position: [-42, 0, 2], scale: 0.5, rotation: [0, 1.2, 0], acts: [3], tint: "#22c55e" },
  { path: "/models/duckboard-walkway-b523bc.glb", position: [-38, 0, -2], scale: 0.2, rotation: [0, 0.8, 0], acts: [3], tint: "#16a34a" },

  // Act 4/5 (Unfolded Lands) — Stair Core as Sage's pillar + Cafe as ancient structure
  { path: "/models/stair-and-lift-core-a13dd9.glb", position: [0, 0, -40], scale: 0.15, rotation: [0, 0, 0], acts: [4, 5], tint: "#a78bfa" },
  { path: "/models/cafe-storefront-unit-443728.glb", position: [5, 0, -42], scale: 0.12, rotation: [0, 0.5, 0], acts: [4, 5], tint: "#c4b5fd" },

  // Act 6/7 (Water) — Market Stall as dock + Duckboard as pier
  { path: "/models/market-stall-94937d.glb", position: [3, 0, 42], scale: 0.4, rotation: [0, -0.8, 0], acts: [6, 7], tint: "#67e8f9" },
  { path: "/models/duckboard-walkway-b523bc.glb", position: [-2, 0, 43], scale: 0.2, rotation: [0, 1.5, 0], acts: [6, 7], tint: "#7dd3fc" },

  // Act 8 (Aerial) — Corner Restaurant + Clinic as distant landmarks
  { path: "/models/corner-restaurant-unit-d85304.glb", position: [15, 0, 15], scale: 0.08, rotation: [0, 0.3, 0], acts: [8], tint: "#fbbf24" },
  { path: "/models/clinic-annexe-0f56d1.glb", position: [-15, 0, -15], scale: 0.08, rotation: [0, 1.0, 0], acts: [8], tint: "#f472b6" },
];

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

const _scaleVec = new THREE.Vector3();

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

function ConwayPaperGrid({ visible, playerPos, interactive = false }: { visible: boolean; playerPos: [number, number, number]; interactive?: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const edgeMeshRef = useRef<THREE.InstancedMesh>(null);
  const gridRef = useRef<number[]>(Array(CONWAY_CELLS).fill(0));
  const nextBuffer = useRef<number[]>(Array(CONWAY_CELLS).fill(0));
  const targetScales = useRef<Float32Array>(new Float32Array(CONWAY_CELLS));
  const frameCount = useRef(0);
  const initialized = useRef(false);
  const { camera, gl } = useThree();

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
    const next = nextBuffer.current;
    for (let i = 0; i < CONWAY_CELLS; i++) next[i] = 0;
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

  // Click-to-toggle handler for interactive mode
  useEffect(() => {
    if (!visible || !interactive) return;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (e: MouseEvent) => {
      if (document.pointerLockElement) document.exitPointerLock();
      const rect = gl.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      if (meshRef.current) {
        const intersects = raycaster.intersectObject(meshRef.current);
        if (intersects.length > 0) {
          const instanceId = intersects[0].instanceId;
          if (instanceId !== undefined && instanceId < CONWAY_CELLS) {
            const g = gridRef.current;
            g[instanceId] = g[instanceId] ? 0 : 1;
            targetScales.current[instanceId] = g[instanceId] ? 1 : 0;
            window.dispatchEvent(new CustomEvent("toggle-cell", { detail: { cellId: instanceId } }));
          }
        }
      }
    };

    gl.domElement.addEventListener("click", onClick);
    return () => gl.domElement.removeEventListener("click", onClick);
  }, [visible, interactive, camera, gl]);

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

  const loreOctaEdge = useMemo(() => new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.2, 0)), []);

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
              window.dispatchEvent(new CustomEvent("gem-collect"));
              onCollect(entry);
            }}
          >
            <mesh>
              <octahedronGeometry args={[0.2, 0]} />
              <meshToonMaterial color="#a78bfa" emissive="#7c3aed" emissiveIntensity={0.3} />
            </mesh>
            <lineSegments geometry={loreOctaEdge}>
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

// ─── Paper Flower ─────────────────────────────────────────────────────

function PaperFlower({ position, color = "#f472b6", petalCount = 5 }: { position: [number, number, number]; color?: string; petalCount?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = Math.sin(t * 0.5 + position[0]) * 0.2;
  });
  return (
    <group ref={ref} position={position}>
      <PaperCylinder position={[0, 0.2, 0]} color="#22c55e" args={[0.02, 0.02, 0.4, 4]} />
      {Array.from({ length: petalCount }, (_, i) => {
        const a = (i / petalCount) * Math.PI * 2;
        return (
          <PaperCone
            key={i}
            position={[Math.cos(a) * 0.12, 0.45, Math.sin(a) * 0.12]}
            color={color}
            args={[0.06, 0.1, 4]}
            rotation={[0.5, a, 0]}
          />
        );
      })}
      <PaperSphere position={[0, 0.48, 0]} color="#fbbf24" radius={0.04} />
    </group>
  );
}

// ─── Paper Rock Stack (cairn) ────────────────────────────────────────

function PaperRockStack({ position, count = 3 }: { position: [number, number, number]; count?: number }) {
  return (
    <group position={position}>
      {Array.from({ length: count }, (_, i) => (
        <PaperBox
          key={i}
          position={[0, i * 0.22, 0]}
          color={["#a8a29e", "#d6d3d1", "#78716c"][i % 3]}
          size={[0.3 + i * 0.08, 0.18, 0.25 + i * 0.05]}
          rotation={[0, i * 0.4, (i - 1) * 0.05]}
        />
      ))}
    </group>
  );
}

// ─── Paper Arch / Gateway ─────────────────────────────────────────────

function PaperArch({ position, color = "#d6d3d1", width = 2, height = 3 }: { position: [number, number, number]; color?: string; width?: number; height?: number }) {
  const archPieces = useMemo(() => {
    const pieces = [];
    const segments = 8;
    for (let i = 0; i < segments; i++) {
      const t = (i / (segments - 1)) * Math.PI;
      pieces.push({
        x: Math.cos(t) * (width / 2),
        y: Math.sin(t) * (height / 2) + 0.5,
        rot: t - Math.PI / 2,
      });
    }
    return pieces;
  }, [width, height]);

  return (
    <group position={position}>
      <PaperBox position={[-width / 2, 1, 0]} color={color} size={[0.25, 2, 0.25]} />
      <PaperBox position={[width / 2, 1, 0]} color={color} size={[0.25, 2, 0.25]} />
      {archPieces.map((p, i) => (
        <PaperBox
          key={i}
          position={[p.x, p.y, 0]}
          color={i % 2 === 0 ? color : "#a8a29e"}
          size={[0.2, 0.15, 0.2]}
          rotation={[0, 0, p.rot]}
        />
      ))}
    </group>
  );
}

// ─── Paper Lantern ────────────────────────────────────────────────────

function PaperLantern({ position, color = "#fbbf24" }: { position: [number, number, number]; color?: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = position[1] + Math.sin(t * 1.5 + position[0]) * 0.1;
  });
  return (
    <group ref={ref} position={position}>
      <PaperCylinder position={[0, 0.5, 0]} color="#1a1a2e" args={[0.01, 0.01, 0.3, 4]} />
      <PaperBox position={[0, 0, 0]} color={color} size={[0.3, 0.4, 0.3]} />
      <PaperBox position={[0, 0, 0]} color={color} size={[0.25, 0.35, 0.25]} />
      <pointLight position={[0, 0, 0]} intensity={0.8} color={color} distance={5} />
    </group>
  );
}

// ─── Paper Butterfly ──────────────────────────────────────────────────

function PaperButterfly({ position, color = "#a78bfa" }: { position: [number, number, number]; color?: string }) {
  const ref = useRef<THREE.Group>(null);
  const wingL = useRef<THREE.Group>(null);
  const wingR = useRef<THREE.Group>(null);
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.x = position[0] + Math.sin(t * 0.8 + offset) * 3;
    ref.current.position.y = position[1] + Math.sin(t * 1.2 + offset) * 0.5 + Math.sin(t * 0.5) * 0.3;
    ref.current.position.z = position[2] + Math.cos(t * 0.6 + offset) * 2;
    ref.current.rotation.y = Math.atan2(
      Math.cos(t * 0.8 + offset) * 0.8,
      -Math.sin(t * 0.6 + offset) * 0.6
    );
    if (wingL.current) wingL.current.rotation.y = Math.sin(t * 8) * 0.5;
    if (wingR.current) wingR.current.rotation.y = -Math.sin(t * 8) * 0.5;
  });

  return (
    <group ref={ref} position={position}>
      <PaperBox position={[0, 0, 0]} color="#1a1a2e" size={[0.02, 0.02, 0.08]} />
      <group ref={wingL} position={[0, 0, 0.04]}>
        <PaperBox position={[-0.06, 0.02, 0]} color={color} size={[0.12, 0.01, 0.08]} />
        <PaperBox position={[-0.04, -0.02, 0]} color={color} size={[0.08, 0.01, 0.06]} />
      </group>
      <group ref={wingR} position={[0, 0, -0.04]}>
        <PaperBox position={[-0.06, 0.02, 0]} color={color} size={[0.12, 0.01, 0.08]} />
        <PaperBox position={[-0.04, -0.02, 0]} color={color} size={[0.08, 0.01, 0.06]} />
      </group>
    </group>
  );
}

// ─── Paper Mushroom ───────────────────────────────────────────────────

function PaperMushroom({ position, capColor = "#ef4444" }: { position: [number, number, number]; capColor?: string }) {
  return (
    <group position={position}>
      <PaperCylinder position={[0, 0.15, 0]} color="#f5f0e8" args={[0.06, 0.08, 0.3, 6]} />
      <PaperCone position={[0, 0.4, 0]} color={capColor} args={[0.2, 0.15, 8]} />
      <PaperSphere position={[0.05, 0.42, 0.05]} color="#ffffff" radius={0.03} />
      <PaperSphere position={[-0.06, 0.44, -0.03]} color="#ffffff" radius={0.025} />
    </group>
  );
}

// ─── Paper Path (trail of flat squares) ───────────────────────────────

function PaperPath({ start, end, count = 8 }: { start: [number, number, number]; end: [number, number, number]; count?: number }) {
  const steps = useMemo(() => {
    return Array.from({ length: count }, (_, i) => {
      const t = i / (count - 1);
      return [
        start[0] + (end[0] - start[0]) * t,
        start[1] + (end[1] - start[1]) * t + Math.sin(t * Math.PI) * 0.1,
        start[2] + (end[2] - start[2]) * t,
      ] as [number, number, number];
    });
  }, [start, end, count]);

  return (
    <group>
      {steps.map((pos, i) => (
        <PaperBox
          key={i}
          position={pos}
          color={i % 2 === 0 ? "#e8e0d4" : "#d6d3d1"}
          size={[0.4, 0.03, 0.4]}
          rotation={[0, i * 0.3, 0]}
        />
      ))}
    </group>
  );
}

// ─── Paper Swan (origami style) ───────────────────────────────────────

function PaperSwan({ position, color = "#ffffff", scale = 1 }: { position: [number, number, number]; color?: string; scale?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.2 + position[0]) * 0.08;
    ref.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      <PaperBox position={[0, 0, 0]} color={color} size={[0.4, 0.06, 0.25]} />
      <PaperCone position={[0.22, 0.08, 0]} color={color} args={[0.04, 0.18, 3]} rotation={[0, 0, -0.5]} />
      <PaperBox position={[-0.12, 0.1, 0]} color={color} size={[0.2, 0.02, 0.3]} rotation={[0, 0, 0.3]} />
      <PaperBox position={[-0.12, 0.1, 0]} color={color} size={[0.15, 0.02, 0.22]} rotation={[0, 0, 0.5]} />
      <PaperBox position={[0.28, 0.12, 0]} color="#f97316" size={[0.06, 0.03, 0.03]} />
    </group>
  );
}

// ─── Paper Frog (jumping) ─────────────────────────────────────────────

function PaperFrog({ position, color = "#22c55e" }: { position: [number, number, number]; color?: string }) {
  const ref = useRef<THREE.Group>(null);
  const jumpRef = useRef(0);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    jumpRef.current = Math.max(0, jumpRef.current - 0.02);
    const jumpY = Math.sin(jumpRef.current * Math.PI) * 0.8;
    ref.current.position.y = position[1] + jumpY + Math.abs(Math.sin(t * 0.5)) * 0.05;
  });
  return (
    <group ref={ref} position={position}>
      <PaperBox position={[0, 0.12, 0]} color={color} size={[0.25, 0.12, 0.2]} />
      <PaperBox position={[0, 0.2, 0]} color={color} size={[0.2, 0.06, 0.18]} />
      <PaperSphere position={[-0.08, 0.24, 0.08]} color={color} radius={0.035} />
      <PaperSphere position={[0.08, 0.24, 0.08]} color={color} radius={0.035} />
      <PaperSphere position={[-0.08, 0.24, 0.08]} color="#1a1a2e" radius={0.015} />
      <PaperSphere position={[0.08, 0.24, 0.08]} color="#1a1a2e" radius={0.015} />
      <PaperBox position={[-0.15, 0.06, 0.12]} color={color} size={[0.08, 0.04, 0.12]} rotation={[0.3, 0, 0]} />
      <PaperBox position={[0.15, 0.06, 0.12]} color={color} size={[0.08, 0.04, 0.12]} rotation={[0.3, 0, 0]} />
    </group>
  );
}

// ─── Paper Star ───────────────────────────────────────────────────────

function PaperStar({ position, color = "#fbbf24", radius = 0.3 }: { position: [number, number, number]; color?: string; radius?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.5;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.15;
  });
  const points = useMemo(() => {
    const pts: [number, number, number][] = [];
    for (let i = 0; i < 5; i++) {
      const outerAngle = (i / 5) * Math.PI * 2 - Math.PI / 2;
      const innerAngle = ((i + 0.5) / 5) * Math.PI * 2 - Math.PI / 2;
      pts.push([Math.cos(outerAngle) * radius, Math.sin(outerAngle) * radius, 0]);
      pts.push([Math.cos(innerAngle) * radius * 0.4, Math.sin(innerAngle) * radius * 0.4, 0]);
    }
    return pts;
  }, [radius]);

  return (
    <group ref={ref} position={position}>
      {points.map(([x, y, z], i) => (
        <PaperBox
          key={i}
          position={[x * 0.5, y * 0.5, z]}
          color={color}
          size={[0.08, 0.08, 0.04]}
        />
      ))}
      <PaperSphere position={[0, 0, 0]} color={color} radius={radius * 0.15} />
    </group>
  );
}

// ─── Paper House ──────────────────────────────────────────────────────

function PaperHouse({ position, wallColor = "#f5f0e8", roofColor = "#ef4444" }: { position: [number, number, number]; wallColor?: string; roofColor?: string }) {
  return (
    <group position={position}>
      <PaperBox position={[0, 0.3, 0]} color={wallColor} size={[0.6, 0.6, 0.5]} />
      <PaperBox position={[0.1, 0.2, 0.26]} color="#1a1a2e" size={[0.15, 0.25, 0.02]} />
      <PaperBox position={[-0.12, 0.35, 0.26]} color="#67e8f9" size={[0.12, 0.12, 0.02]} />
      <group position={[0, 0.7, 0]}>
        <PaperCone position={[0, 0, 0]} color={roofColor} args={[0.45, 0.3, 4]} rotation={[0, Math.PI / 4, 0]} />
      </group>
      <PaperCylinder position={[0.2, 0.85, 0]} color="#78716c" args={[0.04, 0.04, 0.2, 6]} />
    </group>
  );
}

// ─── Paper Gem / Crystal ──────────────────────────────────────────────

function PaperGem({ position, color = "#a78bfa", scale = 1 }: { position: [number, number, number]; color?: string; scale?: number }) {
  const ref = useRef<THREE.Group>(null);
  const geo = useMemo(() => getGeo("gem-0.2", () => new THREE.OctahedronGeometry(0.2)), []);
  const edge = useMemo(() => getEdge("gem-0.2", () => new THREE.EdgesGeometry(new THREE.OctahedronGeometry(0.2))), []);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.8;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
  });
  return (
    <group ref={ref} position={position} scale={scale}>
      <mesh geometry={geo}>
        <meshToonMaterial color={color} emissive={color} emissiveIntensity={0.2} transparent opacity={0.85} />
      </mesh>
      <lineSegments geometry={edge}>
        <lineBasicMaterial color="#1a1a2e" transparent opacity={0.5} />
      </lineSegments>
      <pointLight position={[0, 0, 0]} intensity={0.4} color={color} distance={2} />
    </group>
  );
}

// ─── Paper Sailboat ───────────────────────────────────────────────────

function PaperSailboat({ position, hullColor = "#f5f0e8", sailColor = "#ffffff" }: { position: [number, number, number]; hullColor?: string; sailColor?: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = position[1] + Math.sin(t * 1.8) * 0.1;
    ref.current.rotation.z = Math.sin(t * 1.2) * 0.08;
    ref.current.rotation.x = Math.sin(t * 0.9) * 0.05;
  });
  return (
    <group ref={ref} position={position}>
      <PaperBox position={[0, 0, 0]} color={hullColor} size={[0.5, 0.08, 0.25]} />
      <PaperBox position={[0, 0.04, 0]} color={hullColor} size={[0.4, 0.06, 0.2]} />
      <PaperCylinder position={[0.05, 0.2, 0]} color="#78716c" args={[0.01, 0.01, 0.35, 4]} />
      <PaperBox position={[0.05, 0.3, 0.01]} color={sailColor} size={[0.01, 0.25, 0.18]} />
      <PaperBox position={[0.05, 0.25, -0.01]} color={sailColor} size={[0.01, 0.15, 0.12]} />
    </group>
  );
}

// ─── Paper Arrow (directional marker) ─────────────────────────────────

function PaperArrow({ position, direction = [1, 0, 0] as [number, number, number], color = "#fbbf24" }: { position: [number, number, number]; direction?: [number, number, number]; color?: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.1;
  });
  const rotation = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const dir = new THREE.Vector3(...direction).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
    const euler = new THREE.Euler().setFromQuaternion(quat);
    return [euler.x, euler.y, euler.z] as [number, number, number];
  }, [direction]);

  return (
    <group ref={ref} position={position} rotation={rotation}>
      <PaperCone position={[0, 0.2, 0]} color={color} args={[0.1, 0.2, 3]} />
      <PaperCylinder position={[0, 0, 0]} color={color} args={[0.03, 0.03, 0.2, 4]} />
    </group>
  );
}

// ─── Paper Wind Chime ─────────────────────────────────────────────────

function PaperWindChime({ position }: { position: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const rods = useRef<THREE.Group[]>([]);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    rods.current.forEach((rod, i) => {
      if (!rod) return;
      rod.rotation.z = Math.sin(t * (1.5 + i * 0.3) + i * 1.2) * 0.15;
      rod.rotation.x = Math.cos(t * (1.2 + i * 0.2) + i * 0.8) * 0.1;
    });
  });
  return (
    <group ref={ref} position={position}>
      <PaperBox position={[0, 0.3, 0]} color="#78716c" size={[0.3, 0.03, 0.3]} />
      {[-0.08, 0, 0.08].map((x, i) => (
        <group
          key={i}
          ref={(el) => { if (el) rods.current[i] = el; }}
          position={[x, 0.1, 0]}
        >
          <PaperCylinder position={[0, 0, 0]} color="#a8a29e" args={[0.005, 0.005, 0.2, 4]} />
          <PaperBox position={[0, -0.12, 0]} color={["#67e8f9", "#a78bfa", "#f472b6"][i]} size={[0.04, 0.08, 0.02]} />
        </group>
      ))}
      <PaperCylinder position={[0, 0.35, 0]} color="#1a1a2e" args={[0.005, 0.005, 0.1, 4]} />
    </group>
  );
}

// ─── Paper Lotus ──────────────────────────────────────────────────────

function PaperLotus({ position, color = "#f472b6" }: { position: [number, number, number]; color?: string }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.2;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.8) * 0.05;
  });
  return (
    <group ref={ref} position={position}>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <PaperBox
            key={`outer-${i}`}
            position={[Math.cos(a) * 0.15, 0.05, Math.sin(a) * 0.15]}
            color={color}
            size={[0.1, 0.02, 0.06]}
            rotation={[0.3, a, 0]}
          />
        );
      })}
      {[0, 1, 2, 3, 4].map((i) => {
        const a = ((i + 0.5) / 5) * Math.PI * 2;
        return (
          <PaperBox
            key={`inner-${i}`}
            position={[Math.cos(a) * 0.08, 0.1, Math.sin(a) * 0.08]}
            color="#fbbf24"
            size={[0.07, 0.02, 0.04]}
            rotation={[0.5, a, 0]}
          />
        );
      })}
      <PaperSphere position={[0, 0.12, 0]} color="#fbbf24" radius={0.04} />
    </group>
  );
}

// ─── Collected Leaf (Act 3) ──────────────────────────────────────────

function CollectedLeaf({ position, color }: { position: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Group>(null);
  const startY = position[1];
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.rotation.y = t * 2;
    ref.current.rotation.x = Math.sin(t * 3) * 0.3;
    ref.current.position.y = startY + Math.sin(t * 2) * 0.3;
  });
  return (
    <group ref={ref} position={position}>
      <PaperBox position={[0, 0, 0]} color={color} size={[0.15, 0.02, 0.1]} rotation={[0.2, 0, 0.1]} />
      <PaperBox position={[0.05, 0.01, 0]} color={color} size={[0.1, 0.02, 0.08]} rotation={[-0.1, 0.5, 0]} />
      <pointLight position={[0, 0, 0]} intensity={0.3} color={color} distance={2} />
    </group>
  );
}

// ─── Celebration Particle (Act 8) ────────────────────────────────────

function CelebrationParticle({ position, color, velocity }: { position: [number, number, number]; color: string; velocity: [number, number, number] }) {
  const ref = useRef<THREE.Group>(null);
  const lifeRef = useRef(1);
  const posRef = useRef(new THREE.Vector3(...position));
  const velRef = useRef(new THREE.Vector3(...velocity));

  useFrame((_, delta) => {
    if (!ref.current) return;
    lifeRef.current -= delta * 0.5;
    if (lifeRef.current <= 0) {
      ref.current.scale.setScalar(0);
      return;
    }
    velRef.current.y -= delta * 3;
    posRef.current.addScaledVector(velRef.current, delta);
    ref.current.position.copy(posRef.current);
    ref.current.rotation.y += delta * 5;
    ref.current.rotation.x += delta * 3;
    ref.current.scale.setScalar(lifeRef.current);
  });

  return (
    <group ref={ref} position={position}>
      <PaperTetrahedron position={[0, 0, 0]} color={color} radius={0.15} />
      <pointLight position={[0, 0, 0]} intensity={0.5} color={color} distance={3} />
    </group>
  );
}

// ─── Interactive Paper Object (hover glow) ────────────────────────────

function InteractivePaperObject({
  position, color, size, hoverColor = "#fbbf24", onClick
}: {
  position: [number, number, number];
  color: string;
  size: [number, number, number];
  hoverColor?: string;
  onClick?: () => void;
}) {
  const ref = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const matRef = useRef<THREE.MeshToonMaterial>(null);

  const edgeGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(...size)), [size[0], size[1], size[2]]);

  const clock = useRef(0);
  useFrame((_, delta) => {
    if (!ref.current) return;
    clock.current += delta;
    const targetScale = hovered ? 1.15 : 1;
    _scaleVec.set(targetScale, targetScale, targetScale);
    ref.current.scale.lerp(_scaleVec, 0.1);
    if (hovered) {
      ref.current.position.y = position[1] + Math.sin(clock.current * 3) * 0.1;
    } else {
      ref.current.position.y += (position[1] - ref.current.position.y) * 0.1;
    }
  });

  return (
    <group
      ref={ref}
      position={position}
      onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent("button-tap")); onClick?.(); }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
        window.dispatchEvent(new CustomEvent("cursor-change", { detail: { cursor: "pointer" } }));
        window.dispatchEvent(new CustomEvent("button-hover"));
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "default";
        window.dispatchEvent(new CustomEvent("cursor-change", { detail: { cursor: "default" } }));
        window.dispatchEvent(new CustomEvent("hover-out"));
      }}
    >
      <mesh castShadow>
        <boxGeometry args={size} />
        <meshToonMaterial
          color={hovered ? hoverColor : color}
          emissive={hovered ? hoverColor : "#000000"}
          emissiveIntensity={hovered ? 0.4 : 0}
        />
      </mesh>
      <lineSegments geometry={edgeGeo}>
        <lineBasicMaterial color="#1a1a2e" transparent opacity={hovered ? 0.8 : 0.5} />
      </lineSegments>
      {hovered && (
        <>
          <pointLight position={[0, 0.5, 0]} intensity={0.6} color={hoverColor} distance={3} />
          {/* Outer glow ring */}
          <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[Math.max(size[0], size[2]) * 0.8, Math.max(size[0], size[2]) * 1.0, 32]} />
            <meshBasicMaterial color={hoverColor} transparent opacity={0.2} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
    </group>
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
  const act = narrativeState ? getCurrentAct(narrativeState) : null;
  const beat = narrativeState ? getCurrentBeat(narrativeState) : null;
  const currentAct = (narrativeState?.currentAct ?? 0) + 1;
  const windActive = currentAct === 2 && beat?.interaction === "drag-wind" && narrativeState?.interactionState !== "complete";

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
          window.dispatchEvent(new CustomEvent("crystal-resonance"));
          window.dispatchEvent(new CustomEvent("discovery"));
          window.dispatchEvent(new CustomEvent("paper-shower"));
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
      if (scene.background && scene.background instanceof THREE.Color) {
        gsap.to(scene.background, { r: targetColor.r, g: targetColor.g, b: targetColor.b, duration: 1.5, ease: "power2.inOut" });
      }
      if (scene.fog && scene.fog instanceof THREE.Fog) {
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
    if (scene.background && scene.background instanceof THREE.Color) {
      gsap.to(scene.background, { r: targetColor.r, g: targetColor.g, b: targetColor.b, duration: 2, ease: "power2.inOut" });
    }
    if (scene.fog && scene.fog instanceof THREE.Fog) {
      gsap.to(scene.fog, { near: fogNear, far: fogFar, duration: 2, ease: "power2.inOut" });
      gsap.to(scene.fog.color, { r: targetColor.r, g: targetColor.g, b: targetColor.b, duration: 2, ease: "power2.inOut" });
    }
  }, [currentAct, beat?.mood, beat?.envChange, scene.background, scene.fog]);

  // ─── Collect Leaves interaction (Act 3) ────────────────────────────
  const [collectedLeaves, setCollectedLeaves] = useState<Array<{ id: number; x: number; y: number; z: number; color: string }>>([]);
  const leafIdRef = useRef(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const count = detail?.count || 0;
      const colors = ["#22c55e", "#4ade80", "#86efac", "#fbbf24", "#f472b6"];
      // Spawn a leaf at a random position near the forest
      const leaf = {
        id: leafIdRef.current++,
        x: ACT_POSITIONS.forest[0] + (Math.random() - 0.5) * 10,
        y: 1 + Math.random() * 3,
        z: ACT_POSITIONS.forest[2] + (Math.random() - 0.5) * 10,
        color: colors[count % colors.length],
      };
      setCollectedLeaves(prev => [...prev.slice(-20), leaf]);
    };
    window.addEventListener("collect-leaf", handler);
    return () => window.removeEventListener("collect-leaf", handler);
  }, []);

  // ─── Celebrate particles (Act 8) ──────────────────────────────────
  const [celebrationParticles, setCelebrationParticles] = useState<Array<{ id: number; x: number; y: number; z: number; color: string; vel: [number, number, number] }>>([]);
  const celebIdRef = useRef(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const count = detail?.count || 0;
      const colors = ["#fbbf24", "#f472b6", "#a78bfa", "#67e8f9", "#22c55e", "#ef4444"];
      const newParticles = Array.from({ length: 3 }, (_, i) => ({
        id: celebIdRef.current++,
        x: (Math.random() - 0.5) * 20,
        y: 10 + Math.random() * 10,
        z: (Math.random() - 0.5) * 20,
        color: colors[(count + i) % colors.length],
        vel: [(Math.random() - 0.5) * 2, 1 + Math.random() * 2, (Math.random() - 0.5) * 2] as [number, number, number],
      }));
      setCelebrationParticles(prev => [...prev.slice(-50), ...newParticles]);
    };
    window.addEventListener("celebrate", handler);
    return () => window.removeEventListener("celebrate", handler);
  }, []);

  // ─── Follow-butterfly interaction (Act 7/8) ────────────────────────
  const [butterflyTrail, setButterflyTrail] = useState<Array<{ id: number; x: number; y: number; z: number; color: string }>>([]);
  const butterflyIdRef = useRef(0);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const count = detail?.count || 0;
      const colors = ["#a78bfa", "#f472b6", "#67e8f9", "#fbbf24"];
      const angle = (count / 25) * Math.PI * 2;
      const butterfly = {
        id: butterflyIdRef.current++,
        x: ACT_POSITIONS.water[0] + Math.cos(angle) * 6,
        y: 2 + Math.sin(count * 0.5) * 2,
        z: ACT_POSITIONS.water[2] + Math.sin(angle) * 6,
        color: colors[count % colors.length],
      };
      setButterflyTrail(prev => [...prev.slice(-30), butterfly]);
    };
    window.addEventListener("follow-butterfly", handler);
    return () => window.removeEventListener("follow-butterfly", handler);
  }, []);

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
      <PaperClouds count={10} area={[140, 25, 140]} />
      {currentAct !== 2 && <LightShafts count={5} position={[15, 22, -10]} intensity={0.18} />}

      {/* ═══ ACT 1: Cliff Edge [0, 0, 0] ═══ */}
      <CliffEdge position={ACT_POSITIONS.cliff} />
      <PaperRockStack position={[3, -0.3, -2]} count={4} />
      <PaperRockStack position={[-2, -0.3, 3]} count={3} />
      <BloomingPaperFlower position={[2, 0, 2]} color="#f472b6" petalCount={6} />
      <BloomingPaperFlower position={[-3, 0, 1]} color="#fb923c" petalCount={8} />
      <PaperMushroom position={[1.5, 0, -1.5]} capColor="#ef4444" />
      <PaperButterfly position={[3, 3, 0]} color="#a78bfa" />
      <PaperStar position={[4, 3, 2]} color="#fbbf24" radius={0.25} />
      <PaperHouse position={[-5, 0, -3]} />
      <LeapingPaperFrog position={[2, 0, -2]} color="#22c55e" />
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
          <PaperRockStack position={[-1.5, -0.3, 2]} count={5} />
          <PaperRockStack position={[3, -0.3, -2]} count={3} />
          <PaperArrow position={[42, 2, 0]} direction={[0, 0, -1]} color="#94a3b8" />
          <PaperArrow position={[38, 2, 0]} direction={[0, 0, 1]} color="#94a3b8" />
          {currentAct === 2 && (
            <>
              <StormDebris />
              <PaperRain count={140} area={[25, 18, 25]} />
            </>
          )}
        </group>
      )}
      {currentAct === 2 && <MiloCrane position={[40, 0.5, 0]} act={currentAct} />}

      {/* ═══ ACT 3: Forest [-40, 0, 0] ═══ */}
      {currentAct >= 3 && <Forest position={ACT_POSITIONS.forest} />}
      {currentAct >= 3 && (
        <>
          <ForestSpores count={70} center={[-40, 2, 0]} />
          <BloomingPaperFlower position={[-38, 0, 2]} color="#f472b6" petalCount={6} />
          <BloomingPaperFlower position={[-42, 0, -1]} color="#c084fc" petalCount={7} />
          <BloomingPaperFlower position={[-37, 0, -3]} color="#fb923c" petalCount={6} />
          <PaperButterfly position={[-39, 3, 1]} color="#f472b6" />
          <PaperButterfly position={[-41, 2.5, -2]} color="#67e8f9" />
          <PaperMushroom position={[-38.5, 0, 3]} capColor="#a78bfa" />
          <PaperMushroom position={[-41.5, 0, -2.5]} capColor="#f472b6" />
          <PaperLantern position={[-40, 2, 0]} color="#fbbf24" />
          <PaperSwan position={[-38, 0.1, -1]} color="#ffffff" scale={0.7} />
          <LeapingPaperFrog position={[-41, 0, 2]} color="#16a34a" />
          <PaperGem position={[-39, 1.5, -2]} color="#a78bfa" scale={0.8} />
          <PaperLotus position={[-42, 0, 1]} color="#f472b6" />
          <PaperWindChime position={[-40, 2.5, -3]} />
        </>
      )}
      {currentAct >= 3 && currentAct <= 4 && (
        <>
          <LiraFox position={[-40, 0, -3]} visible={true} />
          <MiloCrane position={[-40, 0.5, 3]} act={currentAct} />
        </>
      )}

      {/* ═══ ACT 4/5: Unfolded Lands [0, 0, -40] ═══ */}
      {currentAct >= 4 && (
        <group position={ACT_POSITIONS.unfolded}>
          <ConwayPaperGrid visible={currentAct >= 4} playerPos={[0, 0, -40]} interactive={beat?.interaction === "toggle-cells" && narrativeState.interactionState !== "complete"} />
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
          <PaperArch position={[4, 0, -2]} color="#d6d3d1" width={1.5} height={2.5} />
          <PaperArch position={[-4, 0, 2]} color="#a8a29e" width={1.2} height={2} />
          <PaperWindmill position={[5, 0, 3]} color="#a78bfa" />
          <PaperRockStack position={[-3, -0.48, -4]} count={4} />
        </group>
      )}
      {currentAct >= 4 && currentAct <= 5 && <MiloCrane position={[0, 0.5, -37]} act={currentAct} />}
      {currentAct === 5 && <OrigamiEmbers count={60} center={[0, 1, -40]} />}
      <SecretFold position={[0, 1.5, -40]} visible={currentAct === 5} onInteract={onSecretFoldInteract} />

      {/* ═══ ACT 6/7: Water / Pip [0, 0, 40] ═══ */}
      <WaterSurface position={[0, -0.3, 40]} />
      <PipBoat position={[0, 0, 40]} visible={currentAct >= 6} />
      {currentAct >= 6 && (
        <>
          <OrigamiCrane position={[3, 1, 42]} color="#f97316" size={0.5} />
          <OrigamiCrane position={[-2, 1.5, 38]} color="#fb923c" size={0.4} />
          <PaperButterfly position={[2, 2, 43]} color="#f472b6" />
          <PaperButterfly position={[-1, 3, 37]} color="#67e8f9" />
          <PaperLantern position={[4, 1.5, 40]} color="#fbbf24" />
          <PaperLantern position={[-4, 1.5, 40]} color="#fbbf24" />
          <PaperSailboat position={[3, 0.2, 42]} hullColor="#d6d3d1" sailColor="#ffffff" />
          <PaperSailboat position={[-2, 0.3, 38]} hullColor="#a8a29e" sailColor="#f5f0e8" />
          <PaperSwan position={[1, 0.1, 43]} color="#ffffff" scale={0.6} />
          <PaperLotus position={[-3, 0, 42]} color="#f472b6" />
          <PaperLotus position={[2, 0, 37]} color="#c084fc" />
          <PaperGem position={[0, 1, 41]} color="#67e8f9" scale={0.6} />
        </>
      )}
      {currentAct >= 6 && currentAct <= 7 && <LiraFox position={[-3, 0, 40]} visible={true} />}
      {currentAct >= 6 && <MiloCrane position={[0, 1, 38]} act={currentAct} />}

      {/* ═══ ACT 8: Aerial [0, 15, 0] ═══ */}
      {currentAct === 8 && (
        <>
          <MiloCrane position={[0, 15, 0]} act={currentAct} />
          <CraneFlock count={18} />
          <OrigamiCrane position={[5, 13, 3]} color="#fbbf24" size={0.7} />
          <OrigamiCrane position={[-4, 14, -2]} color="#f97316" size={0.6} />
          <PaperButterfly position={[3, 16, -4]} color="#a78bfa" />
          <PaperButterfly position={[-5, 15, 2]} color="#f472b6" />
          <PaperStar position={[6, 14, 0]} color="#fbbf24" radius={0.4} />
          <PaperStar position={[-6, 16, -3]} color="#a78bfa" radius={0.35} />
          <PaperGem position={[4, 17, -5]} color="#fbbf24" scale={1.5} />
          <PaperGem position={[-3, 13, 4]} color="#67e8f9" scale={1.2} />
        </>
      )}

      {/* ═══ Connecting Paths ═══ */}
      <PaperPath start={[2, 0, 0]} end={[38, 0, 0]} count={12} />
      <PaperPath start={[-2, 0, 0]} end={[-38, 0, 0]} count={12} />
      <PaperPath start={[0, 0, -2]} end={[0, 0, -38]} count={12} />
      <PaperPath start={[0, 0, 2]} end={[0, 0, 38]} count={12} />

      {/* ═══ Lore Nodes ═══ */}
      <LoreNodes visible={currentAct >= 3} onCollect={(entry) => onLoreCollect?.(entry)} />

      {/* ═══ Clouds ═══ */}
      {[-40, 0, 40, -25, 25, -45, 45].map((x, i) => (
        <FloatingCloud key={i} position={[x, 10 + (i % 3) * 2, -18 - i * 5]} />
      ))}

      {/* ═══ Collected Leaves (Act 3) ═══ */}
      {collectedLeaves.map((leaf) => (
        <CollectedLeaf key={leaf.id} position={[leaf.x, leaf.y, leaf.z]} color={leaf.color} />
      ))}

      {/* ═══ Celebration Particles (Act 8) ═══ */}
      {celebrationParticles.map((p) => (
        <CelebrationParticle key={p.id} position={[p.x, p.y, p.z]} color={p.color} velocity={p.vel} />
      ))}

      {/* ═══ Butterfly Trail (Act 7/8) ═══ */}
      {butterflyTrail.map((b) => (
        <PaperButterfly key={b.id} position={[b.x, b.y, b.z]} color={b.color} />
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

      {/* ═══ Mouse Parallax (ambient depth) ═══ */}
      <MouseParallaxEffect strength={0.2} />

      {/* ═══ Ambient Dust Particles ═══ */}
      <AmbientDust count={150} area={[80, 15, 80]} speed={0.2} />

      {/* ═══ Hidden Critters (Easter Eggs) ═══ */}
      <HiddenCritter position={[5, 0.3, 3]} type="fox" />
      <HiddenCritter position={[-8, 0.3, -2]} type="bird" />
      <HiddenCritter position={[38, 0.3, 2]} type="bug" />
      <HiddenCritter position={[-35, 0.3, 5]} type="rabbit" />
      <HiddenCritter position={[2, 0.3, -38]} type="owl" />
      <HiddenCritter position={[5, 0.3, 42]} type="fox" />
      <HiddenCritter position={[-3, 13, 2]} type="bird" />

      {/* ═══ Push Pendulums (interactive swinging) ═══ */}
      <PushPendulum position={[2, 4, 0]} length={1.5} color="#f472b6" />
      <PushPendulum position={[-4, 3.5, -2]} length={2} color="#a78bfa" />
      <PushPendulum position={[42, 3, 1]} length={1.8} color="#67e8f9" />
      <PushPendulum position={[-38, 3.5, -1]} length={1.5} color="#fbbf24" />
      <PushPendulum position={[1, 5, 42]} length={2.2} color="#22c55e" />
      <PushPendulum position={[0, 12, -2]} length={1.2} color="#f97316" />

      {/* ═══ Paper Shatter Barriers ═══ */}
      <PaperShatter position={[20, 1.5, 0]} size={[2, 3, 0.15]} color="#e5e7eb" />
      <PaperShatter position={[-20, 1.5, 0]} size={[2.5, 2.5, 0.15]} color="#d6d3d1" />
      <PaperShatter position={[0, 1.5, -20]} size={[3, 2, 0.15]} color="#e8e0d4" />

      {/* ═══ External GLB Models ═══ */}
      {EXTERNAL_MODELS.map((model, i) => {
        const showInAct = !model.acts || model.acts.includes(currentAct);
        if (!showInAct) return null;
        return (
          <GLTFModel
            key={`ext-${i}`}
            path={model.path}
            position={model.position}
            scale={model.scale ?? 1}
            rotation={model.rotation ?? [0, 0, 0]}
            animate={model.animate ?? "none"}
            animateSpeed={model.animateSpeed ?? 1}
            tint={model.tint}
          />
        );
      })}

      {/* ═══ Procedural Shapes (mathematical beauty) ═══ */}
      {currentAct >= 1 && (
        <group>
          {/* Crystal formation near cliff */}
          <ProceduralCrystal position={[6, 0, -3]} count={8} maxHeight={1.5} color="#a78bfa" />
          <ProceduralCrystal position={[-5, 0, 5]} count={6} maxHeight={1} color="#c084fc" />

          {/* Golden spiral tower */}
          <SpiralTower position={[-8, 4, -5]} steps={20} scale={0.25} color="#fbbf24" />

          {/* Paper windmill */}
          <PaperWindmill position={[3, 2.5, 3]} size={1} color="#fb923c" />
          <PaperWindmill position={[-6, 2, 2]} size={0.8} color="#f472b6" />
        </group>
      )}

      {currentAct >= 2 && (
        <group position={ACT_POSITIONS.storm}>
          {/* Menger sponge in storm */}
          <MengerSponge position={[5, 2, -3]} level={2} size={1.5} color="#64748b" rotationSpeed={0.1} />
          {/* Geodesic dome as shelter */}
          <GeodesicDome position={[-3, 1.5, 2]} radius={1.8} frequency={2} color="#94a3b8" wireframe />
        </group>
      )}

      {currentAct >= 3 && (
        <group position={ACT_POSITIONS.forest}>
          {/* Möbius strip in forest clearing */}
          <MobiusStrip position={[3, 2, 2]} radius={1.5} width={0.4} color="#67e8f9" />

          {/* Wave surface as a pond */}
          <WaveSurface position={[0, 0.1, 5]} width={4} depth={4} amplitude={0.2} color="#7dd3fc" />

          {/* DNA helix as a tree-like structure */}
          <DNAHelix position={[-4, 3, -2]} turns={2} radius={0.8} height={4} color1="#22c55e" color2="#86efac" />
        </group>
      )}

      {currentAct >= 4 && (
        <group position={ACT_POSITIONS.unfolded}>
          {/* Klein bottle as art piece */}
          <KleinBottle position={[-3, 2, 3]} scale={0.35} color="#f9a8d4" />

          {/* Lissajous curve */}
          <LissajousCurve position={[4, 3, -2]} freqX={3} freqY={2} freqZ={5} scale={1.5} color="#c084fc" />

          {/* Tetrahedron chain */}
          <TetrahedronChain position={[-5, 4, 0]} count={12} radius={1} color="#a78bfa" />

          {/* Fractal icosahedron */}
          <FractalIcosahedron position={[6, 2, 1]} level={2} size={1.2} color="#fbbf24" />
        </group>
      )}

      {currentAct >= 5 && (
        <group position={ACT_POSITIONS.unfolded}>
          {/* Voronoi terrain */}
          <VoronoiTerrain position={[6, -0.5, 4]} width={6} depth={6} resolution={24} maxHeight={1} color="#86efac" />
        </group>
      )}

      {currentAct >= 6 && (
        <group position={ACT_POSITIONS.water}>
          {/* Origami cranes floating */}
          <OrigamiCrane position={[2, 1, -2]} size={0.6} animate />
          <OrigamiCrane position={[-3, 1.5, 1]} size={0.4} color="#fbbf24" animate />

          {/* Instanced particles over water */}
          <InstancedParticles position={[0, 2, 0]} count={100} spread={8} behavior="swirl" color="#67e8f9" size={0.05} />
        </group>
      )}

      {currentAct >= 7 && (
        <group position={ACT_POSITIONS.water}>
          {/* Physics pendulum near Pip */}
          <PhysicsPendulum position={[3, 5, 0]} length={2} color="#f472b6" bobSize={0.2} />
        </group>
      )}

      {currentAct >= 8 && (
        <group>
          {/* Grand finale: everything together */}
          <ProceduralCrystal position={[10, 0, 10]} count={15} maxHeight={2} color="#fbbf24" />
          <MengerSponge position={[-10, 3, 8]} level={2} size={2} color="#c084fc" rotationSpeed={0.2} />
          <SpiralTower position={[8, 5, -8]} steps={25} scale={0.3} color="#f472b6" />
          <InstancedParticles position={[0, 5, 0]} count={300} spread={12} behavior="boid" color="#fbbf24" size={0.06} speed={0.5} />
          <WaveSurface position={[0, -0.3, 12]} width={10} depth={10} resolution={30} amplitude={0.3} color="#a5b4fc" />
          <TetrahedronChain position={[0, 8, 0]} count={20} radius={2} color="#f9a8d4" />
          <GeodesicDome position={[-8, 2, -6]} radius={2.5} frequency={3} color="#67e8f9" />
          <DNAHelix position={[6, 4, 6]} turns={4} radius={1} height={8} color1="#f472b6" color2="#a78bfa" />
          <FractalIcosahedron position={[-6, 6, 4]} level={2} size={1.5} color="#fbbf24" />
          <MobiusStrip position={[3, 6, -4]} radius={2} width={0.3} color="#c084fc" />
          <KleinBottle position={[-3, 8, 2]} scale={0.3} color="#f9a8d4" />
        </group>
      )}
    </group>
  );
}
