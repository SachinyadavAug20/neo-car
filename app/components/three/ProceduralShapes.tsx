"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── Procedural Crystal Formation ─────────────────────────────────────
// Hexagonal crystal clusters that grow from a seed point
// Based on real crystallography: hexagonal prism + pyramidal termination

interface CrystalProps {
  position?: [number, number, number];
  count?: number;
  color?: string;
  maxHeight?: number;
  growSpeed?: number;
  autoGrow?: boolean;
}

interface CrystalData {
  pos: THREE.Vector3;
  height: number;
  targetHeight: number;
  width: number;
  rotation: number;
  tilt: THREE.Vector3;
  growDelay: number;
  hue: number;
}

export function ProceduralCrystal({
  position = [0, 0, 0],
  count = 12,
  color = "#a78bfa",
  maxHeight = 3,
  growSpeed = 1,
  autoGrow = true,
}: CrystalProps) {
  const groupRef = useRef<THREE.Group>(null);
  const growProgress = useRef(0);
  const isGrown = useRef(false);

  const crystals = useMemo<CrystalData[]>(() => {
    const arr: CrystalData[] = [];
    const rng = mulberry32(42);
    for (let i = 0; i < count; i++) {
      const angle = rng() * Math.PI * 2;
      const dist = 0.3 + rng() * 0.8;
      arr.push({
        pos: new THREE.Vector3(
          Math.cos(angle) * dist,
          0,
          Math.sin(angle) * dist
        ),
        height: 0,
        targetHeight: 0.5 + rng() * maxHeight,
        width: 0.08 + rng() * 0.15,
        rotation: rng() * Math.PI,
        tilt: new THREE.Vector3(
          (rng() - 0.5) * 0.3,
          0,
          (rng() - 0.5) * 0.3
        ),
        growDelay: rng() * 1.5,
        hue: rng() * 0.1 - 0.05,
      });
    }
    return arr;
  }, [count, maxHeight]);

  useFrame((_, delta) => {
    if (!autoGrow || isGrown.current) return;
    growProgress.current += delta * growSpeed;
    let allGrown = true;
    crystals.forEach((c) => {
      const t = Math.max(0, (growProgress.current - c.growDelay) / 1.5);
      const eased = easeOutBack(Math.min(t, 1));
      c.height = c.targetHeight * eased;
      if (t < 1) allGrown = false;
    });
    if (allGrown) isGrown.current = true;
  });

  // Build hexagonal prism geometry
  const hexGeo = useMemo(() => {
    const sides = 6;
    const radius = 1;
    const shape = new THREE.Shape();
    for (let i = 0; i <= sides; i++) {
      const a = (i / sides) * Math.PI * 2;
      const x = Math.cos(a) * radius;
      const z = Math.sin(a) * radius;
      if (i === 0) shape.moveTo(x, z);
      else shape.lineTo(x, z);
    }
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: 1,
      bevelEnabled: false,
    });
    geo.rotateX(-Math.PI / 2);
    return geo;
  }, []);

  // Pyramidal termination geometry
  const pyrGeo = useMemo(() => {
    return new THREE.ConeGeometry(1, 0.6, 6);
  }, []);

  return (
    <group ref={groupRef} position={position}>
      {crystals.map((c, i) => {
        const baseColor = new THREE.Color(color);
        baseColor.offsetHSL(c.hue, 0, 0);
        const h = Math.max(0.01, c.height);
        const w = c.width;
        return (
          <group
            key={i}
            position={[c.pos.x, h / 2, c.pos.z]}
            rotation={[c.tilt.x, c.rotation, c.tilt.z]}
          >
            {/* Hexagonal prism body */}
            <mesh
              geometry={hexGeo}
              scale={[w, h, w]}
              castShadow
            >
              <meshToonMaterial
                color={baseColor}
                emissive={baseColor}
                emissiveIntensity={0.15}
                transparent
                opacity={0.85}
              />
            </mesh>
            {/* Edge outlines */}
            <lineSegments
              geometry={new THREE.EdgesGeometry(hexGeo)}
              scale={[w, h, w]}
            >
              <lineBasicMaterial color="#1a1a2e" transparent opacity={0.4} />
            </lineSegments>
            {/* Pyramidal tip */}
            <mesh
              geometry={pyrGeo}
              position={[0, h * 0.5 + 0.15, 0]}
              scale={[w * 0.9, 0.3, w * 0.9]}
            >
              <meshToonMaterial
                color={baseColor}
                emissive={baseColor}
                emissiveIntensity={0.3}
                transparent
                opacity={0.9}
              />
            </mesh>
            {/* Glow */}
            {c.height > c.targetHeight * 0.5 && (
              <pointLight
                position={[0, h * 0.5, 0]}
                intensity={0.3}
                color={baseColor}
                distance={2}
              />
            )}
          </group>
        );
      })}
    </group>
  );
}

// ─── Menger Sponge Fractal ────────────────────────────────────────────
// Recursive fractal geometry: each cube removes its center and face centers

interface MengerSpongeProps {
  position?: [number, number, number];
  level?: number;
  size?: number;
  color?: string;
  autoRotate?: boolean;
  rotationSpeed?: number;
}

export function MengerSponge({
  position = [0, 0, 0],
  level = 2,
  size = 2,
  color = "#f472b6",
  autoRotate = true,
  rotationSpeed = 0.2,
}: MengerSpongeProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * rotationSpeed;
    }
  });

  // Generate all cube positions at the given recursion level
  const cubes = useMemo(() => {
    const result: { pos: [number, number, number]; scale: number }[] = [];
    const keep = new Set<string>();

    // Start with one cube
    keep.add("0,0,0");

    // For each level, subdivide
    for (let l = 0; l < level; l++) {
      const newKeep = new Set<string>();
      keep.forEach((key) => {
        const [cx, cy, cz] = key.split(",").map(Number);
        for (let x = 0; x < 3; x++) {
          for (let y = 0; y < 3; y++) {
            for (let z = 0; z < 3; z++) {
              // Remove center of face and center of cube
              const isCenter = x === 1 && y === 1 && z === 1;
              const isFaceCenter =
                (x === 1 && y === 1) ||
                (x === 1 && z === 1) ||
                (y === 1 && z === 1);
              if (isCenter || isFaceCenter) continue;
              const nx = cx * 3 + x;
              const ny = cy * 3 + y;
              const nz = cz * 3 + z;
              newKeep.add(`${nx},${ny},${nz}`);
            }
          }
        }
      });
      keep.clear();
      keep.forEach((k) => newKeep.add(k));
      // Copy newKeep back
      keep.clear();
      newKeep.forEach((k) => keep.add(k));
    }

    const scale = size / Math.pow(3, level);
    keep.forEach((key) => {
      const [x, y, z] = key.split(",").map(Number);
      const total = Math.pow(3, level);
      result.push({
        pos: [
          (x - total / 2) * scale,
          (y - total / 2) * scale,
          (z - total / 2) * scale,
        ],
        scale: scale * 0.95,
      });
    });

    return result;
  }, [level, size]);

  return (
    <group ref={groupRef} position={position}>
      {cubes.map((c, i) => (
        <group key={i} position={c.pos}>
          <mesh castShadow>
            <boxGeometry args={[c.scale, c.scale, c.scale]} />
            <meshToonMaterial color={color} />
          </mesh>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(c.scale, c.scale, c.scale)]} />
            <lineBasicMaterial color="#1a1a2e" transparent opacity={0.3} />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}

// ─── Parametric Surface (Möbius Strip) ────────────────────────────────
// Mathematical Möbius strip with parametric UV generation

interface MobiusStripProps {
  position?: [number, number, number];
  radius?: number;
  width?: number;
  segments?: number;
  color?: string;
  autoRotate?: boolean;
}

export function MobiusStrip({
  position = [0, 0, 0],
  radius = 2,
  width = 0.6,
  segments = 128,
  color = "#67e8f9",
  autoRotate = true,
}: MobiusStripProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const edgesRef = useRef<THREE.LineSegments>(null);

  const geo = useMemo(() => {
    const positions: number[] = [];
    const indices: number[] = [];
    const normals: number[] = [];

    for (let i = 0; i <= segments; i++) {
      const u = (i / segments) * Math.PI * 2;
      for (let j = 0; j <= 1; j++) {
        const v = (j - 0.5) * width;
        const halfU = u / 2;
        const x = (radius + v * Math.cos(halfU)) * Math.cos(u);
        const y = (radius + v * Math.cos(halfU)) * Math.sin(u);
        const z = v * Math.sin(halfU);
        positions.push(x, y, z);
        // Approximate normal
        normals.push(0, 0, 1);
      }
    }

    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      indices.push(a, c, b, b, c, d);
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [segments, width, radius]);

  const edgeGeo = useMemo(() => new THREE.EdgesGeometry(geo, 15), [geo]);

  useFrame((_, delta) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.y += delta * 0.3;
      if (edgesRef.current) edgesRef.current.rotation.y = meshRef.current.rotation.y;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} geometry={geo} castShadow>
        <meshToonMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      <lineSegments ref={edgesRef} geometry={edgeGeo}>
        <lineBasicMaterial color="#1a1a2e" transparent opacity={0.3} />
      </lineSegments>
    </group>
  );
}

// ─── Klein Bottle (immersed in R³) ────────────────────────────────────
// Mathematical Klein bottle parametric surface

interface KleinBottleProps {
  position?: [number, number, number];
  scale?: number;
  segments?: number;
  color?: string;
  autoRotate?: boolean;
}

export function KleinBottle({
  position = [0, 0, 0],
  scale = 0.4,
  segments = 60,
  color = "#f9a8d4",
  autoRotate = true,
}: KleinBottleProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geo = useMemo(() => {
    const positions: number[] = [];
    const indices: number[] = [];
    const rings = segments;
    const tubes = segments;

    for (let i = 0; i <= rings; i++) {
      const u = (i / rings) * Math.PI * 2;
      for (let j = 0; j <= tubes; j++) {
        const v = (j / tubes) * Math.PI * 2;
        const r = 4 * (1 - Math.cos(u) / 2);
        const x = r * Math.cos(u);
        const y = r * Math.sin(u);
        // Klein bottle embedding
        const a = u * 2;
        const bx = Math.cos(v) * (a > Math.PI ? Math.cos(v) : 1);
        const by = Math.sin(v) * (a > Math.PI ? Math.cos(v) : -1);
        const bz = Math.sin(u) + (a > Math.PI ? Math.cos(v) * Math.sin(u) : 0);
        positions.push(x + bx * scale, y + by * scale, bz * scale * 0.5);
      }
    }

    for (let i = 0; i < rings; i++) {
      for (let j = 0; j < tubes; j++) {
        const a = i * (tubes + 1) + j;
        const b = a + tubes + 1;
        indices.push(a, b, a + 1, a + 1, b, b + 1);
      }
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    g.setIndex(indices);
    g.computeVertexNormals();
    return g;
  }, [segments, scale]);

  useFrame((_, delta) => {
    if (meshRef.current && autoRotate) {
      meshRef.current.rotation.x += delta * 0.2;
      meshRef.current.rotation.y += delta * 0.3;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} geometry={geo} castShadow>
        <meshToonMaterial color={color} side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>
      <lineSegments geometry={new THREE.EdgesGeometry(geo, 20)}>
        <lineBasicMaterial color="#1a1a2e" transparent opacity={0.2} />
      </lineSegments>
    </group>
  );
}

// ─── Golden Spiral Tower ──────────────────────────────────────────────
// Fibonacci spiral architecture: golden ratio helix of boxes

interface SpiralTowerProps {
  position?: [number, number, number];
  steps?: number;
  scale?: number;
  color?: string;
  autoRotate?: boolean;
  rotationSpeed?: number;
}

export function SpiralTower({
  position = [0, 0, 0],
  steps = 30,
  scale = 0.3,
  color = "#fbbf24",
  autoRotate = true,
  rotationSpeed = 0.15,
}: SpiralTowerProps) {
  const groupRef = useRef<THREE.Group>(null);

  const PHI = 1.618033988749895;

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * rotationSpeed;
    }
  });

  const elements = useMemo(() => {
    const arr: { pos: [number, number, number]; rot: number; size: number; hue: number }[] = [];
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const angle = i * PHI * Math.PI * 2;
      const r = (1 - t) * 2;
      const y = t * 8 - 4;
      arr.push({
        pos: [Math.cos(angle) * r, y, Math.sin(angle) * r],
        rot: angle,
        size: scale * (0.5 + (1 - t) * 0.5),
        hue: t * 0.15,
      });
    }
    return arr;
  }, [steps, scale]);

  return (
    <group ref={groupRef} position={position}>
      {elements.map((el, i) => {
        const c = new THREE.Color(color);
        c.offsetHSL(el.hue, 0, 0);
        return (
          <group key={i} position={el.pos} rotation={[0, el.rot, 0]}>
            <mesh castShadow>
              <boxGeometry args={[el.size, el.size, el.size]} />
              <meshToonMaterial color={c} emissive={c} emissiveIntensity={0.1} />
            </mesh>
            <lineSegments>
              <edgesGeometry args={[new THREE.BoxGeometry(el.size, el.size, el.size)]} />
              <lineBasicMaterial color="#1a1a2e" transparent opacity={0.3} />
            </lineSegments>
          </group>
        );
      })}
    </group>
  );
}

// ─── Voronoi Terrain ──────────────────────────────────────────────────
// Procedural height field using Voronoi noise

interface VoronoiTerrainProps {
  position?: [number, number, number];
  width?: number;
  depth?: number;
  resolution?: number;
  maxHeight?: number;
  color?: string;
}

export function VoronoiTerrain({
  position = [0, 0, 0],
  width = 8,
  depth = 8,
  resolution = 32,
  maxHeight = 1.5,
  color = "#86efac",
}: VoronoiTerrainProps) {
  const geo = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(width, depth, resolution, resolution);
    const pos = geometry.attributes.position;
    const rng = mulberry32(7);

    // Generate Voronoi seed points
    const seeds: [number, number][] = [];
    for (let i = 0; i < 12; i++) {
      seeds.push([rng() * width - width / 2, rng() * depth - depth / 2]);
    }

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // Voronoi: min distance to nearest seed
      let minDist = Infinity;
      let secondDist = Infinity;
      for (const [sx, sy] of seeds) {
        const d = Math.sqrt((x - sx) ** 2 + (y - sy) ** 2);
        if (d < minDist) {
          secondDist = minDist;
          minDist = d;
        } else if (d < secondDist) {
          secondDist = d;
        }
      }
      // Edge distance creates ridges
      const edge = secondDist - minDist;
      const height = edge * maxHeight * 0.5 + Math.sin(x * 0.5) * Math.cos(y * 0.5) * 0.2;
      pos.setZ(i, height);
    }

    geometry.computeVertexNormals();
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }, [width, depth, resolution, maxHeight]);

  return (
    <group position={position}>
      <mesh geometry={geo} receiveShadow castShadow>
        <meshToonMaterial color={color} />
      </mesh>
      <lineSegments geometry={new THREE.EdgesGeometry(geo, 30)}>
        <lineBasicMaterial color="#1a1a2e" transparent opacity={0.15} />
      </lineSegments>
    </group>
  );
}

// ─── Paper Windmill (Interactive) ─────────────────────────────────────
// Traditional origami pinwheel that spins on click/drag

interface PaperWindmillProps {
  position?: [number, number, number];
  bladeCount?: number;
  color?: string;
  size?: number;
}

export function PaperWindmill({
  position = [0, 0, 0],
  bladeCount = 4,
  color = "#fb923c",
  size = 1.5,
}: PaperWindmillProps) {
  const groupRef = useRef<THREE.Group>(null);
  const speedRef = useRef(0);
  const isHovered = useRef(false);

  useFrame((_, delta) => {
    if (groupRef.current) {
      // Decay speed
      speedRef.current *= 0.995;
      if (isHovered.current) speedRef.current += delta * 8;
      groupRef.current.rotation.z += speedRef.current * delta;
    }
  });

  const blades = useMemo(() => {
    const arr: { angle: number; color: string }[] = [];
    const colors = [color, "#f472b6", "#67e8f9", "#a78bfa", "#86efac"];
    for (let i = 0; i < bladeCount; i++) {
      arr.push({
        angle: (i / bladeCount) * Math.PI * 2,
        color: colors[i % colors.length],
      });
    }
    return arr;
  }, [bladeCount, color]);

  return (
    <group position={position}>
      {/* Stick */}
      <mesh position={[0, -size * 0.8, 0]}>
        <cylinderGeometry args={[0.04, 0.04, size * 1.6, 6]} />
        <meshToonMaterial color="#78716c" />
      </mesh>
      {/* Blades */}
      <group
        ref={groupRef}
        position={[0, size * 0.2, 0]}
        onPointerEnter={() => { isHovered.current = true; window.dispatchEvent(new CustomEvent("cursor-change", { detail: { cursor: "grab" } })); }}
        onPointerLeave={() => { isHovered.current = false; window.dispatchEvent(new CustomEvent("cursor-change", { detail: { cursor: "default" } })); }}
      >
        {blades.map((b, i) => (
          <group key={i} rotation={[0, 0, b.angle]}>
            <mesh position={[size * 0.4, 0, 0]} castShadow>
              <coneGeometry args={[size * 0.35, size * 0.5, 3]} />
              <meshToonMaterial color={b.color} side={THREE.DoubleSide} />
            </mesh>
            <lineSegments position={[size * 0.4, 0, 0]}>
              <edgesGeometry args={[new THREE.ConeGeometry(size * 0.35, size * 0.5, 3)]} />
              <lineBasicMaterial color="#1a1a2e" transparent opacity={0.4} />
            </lineSegments>
          </group>
        ))}
        {/* Center pin */}
        <mesh>
          <sphereGeometry args={[0.1, 8, 6]} />
          <meshToonMaterial color="#fbbf24" emissive="#fbbf24" emissiveIntensity={0.3} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Lissajous Curve ──────────────────────────────────────────────────
// 3D Lissajous figure: parametric curve in 3D space

interface LissajousCurveProps {
  position?: [number, number, number];
  freqX?: number;
  freqY?: number;
  freqZ?: number;
  phaseX?: number;
  phaseY?: number;
  phaseZ?: number;
  scale?: number;
  color?: string;
  autoRotate?: boolean;
}

export function LissajousCurve({
  position = [0, 0, 0],
  freqX = 3,
  freqY = 2,
  freqZ = 5,
  phaseX = 0,
  phaseY = Math.PI / 4,
  phaseZ = Math.PI / 2,
  scale = 2,
  color = "#c084fc",
  autoRotate = true,
}: LissajousCurveProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * 0.25;
      groupRef.current.rotation.x += delta * 0.1;
    }
  });

  const geo = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const segments = 500;
    for (let i = 0; i <= segments; i++) {
      const t = (i / segments) * Math.PI * 2;
      const x = Math.sin(freqX * t + phaseX) * scale;
      const y = Math.sin(freqY * t + phaseY) * scale;
      const z = Math.sin(freqZ * t + phaseZ) * scale;
      points.push(new THREE.Vector3(x, y, z));
    }
    const g = new THREE.BufferGeometry().setFromPoints(points);
    return g;
  }, [freqX, freqY, freqZ, phaseX, phaseY, phaseZ, scale]);

  return (
    <group ref={groupRef} position={position}>
      <lineSegments geometry={geo}>
        <lineBasicMaterial color={color} linewidth={2} />
      </lineSegments>
      {/* Sample points */}
      {Array.from({ length: 20 }, (_, i) => {
        const t = (i / 20) * Math.PI * 2;
        const x = Math.sin(freqX * t + phaseX) * scale;
        const y = Math.sin(freqY * t + phaseY) * scale;
        const z = Math.sin(freqZ * t + phaseZ) * scale;
        return (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[0.06, 6, 4]} />
            <meshToonMaterial color={color} emissive={color} emissiveIntensity={0.3} />
          </mesh>
        );
      })}
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

// ─── Util: easeOutBack ────────────────────────────────────────────────
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// ─── Geodesic Dome ────────────────────────────────────────────────────
// Buckminster Fuller's geodesic dome: subdivided icosahedron projected onto sphere

interface GeodesicDomeProps {
  position?: [number, number, number];
  radius?: number;
  frequency?: number;
  color?: string;
  wireframe?: boolean;
  autoRotate?: boolean;
  rotationSpeed?: number;
}

export function GeodesicDome({
  position = [0, 0, 0],
  radius = 2,
  frequency = 2,
  color = "#67e8f9",
  wireframe = false,
  autoRotate = true,
  rotationSpeed = 0.15,
}: GeodesicDomeProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * rotationSpeed;
    }
  });

  const geo = useMemo(() => {
    // Start with icosahedron
    const ico = new THREE.IcosahedronGeometry(radius, frequency);
    const pos = ico.attributes.position;
    // Project onto sphere (already done by IcosahedronGeometry with detail > 0)
    // But we can add slight random displacement for organic feel
    const rng = mulberry32(99);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const len = Math.sqrt(x * x + y * y + z * z);
      const noise = 1 + (rng() - 0.5) * 0.03;
      pos.setXYZ(i, (x / len) * radius * noise, (y / len) * radius * noise, (z / len) * radius * noise);
    }
    ico.computeVertexNormals();
    return ico;
  }, [radius, frequency]);

  return (
    <group ref={groupRef} position={position}>
      <mesh geometry={geo} castShadow>
        <meshToonMaterial color={color} side={THREE.DoubleSide} transparent opacity={wireframe ? 0.6 : 0.85} wireframe={wireframe} />
      </mesh>
      {!wireframe && (
        <lineSegments geometry={new THREE.EdgesGeometry(geo, 15)}>
          <lineBasicMaterial color="#1a1a2e" transparent opacity={0.2} />
        </lineSegments>
      )}
    </group>
  );
}

// ─── DNA Helix ────────────────────────────────────────────────────────
// Double helix with base pair rungs, like real DNA

interface DNAHelixProps {
  position?: [number, number, number];
  turns?: number;
  pointsPerTurn?: number;
  radius?: number;
  height?: number;
  color1?: string;
  color2?: string;
  autoRotate?: boolean;
  rotationSpeed?: number;
}

export function DNAHelix({
  position = [0, 0, 0],
  turns = 3,
  pointsPerTurn = 20,
  radius = 1,
  height = 6,
  color1 = "#f472b6",
  color2 = "#67e8f9",
  autoRotate = true,
  rotationSpeed = 0.2,
}: DNAHelixProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * rotationSpeed;
    }
  });

  const helixData = useMemo(() => {
    const total = turns * pointsPerTurn;
    const strand1: THREE.Vector3[] = [];
    const strand2: THREE.Vector3[] = [];
    const rungs: { pos: [number, number, number]; rotation: [number, number, number] }[] = [];

    for (let i = 0; i <= total; i++) {
      const t = i / total;
      const angle = t * turns * Math.PI * 2;
      const y = (t - 0.5) * height;
      const x1 = Math.cos(angle) * radius;
      const z1 = Math.sin(angle) * radius;
      const x2 = Math.cos(angle + Math.PI) * radius;
      const z2 = Math.sin(angle + Math.PI) * radius;

      strand1.push(new THREE.Vector3(x1, y, z1));
      strand2.push(new THREE.Vector3(x2, y, z2));

      // Base pair rungs every N points
      if (i % 4 === 0 && i > 0 && i < total) {
        rungs.push({
          pos: [(x1 + x2) / 2, y, (z1 + z2) / 2],
          rotation: [0, -angle, 0],
        });
      }
    }

    return { strand1, strand2, rungs };
  }, [turns, pointsPerTurn, radius, height]);

  const strandGeo1 = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(helixData.strand1);
  }, [helixData]);

  const strandGeo2 = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(helixData.strand2);
  }, [helixData]);

  return (
    <group ref={groupRef} position={position}>
      {/* Strand 1 */}
      <lineSegments geometry={strandGeo1}>
        <lineBasicMaterial color={color1} linewidth={2} />
      </lineSegments>
      {/* Strand 2 */}
      <lineSegments geometry={strandGeo2}>
        <lineBasicMaterial color={color2} linewidth={2} />
      </lineSegments>
      {/* Backbone nodes */}
      {helixData.strand1.filter((_, i) => i % 3 === 0).map((p, i) => (
        <mesh key={`n1-${i}`} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.06, 6, 4]} />
          <meshToonMaterial color={color1} emissive={color1} emissiveIntensity={0.3} />
        </mesh>
      ))}
      {helixData.strand2.filter((_, i) => i % 3 === 0).map((p, i) => (
        <mesh key={`n2-${i}`} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.06, 6, 4]} />
          <meshToonMaterial color={color2} emissive={color2} emissiveIntensity={0.3} />
        </mesh>
      ))}
      {/* Base pair rungs */}
      {helixData.rungs.map((r, i) => (
        <group key={`rung-${i}`} position={r.pos} rotation={r.rotation}>
          <mesh>
            <cylinderGeometry args={[0.015, 0.015, radius * 2, 4]} />
            <meshToonMaterial color="#1a1a2e" transparent opacity={0.3} />
          </mesh>
          {/* Base pair nucleotides */}
          <mesh position={[0, 0, radius * 0.4]}>
            <sphereGeometry args={[0.04, 6, 4]} />
            <meshToonMaterial color={i % 2 === 0 ? "#fbbf24" : "#a78bfa"} />
          </mesh>
          <mesh position={[0, 0, -radius * 0.4]}>
            <sphereGeometry args={[0.04, 6, 4]} />
            <meshToonMaterial color={i % 2 === 0 ? "#a78bfa" : "#fbbf24"} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Fractal Icosahedron (Sierpinski-like) ────────────────────────────
// Recursive icosahedron fractal with golden ratio spacing

interface FractalIcosahedronProps {
  position?: [number, number, number];
  level?: number;
  size?: number;
  color?: string;
  autoRotate?: boolean;
  rotationSpeed?: number;
}

export function FractalIcosahedron({
  position = [0, 0, 0],
  level = 2,
  size = 1.5,
  color = "#c084fc",
  autoRotate = true,
  rotationSpeed = 0.2,
}: FractalIcosahedronProps) {
  const groupRef = useRef<THREE.Group>(null);

  const PHI = 1.618033988749895;

  useFrame((_, delta) => {
    if (groupRef.current && autoRotate) {
      groupRef.current.rotation.y += delta * rotationSpeed;
      groupRef.current.rotation.x += delta * rotationSpeed * 0.3;
    }
  });

  const elements = useMemo(() => {
    const arr: { pos: [number, number, number]; scale: number; hue: number }[] = [];

    function recurse(cx: number, cy: number, cz: number, s: number, depth: number, hue: number) {
      if (depth >= level || s < 0.1) {
        arr.push({ pos: [cx, cy, cz], scale: s, hue });
        return;
      }
      // 12 vertices of icosahedron scaled by golden ratio
      const vertices: [number, number, number][] = [
        [0, 1, PHI], [0, 1, -PHI], [0, -1, PHI], [0, -1, -PHI],
        [1, PHI, 0], [1, -PHI, 0], [-1, PHI, 0], [-1, -PHI, 0],
        [PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, 1], [-PHI, 0, -1],
      ];
      const childScale = s * 0.4;
      vertices.forEach((v, i) => {
        const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
        const nx = (v[0] / len) * s * 0.7;
        const ny = (v[1] / len) * s * 0.7;
        const nz = (v[2] / len) * s * 0.7;
        recurse(cx + nx, cy + ny, cz + nz, childScale, depth + 1, hue + 0.02);
      });
    }

    recurse(0, 0, 0, size, 0, 0);
    return arr;
  }, [level, size]);

  return (
    <group ref={groupRef} position={position}>
      {elements.map((el, i) => {
        const c = new THREE.Color(color);
        c.offsetHSL(el.hue % 0.3, 0, 0);
        return (
          <group key={i} position={el.pos}>
            <mesh castShadow>
              <icosahedronGeometry args={[el.scale * 0.3, 0]} />
              <meshToonMaterial color={c} emissive={c} emissiveIntensity={0.1} transparent opacity={0.85} />
            </mesh>
            <lineSegments>
              <edgesGeometry args={[new THREE.IcosahedronGeometry(el.scale * 0.3, 0)]} />
              <lineBasicMaterial color="#1a1a2e" transparent opacity={0.3} />
            </lineSegments>
          </group>
        );
      })}
    </group>
  );
}
