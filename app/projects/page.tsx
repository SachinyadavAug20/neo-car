"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import TilingWindow from "../components/TilingWindow";

const TERMINAL_FONT =
  "var(--font-geist-mono), 'Fira Code', 'JetBrains Mono', monospace";

interface Project {
  name: string;
  description: string;
  tech: string[];
  color: string;
  status: "shipped" | "wip" | "archived";
  link?: string;
}

const PROJECTS: Project[] = [
  {
    name: "BaseCase",
    description:
      "Full-stack SaaS dashboard with real-time analytics, auth, and billing.",
    tech: ["Next.js", "PostgreSQL", "Stripe", "Tailwind"],
    color: "#8aadf4",
    status: "shipped",
  },
  {
    name: "PriorityTask",
    description:
      "AI-powered task manager with priority scoring and smart scheduling.",
    tech: ["React", "OpenAI", "Zustand", "Prisma"],
    color: "#cba6f7",
    status: "shipped",
  },
  {
    name: "Game of Life",
    description:
      "Conway's Game of Life with WebGL rendering and 100k+ concurrent cells.",
    tech: ["Three.js", "WebGL", "WASM", "Rust"],
    color: "#a6e3a1",
    status: "shipped",
  },
  {
    name: "NEON_DRIVE",
    description:
      "This. A persistent 3D audio-reactive world acting as a Web OS portfolio.",
    tech: ["R3F", "Rapier", "GLSL", "Web Audio"],
    color: "#f9e2af",
    status: "shipped",
  },
  {
    name: "SyncDrop",
    description:
      "P2P file sharing via WebRTC with end-to-end encryption and no server.",
    tech: ["WebRTC", "libsodium", "Service Worker"],
    color: "#f38ba8",
    status: "archived",
  },
  {
    name: "PixelForge",
    description:
      "Browser-based pixel art editor with layers, animation, and palette export.",
    tech: ["Canvas API", "IndexedDB", "React"],
    color: "#89dceb",
    status: "wip",
  },
];

function ProjectCard({ project, index }: { project: Project; index: number }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { opacity: 0, y: 20, scale: 0.95 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.4,
        delay: index * 0.08,
        ease: "power2.out",
        clearProps: "transform",
      },
    );
  }, [index]);

  const statusColor =
    project.status === "shipped"
      ? "#a6e3a1"
      : project.status === "wip"
        ? "#f9e2af"
        : "#6c7086";

  return (
    <div
      ref={ref}
      className="pointer-events-auto rounded-lg border bg-[#1e2030]/80 p-4 backdrop-blur-md transition-all hover:bg-[#1e2030]/90 hover:shadow-[0_0_30px_rgba(138,173,244,0.1)]"
      style={{ borderColor: `${project.color}33` }}
    >
      <div className="mb-2 flex items-center justify-between">
        <h3
          className="text-xs font-bold tracking-[0.15em]"
          style={{ color: project.color, fontFamily: TERMINAL_FONT }}
        >
          {project.name}
        </h3>
        <span
          className="rounded px-1 text-[8px] tracking-[0.2em] uppercase"
          style={{
            color: statusColor,
            border: `1px solid ${statusColor}44`,
            fontFamily: TERMINAL_FONT,
          }}
        >
          {project.status}
        </span>
      </div>
      <p
        className="mb-3 text-[10px] leading-relaxed text-[#6c7086]"
        style={{ fontFamily: TERMINAL_FONT }}
      >
        {project.description}
      </p>
      <div className="flex flex-wrap gap-1">
        {project.tech.map((t) => (
          <span
            key={t}
            className="rounded bg-white/5 px-1.5 py-0.5 text-[8px] tracking-[0.1em] text-[#a5adcb]"
            style={{ fontFamily: TERMINAL_FONT }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ProjectsPage() {
  return (
    <div className="pointer-events-auto w-full max-w-5xl">
      <TilingWindow title="ls -la ./projects" className="w-full">
        <div className="mb-3 text-[10px] tracking-[0.15em] text-[#6c7086]" style={{ fontFamily: TERMINAL_FONT }}>
          <span className="text-[#a6e3a1]">$</span> ls --sort=name
          --color=auto ./projects
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PROJECTS.map((project, i) => (
            <ProjectCard key={project.name} project={project} index={i} />
          ))}
        </div>
      </TilingWindow>
    </div>
  );
}
