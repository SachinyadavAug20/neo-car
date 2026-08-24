"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Html } from "@react-three/drei";

interface RevealSection {
  position: [number, number, number];
  title: string;
  subtitle: string;
  description: string;
}

const SECTIONS: RevealSection[] = [
  { position: [0, 8, 10], title: "DRIFT", subtitle: "FLOATING SKY ISLANDS", description: "Where reality dissolves into wonder" },
  { position: [15, 10, 5], title: "EXPLORE", subtitle: "FIVE BIOMES", description: "Crystal caves, mushroom forests, ancient ruins, sky gardens, and the void" },
  { position: [-10, 12, -5], title: "DISCOVER", subtitle: "SCATTERED MEMORIES", description: "Every island holds a fragment of a forgotten story" },
  { position: [5, 6, -15], title: "FEEL", subtitle: "THE ATMOSPHERE", description: "Light, fog, and particles respond to your presence" },
  { position: [-15, 14, -20], title: "CONNECT", subtitle: "WITH THE VOID", description: "The spaces between hold the deepest truths" },
];

export default function ScrollReveal() {
  const { camera } = useThree();
  const [activeSection, setActiveSection] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = Math.min(scrollY / maxScroll, 1);
      setProgress(scrollProgress);

      const sectionIndex = Math.floor(scrollProgress * SECTIONS.length);
      if (sectionIndex < SECTIONS.length) {
        setActiveSection(sectionIndex);
      } else {
        setActiveSection(null);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useFrame((state) => {
    if (activeSection === null) return;
    const t = state.clock.elapsedTime;
    const section = SECTIONS[activeSection];

    camera.position.lerp(
      new THREE.Vector3(
        section.position[0] * 0.3,
        section.position[1] * 0.3,
        section.position[2] * 0.3 + 15,
      ),
      0.02,
    );

    camera.lookAt(
      section.position[0] * 0.5,
      section.position[1] * 0.5,
      section.position[2] * 0.5,
    );
  });

  return (
    <group ref={groupRef}>
      {SECTIONS.map((section, i) => (
        <group key={i} position={section.position}>
          <Html
            center
            distanceFactor={15}
            style={{
              opacity: activeSection === i ? 1 : 0.1,
              transition: "opacity 0.8s ease",
              pointerEvents: "none",
            }}
          >
            <div className="text-center">
              <div className="text-[10px] tracking-[1em] text-white/20 mb-2">{section.subtitle}</div>
              <h1 className="text-5xl font-display tracking-[0.5em] text-white/80 mb-4">{section.title}</h1>
              <p className="text-sm text-white/30 max-w-xs">{section.description}</p>
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}
