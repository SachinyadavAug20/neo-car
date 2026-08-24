"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const HEX_COUNT = 30;

export default function HexGrid() {
  const groupRef = useRef<THREE.Group>(null);

  const hexagons = useMemo(() => {
    return Array.from({ length: HEX_COUNT }, (_, i) => {
      const x = (Math.random() - 0.5) * 60;
      const y = Math.random() * 20 - 5;
      const z = (Math.random() - 0.5) * 60;
      const scale = 0.3 + Math.random() * 0.8;
      const rotation = Math.random() * Math.PI * 2;

      return { x, y, z, scale, rotation, offset: i * 0.5 };
    });
  }, []);

  const hexShape = useMemo(() => {
    const shape = new THREE.Shape();
    const size = 1;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const x = Math.cos(angle) * size;
      const y = Math.sin(angle) * size;
      if (i === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    }
    shape.closePath();
    return shape;
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.elapsedTime;

    groupRef.current.children.forEach((child, i) => {
      if (child instanceof THREE.Mesh) {
        child.rotation.z = t * 0.2 + hexagons[i].rotation;
        child.position.y = hexagons[i].y + Math.sin(t * 0.5 + i) * 0.5;
        const pulse = 0.8 + Math.sin(t * 1.5 + i * 0.3) * 0.2;
        child.scale.setScalar(hexagons[i].scale * pulse);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {hexagons.map((hex, i) => (
        <mesh
          key={i}
          position={[hex.x, hex.y, hex.z]}
          rotation={[0, hex.rotation, 0]}
          scale={hex.scale}
        >
          <shapeGeometry args={[hexShape]} />
          <meshBasicMaterial
            color="#4ecdc4"
            transparent
            opacity={0.05}
            side={THREE.DoubleSide}
            wireframe
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}
