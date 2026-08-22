"use client";

import { useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";

interface InteractiveObjectProps {
  position: [number, number, number];
  color: string;
  label: string;
  shape: "sphere" | "torus" | "dodecahedron" | "octahedron";
  scale?: number;
}

function InteractiveObject({ position, color, label, shape, scale = 1 }: InteractiveObjectProps) {
  const ref = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [clicked, setClicked] = useState(false);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y += 0.01;
    if (hovered) {
      ref.current.scale.lerp(new THREE.Vector3(1.2, 1.2, 1.2), 0.1);
    } else {
      ref.current.scale.lerp(new THREE.Vector3(1, 1, 1), 0.1);
    }
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + position[0]) * 0.15;
  });

  const Geometry = {
    sphere: <sphereGeometry args={[0.5 * scale, 16, 16]} />,
    torus: <torusGeometry args={[0.4 * scale, 0.15, 12, 24]} />,
    dodecahedron: <dodecahedronGeometry args={[0.45 * scale, 0]} />,
    octahedron: <octahedronGeometry args={[0.5 * scale, 0]} />,
  }[shape];

  return (
    <group position={position}>
      <mesh
        ref={ref}
        onPointerEnter={() => {
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerLeave={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
        onClick={(e) => {
          e.stopPropagation();
          setClicked((c) => !c);
        }}
      >
        {Geometry}
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : clicked ? 1.2 : 0.3}
          roughness={0.3}
          metalness={0.5}
          transparent
          opacity={hovered ? 1 : 0.85}
        />
      </mesh>

      {hovered && (
        <Html center distanceFactor={6} style={{ pointerEvents: "none" }}>
          <div className="glass rounded-lg px-3 py-1.5 text-xs font-medium text-white whitespace-nowrap">
            {label}
            {clicked && (
              <span className="ml-2 text-[10px] text-[#4ecdc4]">ACTIVE</span>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

export default function InteractiveObjects() {
  const objects: InteractiveObjectProps[] = [
    { position: [1.5, 2, 0.5], color: "#67e8f9", label: "Memory Shard", shape: "octahedron" },
    { position: [-1, 1.5, 1], color: "#a78bfa", label: "Dream Core", shape: "dodecahedron" },
    { position: [35, 1, -18], color: "#c084fc", label: "Spore Orb", shape: "sphere" },
    { position: [37, 3, -22], color: "#e879f9", label: "Fungal Lens", shape: "torus" },
    { position: [-28, 1, -33], color: "#fbbf24", label: "Ancient Seal", shape: "dodecahedron" },
    { position: [-32, 2.5, -36], color: "#f59e0b", label: "Ruin Echo", shape: "octahedron", scale: 0.7 },
    { position: [16, 0.5, -48], color: "#f472b6", label: "Bloom Node", shape: "sphere" },
    { position: [14, 2, -52], color: "#fb7185", label: "Petal Heart", shape: "torus", scale: 0.8 },
  ];

  return (
    <>
      {objects.map((obj, i) => (
        <InteractiveObject key={i} {...obj} />
      ))}
    </>
  );
}
