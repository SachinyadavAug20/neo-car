"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import Link from "next/link";

export default function AboutPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const sectionsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const tl = gsap.timeline();
    gsap.set(heroRef.current, { opacity: 0, y: 30 });
    tl.to(heroRef.current, { opacity: 1, y: 0, duration: 1, ease: "power3.out" });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLDivElement;
            const idx = sectionsRef.current.indexOf(el);
            gsap.to(el, {
              opacity: 1, y: 0, duration: 0.8, ease: "power2.out",
              delay: 0.1 * (idx >= 0 ? idx : 0),
            });
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.15 }
    );

    sectionsRef.current.forEach((el) => {
      if (!el) return;
      gsap.set(el, { opacity: 0, y: 40 });
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const addSectionRef = (el: HTMLDivElement | null) => {
    if (el && !sectionsRef.current.includes(el)) sectionsRef.current.push(el);
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#fdf6e3", color: "#1a1a2e",
      fontFamily: "Georgia, serif",
    }}>
      {/* Navigation */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "16px 32px", background: "rgba(253,246,227,0.9)",
        backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(26,26,46,0.08)",
      }}>
        <Link href="/" style={{
          fontSize: 20, fontWeight: "bold", color: "#1a1a2e", letterSpacing: -1,
          textDecoration: "none",
        }}>
          DRIFT
        </Link>
        <div style={{ display: "flex", gap: 24, alignItems: "center" }}>
          <Link href="/" style={{
            fontSize: 13, color: "#1a1a2e", textDecoration: "none",
            fontWeight: 600, letterSpacing: 0.5,
          }}>
            Home
          </Link>
          <Link href="/about" style={{
            fontSize: 13, color: "#1a1a2e", textDecoration: "none",
            fontWeight: 600, letterSpacing: 0.5, borderBottom: "2px solid #1a1a2e",
            paddingBottom: 2,
          }}>
            About
          </Link>
          <a
            href="https://github.com/SachinyadavAug20/neo-car"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 13, color: "#1a1a2e", textDecoration: "none",
              fontWeight: 600, letterSpacing: 0.5,
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            GitHub
          </a>
        </div>
      </nav>

      {/* Hero */}
      <div ref={heroRef} style={{
        padding: "140px 32px 60px", maxWidth: 800, margin: "0 auto",
      }}>
        <div style={{
          fontSize: 11, color: "#1a1a2e", letterSpacing: 4, textTransform: "uppercase",
          fontWeight: 600, marginBottom: 16,
        }}>
          About the Project
        </div>
        <h1 style={{
          fontSize: 48, fontWeight: "bold", letterSpacing: -2, lineHeight: 1.1,
          marginBottom: 24,
        }}>
          DRIFT
          <span style={{ display: "block", fontSize: 20, fontWeight: 400, letterSpacing: 0, marginTop: 8, fontStyle: "italic" }}>
            A Paper World
          </span>
        </h1>
        <p style={{
          fontSize: 17, lineHeight: 1.8, color: "#1a1a2e", maxWidth: 600,
        }}>
          An interactive 3D storytelling experience built for the Devpost 3D Websites Hackathon.
          A paper craft fantasy about a crane named Milo who cannot fly — told through eight
          cinematic acts with real-time procedural generation, mood-driven environments, and
          hidden discoveries.
        </p>
      </div>

      {/* Divider */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 32px" }}>
        <div style={{ height: 1, background: "rgba(26,26,46,0.1)" }} />
      </div>

      {/* The Story */}
      <section ref={addSectionRef} style={{ padding: "60px 32px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, marginBottom: 12, color: "#1a1a2e" }}>
          The Story
        </div>
        <h2 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 16, letterSpacing: -1 }}>
          The Last Paper Fold
        </h2>
        <div style={{ fontSize: 15, lineHeight: 1.9, color: "#1a1a2e" }}>
          <p style={{ marginBottom: 16 }}>
            Milo is a paper crane with one wing bigger than the other. He cannot fly, but he never
            stops jumping. Along the way, he meets Lira the fox, Sage the ancient owl, and Pip the
            paper boat — each carrying a piece of the story forward.
          </p>
          <p style={{ marginBottom: 16 }}>
            The narrative unfolds across eight acts, each with its own mood, environment, and
            interactive challenge. From a windswept cliff edge to a stormy paper sea, from a
            bioluminescent forest to the final unfolding of a secret fold — every scene is built
            from simple paper geometry with black edge outlines, creating a handcrafted aesthetic
            that feels alive.
          </p>
          <p>
            Hidden throughout the world are lore fragments, console easter eggs, and a secret
            terminal — rewards for the curious. The paper remembers those who look closely.
          </p>
        </div>
      </section>

      {/* Tech Stack */}
      <section ref={addSectionRef} style={{ padding: "60px 32px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, marginBottom: 12, color: "#1a1a2e" }}>
          Technology
        </div>
        <h2 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 24, letterSpacing: -1 }}>
          Built with
        </h2>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16,
        }}>
          {[
            { name: "Next.js 16", desc: "React framework with App Router" },
            { name: "React Three Fiber", desc: "3D rendering with React" },
            { name: "Three.js", desc: "WebGL 3D graphics library" },
            { name: "GSAP", desc: "Cinematic camera animations" },
            { name: "Tailwind CSS", desc: "Utility-first styling" },
            { name: "GLSL Shaders", desc: "Custom water & fluid effects" },
            { name: "L-Systems", desc: "Procedural tree generation" },
            { name: "Conway's Game of Life", desc: "Cellular automata grid" },
          ].map((tech) => (
            <div key={tech.name} style={{
              background: "#fff", border: "2px solid #1a1a2e", borderRadius: 12,
              padding: "16px 20px", boxShadow: "2px 2px 0 #1a1a2e",
            }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{tech.name}</div>
              <div style={{ fontSize: 12, color: "#1a1a2e", opacity: 0.7 }}>{tech.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section ref={addSectionRef} style={{ padding: "60px 32px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, marginBottom: 12, color: "#1a1a2e" }}>
          Features
        </div>
        <h2 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 24, letterSpacing: -1 }}>
          What makes it special
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {[
            {
              title: "Interactive Mechanics",
              desc: "Click-to-jump, drag-to-wind, click-to-unfold — each act has a unique interaction that advances the story.",
            },
            {
              title: "Cinematic Camera System",
              desc: "GSAP-powered camera flights with smooth interpolation, clamping, and fail-safes that guide the viewer through every scene.",
            },
            {
              title: "Mood-Driven Environments",
              desc: "Lighting, fog, and color palettes shift dynamically with the narrative — warm for hope, stormy for conflict, calm for resolution.",
            },
            {
              title: "Procedural Generation",
              desc: "L-System botany creates unique trees, Poisson disk sampling distributes objects naturally, Conway's automata animate the grid.",
            },
            {
              title: "Hidden Discoveries",
              desc: "5 collectible lore fragments, console easter eggs with coordinates, a secret terminal (Ctrl+~), and a command palette (Ctrl+K).",
            },
            {
              title: "Paper Craft Aesthetic",
              desc: "Every 3D object is built from simple primitives — boxes, cones, spheres — with black edge outlines and toon shading for a handcrafted feel.",
            },
            {
              title: "Performance Optimized",
              desc: "Shared geometry caches, zero per-frame allocations, InstancedMesh batching, and reduced terrain for smooth 60fps on most devices.",
            },
            {
              title: "Persistent State",
              desc: "The world remembers your visits. Secret folds, completed acts, and visit count persist across sessions via localStorage.",
            },
          ].map((feature) => (
            <div key={feature.title} style={{
              display: "flex", gap: 16, alignItems: "flex-start",
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: "50%", background: "#1a1a2e",
                marginTop: 7, flexShrink: 0,
              }} />
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{feature.title}</div>
                <div style={{ fontSize: 13, lineHeight: 1.7, color: "#1a1a2e", opacity: 0.8 }}>{feature.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Controls */}
      <section ref={addSectionRef} style={{ padding: "60px 32px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, marginBottom: 12, color: "#1a1a2e" }}>
          Controls
        </div>
        <h2 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 24, letterSpacing: -1 }}>
          How to navigate
        </h2>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12,
        }}>
          {[
            { key: "WASD / HJKL", action: "Move camera" },
            { key: "Mouse Drag", action: "Look around" },
            { key: "Click", action: "Interact with objects" },
            { key: "Space / Enter", action: "Advance story" },
            { key: "Ctrl + K", action: "Command palette" },
            { key: "Ctrl + ~", action: "Drafting terminal" },
            { key: "Esc", action: "Release pointer lock" },
          ].map((ctrl) => (
            <div key={ctrl.key} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "10px 14px", background: "#fff", border: "1.5px solid rgba(26,26,46,0.15)",
              borderRadius: 8,
            }}>
              <code style={{
                fontSize: 12, fontFamily: "monospace", fontWeight: 700,
                background: "#f3f4f6", padding: "2px 6px", borderRadius: 4,
              }}>
                {ctrl.key}
              </code>
              <span style={{ fontSize: 12, color: "#1a1a2e", opacity: 0.7 }}>{ctrl.action}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Developer */}
      <section ref={addSectionRef} style={{ padding: "60px 32px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, textTransform: "uppercase", fontWeight: 600, marginBottom: 12, color: "#1a1a2e" }}>
          Developer
        </div>
        <h2 style={{ fontSize: 28, fontWeight: "bold", marginBottom: 16, letterSpacing: -1 }}>
          Built by Sachin
        </h2>
        <p style={{ fontSize: 15, lineHeight: 1.8, color: "#1a1a2e", marginBottom: 24 }}>
          This project was built as a submission for the Devpost 3D Websites Hackathon.
          It combines interactive 3D storytelling, procedural generation, and cinematic
          web experiences into a single cohesive narrative.
        </p>
        <a
          href="https://github.com/SachinyadavAug20/neo-car"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 10,
            background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 12,
            padding: "14px 28px", fontSize: 14, fontFamily: "Georgia, serif",
            cursor: "pointer", fontWeight: 600, letterSpacing: 0.5,
            boxShadow: "3px 3px 0 #6b7280", textDecoration: "none",
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translate(-1px, -1px)";
            e.currentTarget.style.boxShadow = "4px 4px 0 #6b7280";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translate(0, 0)";
            e.currentTarget.style.boxShadow = "3px 3px 0 #6b7280";
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          View on GitHub
        </a>
      </section>

      {/* Footer */}
      <footer style={{
        padding: "40px 32px", borderTop: "1px solid rgba(26,26,46,0.08)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 13, color: "#1a1a2e", opacity: 0.5 }}>
          DRIFT — A Paper World — Built for the 3D Websites Hackathon
        </div>
      </footer>
    </div>
  );
}
