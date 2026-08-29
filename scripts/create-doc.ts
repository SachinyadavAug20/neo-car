import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  AlignmentType, ExternalHyperlink, BorderStyle,
} from "docx";
import { writeFileSync } from "fs";

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: "Calibri", size: 22, color: "1a1a2e" },
      },
    },
  },
  sections: [
    {
      children: [
        // Title
        new Paragraph({
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.LEFT,
          spacing: { after: 100 },
          children: [
            new TextRun({ text: "DRIFT", bold: true, size: 56, font: "Georgia" }),
            new TextRun({ text: " -- A Paper World", size: 28, font: "Georgia", italics: true }),
          ],
        }),

        // Tagline
        new Paragraph({
          spacing: { after: 400 },
          children: [
            new TextRun({
              text: "An interactive 3D paper craft storytelling experience built for the Devpost 3D Websites Hackathon.",
              size: 22, italics: true, color: "555555",
            }),
          ],
        }),

        // Divider
        new Paragraph({
          spacing: { after: 200 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" } },
          children: [],
        }),

        // ─── Inspiration ───
        heading("Inspiration"),
        body("I wanted to create something that felt handcrafted in a world of polished 3D experiences. The idea of a paper crane named Milo who cannot fly but never stops jumping came from wanting a protagonist that is relatable through imperfection. Every fold, every edge, every shadow is intentionally simple."),

        // ─── What it does ───
        heading("What it does"),
        body("DRIFT is an interactive 3D storytelling experience with 8 cinematic acts, 110 procedural sounds, and a full narrative arc about a paper crane's journey across a folded world. Players:"),
        bullet("Navigate a paper craft diorama with WASD / camera controls"),
        bullet("Interact through click-to-jump, drag-to-wind, collect-leaves, row-boat, and more"),
        bullet("Discover hidden lore fragments, console easter eggs, and a secret terminal"),
        bullet("Experience mood-driven environments (warm, storm, calm, sorrow, hope, final)"),
        bullet("Track their full journey with 30+ stats and earn badges on the end screen"),

        // ─── How I built it ───
        heading("How I built it"),
        body("The project combines several technologies into a cohesive interactive narrative:"),

        techRow("React Three Fiber + Three.js", "All 3D rendering with paper craft geometry, black edge outlines, and meshToonMaterial for a handcrafted look"),
        techRow("GSAP", "Cinematic camera animations, UI transitions, and progressive reveals across all 8 acts"),
        techRow("Next.js 16 (App Router)", "React 19, server-side rendering, optimized build, and Vercel deployment"),
        techRow("Custom Web Audio API Engine", "110 procedural sounds generated at runtime including wind, thunder, cranes, splashes, and music chords -- zero external audio files"),
        techRow("L-System Procedural Generation", "Unique trees generated from string rewrite rules, each one different"),
        techRow("Conway's Game of Life", "Cellular automata grid puzzle in Act 5 where players toggle cells to awaken the pattern"),
        techRow("GLSL Shaders", "Custom FBM (Fractal Brownian Motion) water fluid simulation for the paper sea"),
        techRow("Persistent State", "localStorage saves secret folds, visit count, completed acts, and total play time across sessions"),

        // ─── Challenges ───
        heading("Challenges"),
        challenge("Camera System", "Building 9 interaction-specific camera paths with GSAP interpolation, lookAt clamping, and fail-safes that guide the viewer without breaking immersion. Each interaction type needed its own camera behavior."),
        challenge("Audio at Scale", "Creating 110 sounds procedurally using the Web Audio API -- oscillators, noise generators, filters, and gain envelopes -- without a single external audio file."),
        challenge("Performance", "Shared geometry caches, InstancedMesh batching, zero per-frame allocations, and reduced terrain complexity to maintain 60fps with hundreds of objects on screen."),
        challenge("Narrative State Machine", "Managing 8 acts, 30+ story beats, 9 interaction types, mood transitions, and environment changes across a single cohesive experience."),

        // ─── What I learned ───
        heading("What I learned"),
        body("The hardest part of interactive 3D storytelling is not the technology -- it is making every interaction feel intentional. Every click, every camera move, every sound serves the narrative. I learned how to balance technical complexity with emotional simplicity, and how procedural generation can create moments that feel handcrafted even when they are not."),

        // ─── Built with ───
        heading("Built with"),
        body("React, Next.js, Three.js, React Three Fiber, GSAP, Tailwind CSS, TypeScript, GLSL, Web Audio API, Vercel, L-Systems, Procedural Generation, Interactive Fiction, Dark Mode"),

        // ─── Links ───
        heading("Links"),
        new Paragraph({
          spacing: { after: 80 },
          children: [
            new TextRun({ text: "Live Demo:  ", bold: true, size: 22 }),
            new ExternalHyperlink({ children: [new TextRun({ text: "https://drift-paper.vercel.app", style: "Hyperlink", size: 22 })], link: "https://drift-paper.vercel.app" }),
          ],
        }),
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: "Source Code:  ", bold: true, size: 22 }),
            new ExternalHyperlink({ children: [new TextRun({ text: "https://github.com/SachinyadavAug20/neo-car", style: "Hyperlink", size: 22 })], link: "https://github.com/SachinyadavAug20/neo-car" }),
          ],
        }),

        // Footer
        new Paragraph({
          border: { top: { style: BorderStyle.SINGLE, size: 1, color: "cccccc" } },
          spacing: { before: 400 },
          children: [
            new TextRun({ text: "Built by Sachin for the Devpost 3D Websites Hackathon", size: 18, color: "999999", italics: true }),
          ],
        }),
      ],
    },
  ],
});

function heading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    children: [new TextRun({ text, bold: true, size: 28, font: "Georgia" })],
  });
}

function body(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [new TextRun({ text, size: 22 })],
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({
    spacing: { after: 60 },
    indent: { left: 720, hanging: 360 },
    children: [
      new TextRun({ text: "\u2022  ", size: 22 }),
      new TextRun({ text, size: 22 }),
    ],
  });
}

function techRow(name: string, desc: string): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text: name + ":  ", bold: true, size: 22 }),
      new TextRun({ text: desc, size: 22 }),
    ],
  });
}

function challenge(title: string, desc: string): Paragraph {
  return new Paragraph({
    spacing: { after: 120 },
    children: [
      new TextRun({ text: title + " -- ", bold: true, size: 22 }),
      new TextRun({ text: desc, size: 22 }),
    ],
  });
}

// Generate
async function main() {
  const buffer = await Packer.toBuffer(doc);
  const outPath = "DRIFT-Project-Details.docx";
  writeFileSync(outPath, buffer);
  console.log(`Created: ${outPath} (${(buffer.length / 1024).toFixed(1)} KB)`);
}
main();
