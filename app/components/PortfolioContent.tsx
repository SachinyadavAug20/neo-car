"use client";

import { useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { useGameStore } from "../lib/gameStore";

const TERMINAL_FONT =
  "var(--font-geist-mono), 'Fira Code', 'JetBrains Mono', monospace";

const PANEL_STYLE = `
  background: rgba(24, 24, 37, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(138, 173, 244, 0.25);
  border-radius: 10px;
  padding: 18px;
  color: #a5adcb;
  font-family: ${TERMINAL_FONT};
  width: 280px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05);
  pointer-events: auto;
`;

const SKILLS = [
  { name: "React / Next.js", pct: 95 },
  { name: "TypeScript", pct: 92 },
  { name: "Three.js / R3F", pct: 88 },
  { name: "Tailwind CSS", pct: 90 },
  { name: "MongoDB / Prisma", pct: 82 },
  { name: "C++ / Raylib", pct: 78 },
  { name: "GLSL Shaders", pct: 85 },
];

const PROJECTS = [
  {
    name: "BaseCase",
    desc: "Full-stack developer Q&A with MDX + MongoDB",
    tech: ["Next.js", "MDX", "MongoDB"],
    color: "#8aadf4",
  },
  {
    name: "PriorityTask",
    desc: "AI task manager built at Genesis 1.0 Hackathon",
    tech: ["React", "OpenAI", "Prisma"],
    color: "#cba6f7",
  },
  {
    name: "Game of Life",
    desc: "C++ / Raylib desktop simulation with RLE parsing",
    tech: ["C++", "Raylib", "WASM"],
    color: "#a6e3a1",
  },
];

function AboutPanel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Html transform distanceFactor={8} style={{ pointerEvents: "auto" }}>
        <div style={{ transform: "scale(0.8)" }}>
          <div style={PANEL_STYLE as any}>
            <div style={{ marginBottom: 10, borderBottom: "1px solid rgba(138,173,244,0.2)", paddingBottom: 8 }}>
              <p style={{ fontSize: 9, letterSpacing: "0.2em", color: "#6c7086", margin: 0 }}>WHOAMI</p>
              <p style={{ fontSize: 11, color: "#b4befe", margin: "4px 0 0" }}>
                B.Tech Computer Engineering — Mumbai University
              </p>
            </div>
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 8, letterSpacing: "0.25em", color: "#6c7086", marginBottom: 6 }}>SYSTEM</p>
              <p style={{ fontSize: 9, color: "#cba6f7" }}>Arch Linux · Neovim · Hyprland</p>
            </div>
            <div style={{ marginBottom: 10 }}>
              <p style={{ fontSize: 8, letterSpacing: "0.25em", color: "#6c7086", marginBottom: 6 }}>ALGORITHMS</p>
              <p style={{ fontSize: 9, color: "#a6e3a1" }}>LeetCode Guardian · CF Specialist</p>
            </div>
            <div>
              <p style={{ fontSize: 8, letterSpacing: "0.25em", color: "#6c7086", marginBottom: 6 }}>STACK</p>
              {SKILLS.map((s) => (
                <div key={s.name} style={{ marginBottom: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, marginBottom: 2 }}>
                    <span style={{ color: "#a5adcb" }}>{s.name}</span>
                    <span style={{ color: "#6c7086" }}>{s.pct}%</span>
                  </div>
                  <div style={{ height: 3, background: "rgba(138,173,244,0.1)", borderRadius: 2 }}>
                    <div style={{
                      height: "100%",
                      width: `${s.pct}%`,
                      background: "linear-gradient(90deg, #8aadf4, #cba6f7)",
                      borderRadius: 2,
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}

function ProjectsPanel({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <Html transform distanceFactor={8} style={{ pointerEvents: "auto" }}>
        <div style={{ transform: "scale(0.8)" }}>
          <div style={PANEL_STYLE as any}>
            <p style={{ fontSize: 9, letterSpacing: "0.2em", color: "#6c7086", margin: "0 0 10px" }}>
              LS -LA ./PROJECTS
            </p>
            {PROJECTS.map((p) => (
              <div key={p.name} style={{
                marginBottom: 10,
                padding: 8,
                borderRadius: 6,
                border: `1px solid ${p.color}33`,
                background: "rgba(30,32,48,0.6)",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: "bold", color: p.color, letterSpacing: "0.1em" }}>
                    {p.name}
                  </span>
                  <span style={{
                    fontSize: 7,
                    padding: "1px 5px",
                    borderRadius: 3,
                    border: `1px solid ${p.color}44`,
                    color: p.color,
                    letterSpacing: "0.15em",
                  }}>
                    SHIPPED
                  </span>
                </div>
                <p style={{ fontSize: 8, color: "#6c7086", margin: "0 0 6px" }}>{p.desc}</p>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {p.tech.map((t) => (
                    <span key={t} style={{
                      fontSize: 7,
                      padding: "1px 5px",
                      borderRadius: 3,
                      background: "rgba(138,173,244,0.08)",
                      color: "#a5adcb",
                    }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Html>
    </group>
  );
}

function Panel({
  position,
  children,
  index,
}: {
  position: [number, number, number];
  children: React.ReactNode;
  index: number;
}) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state) => {
    const el = ref.current;
    if (!el) return;
    const t = state.clock.elapsedTime;
    el.position.y = position[1] + Math.sin(t * 0.5 + index * 1.2) * 0.3;
    el.rotation.y = Math.sin(t * 0.3 + index * 0.8) * 0.04;
  });

  return (
    <group ref={ref} position={position}>
      {children}
    </group>
  );
}

export default function PortfolioContent() {
  const mode = useGameStore((s) => s.mode);
  if (mode !== "portfolio") return null;

  return (
    <group>
      <Panel position={[-8, 3, -40]} index={0}>
        <AboutPanel position={[0, 0, 0]} />
      </Panel>
      <Panel position={[8, 4, -80]} index={1}>
        <ProjectsPanel position={[0, 0, 0]} />
      </Panel>
      <Panel position={[-6, 5, -120]} index={2}>
        <AboutPanel position={[0, 0, 0]} />
      </Panel>
    </group>
  );
}
