"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const NODE_COUNT = 30;
const CONNECTION_DISTANCE = 12;
const MAX_POSITIONS = NODE_COUNT * NODE_COUNT * 6;

export default function NeuralNetwork() {
  const groupRef = useRef<THREE.Group>(null);
  const linesRef = useRef<THREE.LineSegments>(null);
  const dummy = useRef(new THREE.Object3D());

  const nodes = useMemo(() => {
    return Array.from({ length: NODE_COUNT }, () => ({
      x: (Math.random() - 0.5) * 40,
      y: 5 + Math.random() * 20,
      z: (Math.random() - 0.5) * 40,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.3,
      vz: (Math.random() - 0.5) * 0.5,
    }));
  }, []);

  const posAttr = useMemo(() => {
    return new THREE.Float32BufferAttribute(new Float32Array(MAX_POSITIONS), 3);
  }, []);

  useFrame((state) => {
    if (!groupRef.current || !linesRef.current) return;
    const t = state.clock.elapsedTime;

    nodes.forEach((node) => {
      node.x += node.vx * 0.02;
      node.y += node.vy * 0.02;
      node.z += node.vz * 0.02;
      if (Math.abs(node.x) > 20) node.vx *= -1;
      if (node.y < 5 || node.y > 25) node.vy *= -1;
      if (Math.abs(node.z) > 20) node.vz *= -1;
    });

    let offset = 0;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dz = nodes[i].z - nodes[j].z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < CONNECTION_DISTANCE) {
          posAttr.array[offset++] = nodes[i].x;
          posAttr.array[offset++] = nodes[i].y;
          posAttr.array[offset++] = nodes[i].z;
          posAttr.array[offset++] = nodes[j].x;
          posAttr.array[offset++] = nodes[j].y;
          posAttr.array[offset++] = nodes[j].z;
        }
      }
    }

    posAttr.needsUpdate = true;
    linesRef.current.geometry.setDrawRange(0, offset / 3);

    groupRef.current.children.forEach((child, i) => {
      if (i < nodes.length) {
        child.position.set(nodes[i].x, nodes[i].y, nodes[i].z);
        const pulse = 0.5 + Math.sin(t * 2 + i) * 0.5;
        child.scale.setScalar(0.1 + pulse * 0.05);
      }
    });
  });

  return (
    <>
      <group ref={groupRef}>
        {nodes.map((_, i) => (
          <mesh key={i} frustumCulled={false}>
            <sphereGeometry args={[1, 6, 6]} />
            <meshBasicMaterial color="#67e8f9" transparent opacity={0.4} />
          </mesh>
        ))}
      </group>
      <lineSegments ref={linesRef} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[posAttr.array as Float32Array, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#67e8f9" transparent opacity={0.1} />
      </lineSegments>
    </>
  );
}
