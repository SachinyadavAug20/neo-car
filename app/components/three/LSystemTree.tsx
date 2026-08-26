"use client";

import { useRef, useMemo, useState, useCallback } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// ─── L-System Grammar ─────────────────────────────────────────────────

interface LSystemRule {
  from: string;
  to: string;
}

function deriveLSystem(axiom: string, rules: LSystemRule[], iterations: number): string {
  let current = axiom;
  for (let i = 0; i < iterations; i++) {
    let next = "";
    for (const ch of current) {
      const rule = rules.find(r => r.from === ch);
      next += rule ? rule.to : ch;
    }
    current = next;
  }
  return current;
}

// ─── Turtle Interpreter ───────────────────────────────────────────────

interface Segment {
  start: THREE.Vector3;
  end: THREE.Vector3;
  thickness: number;
  depth: number;
}

function interpretLSystem(
  instructions: string,
  angle: number,
  length: number,
  lengthDecay: number,
  thicknessDecay: number,
  maxDepth: number,
): Segment[] {
  const segments: Segment[] = [];
  const stack: { pos: THREE.Vector3; dir: THREE.Vector3; len: number; thick: number; depth: number }[] = [];
  const pos = new THREE.Vector3(0, 0, 0);
  const dir = new THREE.Vector3(0, 1, 0); // start growing up
  let len = length;
  let thick = 0.08;
  let depth = 0;

  const right = new THREE.Vector3();
  const forward = new THREE.Vector3();
  const rotQ = new THREE.Quaternion();

  for (const ch of instructions) {
    switch (ch) {
      case "F": {
        if (depth > maxDepth) break;
        const end = pos.clone().add(dir.clone().multiplyScalar(len));
        segments.push({ start: pos.clone(), end: end.clone(), thickness: thick, depth });
        pos.copy(end);
        break;
      }
      case "+": {
        // Rotate around Z (tilt right)
        right.set(0, 0, 1);
        rotQ.setFromAxisAngle(right, angle);
        dir.applyQuaternion(rotQ);
        break;
      }
      case "-": {
        // Rotate around Z (tilt left)
        right.set(0, 0, -1);
        rotQ.setFromAxisAngle(right, angle);
        dir.applyQuaternion(rotQ);
        break;
      }
      case "&": {
        // Pitch down
        right.set(1, 0, 0);
        rotQ.setFromAxisAngle(right, angle);
        dir.applyQuaternion(rotQ);
        break;
      }
      case "^": {
        // Pitch up
        right.set(-1, 0, 0);
        rotQ.setFromAxisAngle(right, angle);
        dir.applyQuaternion(rotQ);
        break;
      }
      case "\\": {
        // Roll left
        rotQ.setFromAxisAngle(dir, angle);
        right.applyQuaternion(rotQ);
        break;
      }
      case "/": {
        // Roll right
        rotQ.setFromAxisAngle(dir, -angle);
        right.applyQuaternion(rotQ);
        break;
      }
      case "[": {
        stack.push({ pos: pos.clone(), dir: dir.clone(), len, thick, depth });
        len *= lengthDecay;
        thick *= thicknessDecay;
        depth++;
        break;
      }
      case "]": {
        const s = stack.pop();
        if (s) {
          pos.copy(s.pos);
          dir.copy(s.dir);
          len = s.len;
          thick = s.thick;
          depth = s.depth;
        }
        break;
      }
    }
  }

  return segments;
}

// ─── Instanced L-System Tree ──────────────────────────────────────────

interface LSystemTreeProps {
  position: [number, number, number];
  axiom?: string;
  rules?: LSystemRule[];
  iterations?: number;
  angle?: number;
  length?: number;
  lengthDecay?: number;
  thicknessDecay?: number;
  maxDepth?: number;
  trunkColor?: string;
  leafColor?: string;
  scale?: number;
  onClick?: () => void;
}

const TRUNK_GEO = new THREE.CylinderGeometry(1, 1, 1, 5);
const LEAF_GEO = new THREE.SphereGeometry(1, 5, 5);

export function LSystemTree({
  position,
  axiom = "F",
  rules = [
    { from: "F", to: "FF+[+F-F-F]-[-F+F+F]" },
  ],
  iterations = 2,
  angle = 25 * (Math.PI / 180),
  length = 0.6,
  lengthDecay = 0.7,
  thicknessDecay = 0.65,
  maxDepth = 3,
  trunkColor = "#92400e",
  leafColor = "#4ade80",
  scale = 1,
  onClick,
}: LSystemTreeProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [grown, setGrown] = useState(false);
  const [growthProgress, setGrowthProgress] = useState(0);

  const { segments, leafPositions } = useMemo(() => {
    const instructions = deriveLSystem(axiom, rules, iterations);
    const segs = interpretLSystem(instructions, angle, length, lengthDecay, thicknessDecay, maxDepth);
    const leaves = segs
      .filter(s => s.depth >= maxDepth - 1)
      .map(s => s.end.clone());
    return { segments: segs, leafPositions: leaves };
  }, [axiom, JSON.stringify(rules), iterations, angle, length, lengthDecay, thicknessDecay, maxDepth]);

  // Group segments by thickness for instanced rendering
  const { trunkSegments, branchSegments } = useMemo(() => {
    const trunk: Segment[] = [];
    const branch: Segment[] = [];
    for (const s of segments) {
      if (s.thickness > 0.04) trunk.push(s);
      else branch.push(s);
    }
    return { trunkSegments: trunk, branchSegments: branch };
  }, [segments]);

  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const branchRef = useRef<THREE.InstancedMesh>(null);
  const leafRef = useRef<THREE.InstancedMesh>(null);

  const trunkMat = useMemo(() => new THREE.MeshToonMaterial({ color: trunkColor }), [trunkColor]);
  const leafMat = useMemo(() => new THREE.MeshToonMaterial({ color: leafColor }), [leafColor]);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Click to grow
  const handleClick = useCallback(() => {
    if (!grown) {
      setGrown(true);
    }
    onClick?.();
  }, [grown, onClick]);

  // Animate growth
  useFrame((_, delta) => {
    if (grown && growthProgress < 1) {
      setGrowthProgress(prev => Math.min(1, prev + delta * 2));
    }

    const progress = grown ? growthProgress : 0;
    const visibleSegments = Math.floor(segments.length * progress);

    // Update trunk instances
    if (trunkRef.current) {
      for (let i = 0; i < trunkSegments.length && i < visibleSegments; i++) {
        const s = trunkSegments[i];
        const mid = s.start.clone().add(s.end).multiplyScalar(0.5);
        const dir = s.end.clone().sub(s.start);
        const len = dir.length();

        dummy.position.copy(mid);
        dummy.scale.set(s.thickness * 2, len, s.thickness * 2);
        dummy.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          dir.normalize()
        );
        dummy.updateMatrix();
        trunkRef.current.setMatrixAt(i, dummy.matrix);
      }
      trunkRef.current.count = Math.min(trunkSegments.length, visibleSegments);
      trunkRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update branch instances
    if (branchRef.current) {
      const offset = trunkSegments.length;
      for (let i = 0; i < branchSegments.length && i + offset < visibleSegments; i++) {
        const s = branchSegments[i];
        const mid = s.start.clone().add(s.end).multiplyScalar(0.5);
        const dir = s.end.clone().sub(s.start);
        const len = dir.length();

        dummy.position.copy(mid);
        dummy.scale.set(s.thickness * 2, len, s.thickness * 2);
        dummy.quaternion.setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          dir.normalize()
        );
        dummy.updateMatrix();
        branchRef.current.setMatrixAt(i, dummy.matrix);
      }
      branchRef.current.count = Math.min(branchSegments.length, Math.max(0, visibleSegments - offset));
      branchRef.current.instanceMatrix.needsUpdate = true;
    }

    // Update leaf instances
    if (leafRef.current) {
      const leafCount = Math.min(leafPositions.length, Math.floor(leafPositions.length * progress));
      for (let i = 0; i < leafCount; i++) {
        dummy.position.copy(leafPositions[i]);
        dummy.scale.setScalar(0.06 + Math.random() * 0.02);
        dummy.updateMatrix();
        leafRef.current.setMatrixAt(i, dummy.matrix);
      }
      leafRef.current.count = leafCount;
      leafRef.current.instanceMatrix.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale} onClick={handleClick}>
      <instancedMesh ref={trunkRef} args={[TRUNK_GEO, trunkMat, trunkSegments.length]} frustumCulled={false} castShadow />
      <instancedMesh ref={branchRef} args={[TRUNK_GEO, trunkMat, branchSegments.length]} frustumCulled={false} />
      <instancedMesh ref={leafRef} args={[LEAF_GEO, leafMat, leafPositions.length]} frustumCulled={false} />
    </group>
  );
}

// ─── Pre-configured tree variants ─────────────────────────────────────

export function ConeTree(props: Omit<LSystemTreeProps, "axiom" | "rules" | "iterations">) {
  return (
    <LSystemTree
      {...props}
      axiom="F"
      rules={[{ from: "F", to: "FF-[-F+F+F]+[+F-F-F]" }]}
      iterations={2}
      angle={22 * (Math.PI / 180)}
      length={0.5}
      maxDepth={3}
    />
  );
}

export function WillowTree(props: Omit<LSystemTreeProps, "axiom" | "rules" | "iterations">) {
  return (
    <LSystemTree
      {...props}
      axiom="X"
      rules={[
        { from: "X", to: "F+[[X]-X]-F[-FX]+X" },
        { from: "F", to: "FF" },
      ]}
      iterations={3}
      angle={25 * (Math.PI / 180)}
      length={0.35}
      maxDepth={4}
      trunkColor="#78350f"
      leafColor="#22c55e"
    />
  );
}

export function BonsaiTree(props: Omit<LSystemTreeProps, "axiom" | "rules" | "iterations">) {
  return (
    <LSystemTree
      {...props}
      axiom="F"
      rules={[{ from: "F", to: "F[+F]F[-F]+F" }]}
      iterations={3}
      angle={25.7 * (Math.PI / 180)}
      length={0.4}
      maxDepth={3}
      trunkColor="#92400e"
      leafColor="#15803d"
    />
  );
}
