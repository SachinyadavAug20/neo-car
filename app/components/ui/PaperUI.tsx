"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import gsap from "gsap";

const storyChapters = [
  {
    number: "I",
    title: "The Village of Small Folds",
    text: "There was a paper crane named Milo who could not fly. One wing was bigger than the other. Every bird in the village told him he was broken. But every morning he stood on the hill and jumped. Every morning he fell. Every single time.",
    characterLabel: "milo — a paper crane with one big wing",
    color: "#fef3c7",
  },
  {
    number: "II",
    title: "The Storm",
    text: "One evening the wind came different. It did not push Milo away. It wrapped around him. It held him in the air for one moment. Just one moment. Then it let go. And in that moment Milo understood. The wind was not his enemy. It was a language he had not learned yet.",
    characterLabel: "the wind — not a villain, not a hero",
    color: "#e0f2fe",
  },
  {
    number: "III",
    title: "The Fox Who Was Hiding",
    text: "In the Forest of Folded Trees Milo met Lira. She was a paper fox curled under a tree with crinkled edges. She had lost her brother Pip three years ago. The wind took him. She never forgave it. But Milo told her about the moment the wind held him. And something shifted.",
    characterLabel: "lira — a paper fox hiding from the wind",
    color: "#fce7f3",
  },
  {
    number: "IV",
    title: "The Unfolded Lands",
    text: "Beyond the hills the paper was white and flat and raw. Like a blank page. Like a beginning. They found a cricket named Chip who folded himself into different shapes. He said every direction leads to the mountain. But the real question is not how to get there. It is why you want to go.",
    characterLabel: "chip — a paper cricket who folds himself into shapes",
    color: "#f5f5f4",
  },
  {
    number: "V",
    title: "Flying",
    text: "The wind came and Milo spread his wings. For the first time in his life he was flying. Not well. Spinning. Tumbling. But in the air. The wind carried him to the highest mountain where Sage the owl waited.",
    characterLabel: "milo — learning to fly",
    color: "#faf5ff",
  },
  {
    number: "VI",
    title: "The Secret Fold",
    text: "Sage gave Milo a blank piece of paper. She said the Secret Fold is not about fixing. It is about unfolding. About remembering the moment before the fold. When you could be anything. You are not your folds. You are the paper. You are the possibility.",
    characterLabel: "sage — an origami owl who has not spoken in 100 years",
    color: "#f0fdf4",
  },
  {
    number: "VII",
    title: "The Boat Named Pip",
    text: "They found Pip in the Unfolded Lands. He was a paper boat now. A golden boat with a white sail. He was happy. The wind had not taken him. It had shown him what he was always meant to be. Lira cried paper tears onto the water.",
    characterLabel: "pip — a paper boat who found his shape",
    color: "#fff7ed",
  },
  {
    number: "VIII",
    title: "The Moral Fold",
    text: "You are not your folds. You are not your creases. You are not your shape. You are the paper. You are the possibility. You are everything you have not yet become. Let the wind carry you. Be everything.",
    characterLabel: "the secret fold",
    color: "#fefce8",
  },
];

export default function PaperUI() {
  const [page, setPage] = useState(0);
  const [started, setStarted] = useState(false);
  const [visible, setVisible] = useState(true);
  const [crystals, setCrystals] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [collectFlash, setCollectFlash] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const charRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const progRef = useRef<HTMLDivElement>(null);

  const next = useCallback(() => {
    setPage((p) => Math.min(p + 1, storyChapters.length - 1));
  }, []);

  const prev = useCallback(() => {
    setPage((p) => Math.max(p - 1, 0));
  }, []);

  // GSAP card animation — waits for cinematic camera flight
  useEffect(() => {
    if (!started || !cardRef.current) return;

    const animateCard = () => {
      const tl = gsap.timeline();
      gsap.set(cardRef.current!, { opacity: 0, x: -30, scale: 0.95 });
      gsap.set([titleRef.current, textRef.current, charRef.current, navRef.current], { opacity: 0, y: 10 });
      tl.to(cardRef.current!, { opacity: 1, x: 0, scale: 1, duration: 0.5, ease: "power3.out" })
        .to(titleRef.current!, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, "-=0.2")
        .to(textRef.current!, { opacity: 1, y: 0, duration: 0.4, ease: "power2.out" }, "-=0.15")
        .to(charRef.current!, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, "-=0.1")
        .to(navRef.current!, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }, "-=0.1");
    };

    // Check if cinematic is in progress
    const onCinematicComplete = () => {
      setTimeout(animateCard, 200); // small delay after camera settles
    };

    window.addEventListener("cinematic-complete", onCinematicComplete);
    // If no cinematic event fires in 500ms, animate anyway (first load)
    const fallback = setTimeout(animateCard, 500);

    return () => {
      window.removeEventListener("cinematic-complete", onCinematicComplete);
      clearTimeout(fallback);
    };
  }, [page, started]);

  // GSAP progress bar
  useEffect(() => {
    if (!progRef.current) return;
    gsap.to(progRef.current, {
      width: `${((page + 1) / storyChapters.length) * 100}%`,
      duration: 0.6,
      ease: "power2.inOut",
    });
  }, [page]);

  // Crystal collect flash
  useEffect(() => {
    if (crystals === 0) return;
    setCollectFlash(true);
    const t = setTimeout(() => setCollectFlash(false), 600);
    return () => clearTimeout(t);
  }, [crystals]);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.crystals !== undefined) setCrystals(ce.detail.crystals);
    };
    window.addEventListener("crystal-collect", handler);
    return () => window.removeEventListener("crystal-collect", handler);
  }, []);

  const [propToast, setPropToast] = useState<string | null>(null);
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      setPropToast(ce.detail.label);
      setTimeout(() => setPropToast(null), 2500);
    };
    window.addEventListener("prop-interact", handler);
    return () => window.removeEventListener("prop-interact", handler);
  }, []);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!started) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setStarted(true); }
        return;
      }
      if (e.target instanceof HTMLInputElement) return;
      switch (e.key) {
        case "ArrowRight": case "n": e.preventDefault(); next(); break;
        case "ArrowLeft": case "p": e.preventDefault(); prev(); break;
        case "Escape": e.preventDefault(); setVisible((v) => !v); break;
        case "1": case "2": case "3": case "4": case "5": case "6": case "7": case "8":
          e.preventDefault(); setPage(parseInt(e.key) - 1); break;
        case "h": e.preventDefault(); setShowHelp((v) => !v); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [started, next, prev]);

  useEffect(() => {
    if (started && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("chapter-change", { detail: { chapter: page } }));
    }
  }, [page, started]);

  // ─── Title screen ──────────────────────────────────────────────────

  if (!started) {
    return (
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, fontFamily: "Georgia, serif" }}>
        <TitleScreen onStart={() => setStarted(true)} />
      </div>
    );
  }

  // ─── Help overlay ──────────────────────────────────────────────────

  if (showHelp) {
    return (
      <div style={{ position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60, fontFamily: "Georgia, serif", background: "rgba(0,0,0,0.3)" }} onClick={() => setShowHelp(false)}>
        <HelpOverlay onClose={() => setShowHelp(false)} />
      </div>
    );
  }

  // ─── Collapsed ─────────────────────────────────────────────────────

  if (!visible) {
    return (
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 10, fontFamily: "Georgia, serif" }}>
        <div style={{ position: "absolute", top: 20, left: 20, background: "#fff", border: "3px solid #1a1a2e", borderRadius: 14, padding: "10px 18px", boxShadow: "3px 3px 0 #1a1a2e", pointerEvents: "auto" }}>
          <div style={{ fontSize: 20, fontWeight: "bold", color: "#1a1a2e", letterSpacing: -1 }}>DRIFT</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>Ch. {storyChapters[page].number}</div>
        </div>
        <CrystalBadge crystals={crystals} collectFlash={collectFlash} />
        {propToast && (
          <div style={{ background: "#fff", border: "3px solid #1a1a2e", borderRadius: 12, padding: "6px 14px", boxShadow: "3px 3px 0 #1a1a2e", fontSize: 13, color: "#1a1a2e", fontWeight: "bold", animation: "fadeSlideIn 0.3s ease" }}>
            {propToast}
          </div>
        )}
        <button onClick={() => setVisible(true)} style={{ position: "absolute", bottom: 24, right: 24, background: "#fff", border: "3px solid #1a1a2e", borderRadius: 12, padding: "10px 18px", fontFamily: "Georgia, serif", fontSize: 12, cursor: "pointer", pointerEvents: "auto", boxShadow: "3px 3px 0 #1a1a2e" }}>
          Show Story [Esc]
        </button>
        <div style={{ position: "absolute", bottom: 24, left: 20, fontSize: 10, color: "#d1d5db" }}>Press H for controls</div>
      </div>
    );
  }

  // ─── Full UI ───────────────────────────────────────────────────────

  const current = storyChapters[page];

  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", fontFamily: "Georgia, serif", zIndex: 10 }}>
      {/* Title */}
      <div style={{ position: "absolute", top: 20, left: 20, background: "#fff", border: "3px solid #1a1a2e", borderRadius: 14, padding: "10px 18px", boxShadow: "3px 3px 0 #1a1a2e" }}>
        <div style={{ fontSize: 20, fontWeight: "bold", color: "#1a1a2e", letterSpacing: -1 }}>DRIFT</div>
      </div>

      {/* Chapter + crystals */}
      <div style={{ position: "absolute", top: 20, right: 20, display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ background: "#fff", border: "3px solid #1a1a2e", borderRadius: 12, padding: "8px 14px", boxShadow: "3px 3px 0 #1a1a2e", fontSize: 12, color: "#6b7280" }}>
          Chapter {current.number} of {storyChapters.length}
        </div>
        <CrystalBadge crystals={crystals} collectFlash={collectFlash} />
      </div>

      {propToast && (
        <div style={{ position: "absolute", top: 60, right: 20, background: "#fff", border: "3px solid #1a1a2e", borderRadius: 12, padding: "8px 16px", boxShadow: "3px 3px 0 #1a1a2e", fontSize: 13, color: "#1a1a2e", fontWeight: "bold", animation: "fadeSlideIn 0.3s ease", zIndex: 20 }}>
          {propToast}
        </div>
      )}

      {/* Buttons */}
      <div style={{ position: "absolute", top: 20, right: 240, display: "flex", gap: 6 }}>
        <button onClick={() => setShowHelp(true)} style={{ background: "#fff", border: "3px solid #1a1a2e", borderRadius: 12, width: 32, height: 32, fontSize: 14, cursor: "pointer", pointerEvents: "auto", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "2px 2px 0 #1a1a2e", color: "#1a1a2e" }}>?</button>
        <button onClick={() => setVisible(false)} style={{ background: "#fff", border: "3px solid #1a1a2e", borderRadius: 12, width: 32, height: 32, fontSize: 14, cursor: "pointer", pointerEvents: "auto", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "2px 2px 0 #1a1a2e", color: "#1a1a2e" }}>x</button>
      </div>

      {/* Progress bar */}
      <div style={{ position: "absolute", top: 68, left: 20, right: 20, height: 3, background: "#e5e7eb", borderRadius: 2, overflow: "hidden" }}>
        <div ref={progRef} style={{ width: `${((page + 1) / storyChapters.length) * 100}%`, height: "100%", background: "#1a1a2e" }} />
      </div>

      {/* Story card — bottom left */}
      <div key={page} ref={cardRef} style={{
        position: "absolute", bottom: 28, left: 20,
        background: current.color, border: "3px solid #1a1a2e", borderRadius: 16,
        padding: "24px 32px", boxShadow: "4px 4px 0 #1a1a2e",
        maxWidth: 400, width: "min(400px, calc(100vw - 40px))",
        pointerEvents: "auto",
      }}>
        <div ref={titleRef} style={{ fontSize: 19, fontWeight: "bold", color: "#1a1a2e", marginBottom: 10 }}>
          {current.title}
        </div>
        <div ref={textRef} style={{ fontSize: 14, color: "#374151", lineHeight: 1.8 }}>
          {current.text}
        </div>
        <div ref={charRef} style={{ fontSize: 11, color: "#9ca3af", marginTop: 14, fontStyle: "italic" }}>
          {current.characterLabel}
        </div>
        <div ref={navRef} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16 }}>
          <button onClick={prev} disabled={page === 0} style={{
            background: page === 0 ? "#f3f4f6" : "#fff", border: "2px solid #1a1a2e", borderRadius: 8,
            padding: "6px 14px", fontSize: 12, fontFamily: "Georgia, serif",
            cursor: page === 0 ? "default" : "pointer", color: page === 0 ? "#d1d5db" : "#1a1a2e",
          }}>Back [P]</button>
          <div style={{ display: "flex", gap: 5 }}>
            {storyChapters.map((_, i) => (
              <div key={i} onClick={() => setPage(i)} style={{
                width: i === page ? 18 : 7, height: 7, borderRadius: 4,
                background: i === page ? "#1a1a2e" : i < page ? "#9ca3af" : "#e5e7eb",
                border: "1.5px solid #1a1a2e", cursor: "pointer", transition: "all 0.3s",
              }} />
            ))}
          </div>
          <button onClick={next} disabled={page === storyChapters.length - 1} style={{
            background: page === storyChapters.length - 1 ? "#f3f4f6" : "#1a1a2e",
            color: page === storyChapters.length - 1 ? "#d1d5db" : "#fff",
            border: `2px solid ${page === storyChapters.length - 1 ? "#e5e7eb" : "#1a1a2e"}`,
            borderRadius: 8, padding: "6px 14px", fontSize: 12, fontFamily: "Georgia, serif",
            cursor: page === storyChapters.length - 1 ? "default" : "pointer",
          }}>Next [N]</button>
        </div>
      </div>

      {/* Controls hint */}
      <div style={{ position: "absolute", bottom: 8, right: 20, fontSize: 10, color: "#d1d5db", textAlign: "right" }}>
        Click to capture · WASD fly · Space/Shift up/down · Ctrl sprint · Q/E rotate · N/P chapters · Click interact · H help
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function CrystalBadge({ crystals, collectFlash }: { crystals: number; collectFlash: boolean }) {
  return (
    <div style={{
      background: collectFlash ? "#faf5ff" : "#fff",
      border: "3px solid #1a1a2e", borderRadius: 12,
      padding: "8px 12px", boxShadow: collectFlash ? "0 0 12px #a78bfa, 3px 3px 0 #1a1a2e" : "3px 3px 0 #1a1a2e",
      transition: "all 0.3s ease",
    }}>
      <span style={{ color: "#a78bfa", fontSize: 14 }}>&#9670;</span>
      <span style={{ fontSize: 12, color: "#1a1a2e", marginLeft: 4, fontWeight: "bold" }}>{crystals}/5</span>
    </div>
  );
}

function TitleScreen({ onStart }: { onStart: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const tl = gsap.timeline();
    gsap.set([titleRef.current, subRef.current, textRef.current, btnRef.current], { opacity: 0, y: 20 });
    tl.to(titleRef.current, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out", delay: 0.2 })
      .to(subRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.4")
      .to(textRef.current, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, "-=0.2")
      .to(btnRef.current, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }, "-=0.2");
    return () => { tl.kill(); };
  }, []);

  return (
    <div ref={ref} style={{
      background: "#fff", border: "3px solid #1a1a2e", borderRadius: 20,
      padding: "48px 56px", boxShadow: "6px 6px 0 #1a1a2e", textAlign: "center",
      maxWidth: 460, width: "90%",
    }}>
      <div ref={titleRef} style={{ fontSize: 52, fontWeight: "bold", color: "#1a1a2e", letterSpacing: -2, marginBottom: 4 }}>
        DRIFT
      </div>
      <div ref={subRef} style={{ fontSize: 15, color: "#9ca3af", marginBottom: 24, fontStyle: "italic" }}>
        A Paper World
      </div>
      <div style={{ width: 60, height: 2, background: "#1a1a2e", margin: "0 auto 24px" }} />
      <div ref={textRef} style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, marginBottom: 28 }}>
        There was a paper crane named Milo who could not fly. One wing was bigger than the other.
        But he never stopped jumping.
      </div>
      <button ref={btnRef} onClick={onStart} style={{
        background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 12,
        padding: "14px 36px", fontSize: 16, fontFamily: "Georgia, serif", cursor: "pointer",
        boxShadow: "3px 3px 0 #6b7280",
      }}>
        Begin the Story
      </button>
      <div style={{ fontSize: 11, color: "#d1d5db", marginTop: 20 }}>or press Enter</div>
    </div>
  );
}

function HelpOverlay({ onClose }: { onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    gsap.fromTo(ref.current, { opacity: 0, scale: 0.9 }, { opacity: 1, scale: 1, duration: 0.3, ease: "power2.out" });
  }, []);

  const controls = [
    ["Click canvas", "Capture mouse"],
    ["WASD / Arrows", "Fly around"],
    ["Space / Shift", "Fly up / down"],
    ["Ctrl", "Sprint (2x speed)"],
    ["Q / E", "Rotate view"],
    ["Mouse", "Look around"],
    ["Click (locked)", "Interact with objects"],
    ["N / P", "Next / Previous chapter"],
    ["1-8", "Jump to chapter"],
    ["Esc", "Toggle story UI"],
    ["H", "Toggle this help"],
  ];

  return (
    <div ref={ref} style={{
      background: "#fff", border: "3px solid #1a1a2e", borderRadius: 16,
      padding: "32px 40px", boxShadow: "4px 4px 0 #1a1a2e", maxWidth: 420, width: "90%",
    }} onClick={(e) => e.stopPropagation()}>
      <div style={{ fontSize: 20, fontWeight: "bold", color: "#1a1a2e", marginBottom: 20 }}>Controls</div>
      {controls.map(([key, desc]) => (
        <div key={key} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ background: "#f3f4f6", border: "1.5px solid #1a1a2e", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: "bold" }}>{key}</span>
          <span style={{ fontSize: 13, color: "#6b7280" }}>{desc}</span>
        </div>
      ))}
      <div style={{ fontSize: 11, color: "#d1d5db", marginTop: 16, textAlign: "center" }}>Press H or Esc to close</div>
    </div>
  );
}
