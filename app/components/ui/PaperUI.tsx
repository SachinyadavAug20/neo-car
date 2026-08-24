"use client";

import { useState, useEffect, useCallback } from "react";

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

  const next = useCallback(() => {
    setPage((p) => Math.min(p + 1, storyChapters.length - 1));
  }, []);

  const prev = useCallback(() => {
    setPage((p) => Math.max(p - 1, 0));
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!started) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setStarted(true);
        }
        return;
      }

      // Don't capture if typing in input
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case "ArrowRight":
        case "n":
          e.preventDefault();
          next();
          break;
        case "ArrowLeft":
        case "p":
          e.preventDefault();
          prev();
          break;
        case "Escape":
          e.preventDefault();
          setVisible((v) => !v);
          break;
        case "1": case "2": case "3": case "4":
        case "5": case "6": case "7": case "8":
          e.preventDefault();
          setPage(parseInt(e.key) - 1);
          break;
        case "h":
          e.preventDefault();
          setShowHelp((v) => !v);
          break;
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

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce.detail?.crystals !== undefined) setCrystals(ce.detail.crystals);
    };
    window.addEventListener("crystal-collect", handler);
    return () => window.removeEventListener("crystal-collect", handler);
  }, []);

  // ─── Title screen ────────────────────────────────────────────────────

  if (!started) {
    return (
      <div style={{
        position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 50, fontFamily: "Georgia, serif",
      }}>
        <div style={{
          background: "#fff", border: "3px solid #1a1a2e", borderRadius: 20,
          padding: "48px 56px", boxShadow: "6px 6px 0 #1a1a2e", textAlign: "center",
          maxWidth: 460, width: "90%",
        }}>
          <div style={{ fontSize: 52, fontWeight: "bold", color: "#1a1a2e", letterSpacing: -2, marginBottom: 4 }}>
            DRIFT
          </div>
          <div style={{ fontSize: 15, color: "#9ca3af", marginBottom: 24, fontStyle: "italic" }}>
            A Paper World
          </div>
          <div style={{ width: 60, height: 2, background: "#1a1a2e", margin: "0 auto 24px" }} />
          <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.8, marginBottom: 28 }}>
            There was a paper crane named Milo who could not fly. One wing was bigger than the other.
            But he never stopped jumping.
          </div>
          <button onClick={() => setStarted(true)} style={{
            background: "#1a1a2e", color: "#fff", border: "none", borderRadius: 12,
            padding: "14px 36px", fontSize: 16, fontFamily: "Georgia, serif", cursor: "pointer",
            boxShadow: "3px 3px 0 #6b7280",
          }}>
            Begin the Story
          </button>
          <div style={{ fontSize: 11, color: "#d1d5db", marginTop: 20 }}>
            or press Enter
          </div>
        </div>
      </div>
    );
  }

  // ─── Help overlay ────────────────────────────────────────────────────

  if (showHelp) {
    return (
      <div style={{
        position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 60, fontFamily: "Georgia, serif", background: "rgba(0,0,0,0.3)",
      }} onClick={() => setShowHelp(false)}>
        <div style={{
          background: "#fff", border: "3px solid #1a1a2e", borderRadius: 16,
          padding: "32px 40px", boxShadow: "4px 4px 0 #1a1a2e", maxWidth: 420, width: "90%",
        }} onClick={(e) => e.stopPropagation()}>
          <div style={{ fontSize: 20, fontWeight: "bold", color: "#1a1a2e", marginBottom: 20 }}>Controls</div>
          {[
            ["Click canvas", "Capture mouse"],
            ["WASD / Arrows", "Fly around"],
            ["Space / Shift", "Fly up / down"],
            ["Mouse", "Look around"],
            ["N / P", "Next / Previous chapter"],
            ["1-8", "Jump to chapter"],
            ["Esc", "Toggle story UI"],
            ["H", "Toggle this help"],
          ].map(([key, desc]) => (
            <div key={key} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ background: "#f3f4f6", border: "1.5px solid #1a1a2e", borderRadius: 6, padding: "2px 8px", fontSize: 12, fontWeight: "bold" }}>{key}</span>
              <span style={{ fontSize: 13, color: "#6b7280" }}>{desc}</span>
            </div>
          ))}
          <div style={{ fontSize: 11, color: "#d1d5db", marginTop: 16, textAlign: "center" }}>Press H or Esc to close</div>
        </div>
      </div>
    );
  }

  // ─── Collapsed state ─────────────────────────────────────────────────

  if (!visible) {
    return (
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 10, fontFamily: "Georgia, serif" }}>
        {/* Collapsed title */}
        <div style={{
          position: "absolute", top: 20, left: 20, background: "#fff", border: "3px solid #1a1a2e",
          borderRadius: 14, padding: "10px 18px", boxShadow: "3px 3px 0 #1a1a2e", pointerEvents: "auto",
        }}>
          <div style={{ fontSize: 20, fontWeight: "bold", color: "#1a1a2e", letterSpacing: -1 }}>DRIFT</div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>Ch. {storyChapters[page].number}</div>
        </div>

        {/* Crystal counter */}
        <div style={{
          position: "absolute", top: 20, right: 20, background: "#fff", border: "3px solid #1a1a2e",
          borderRadius: 12, padding: "8px 14px", boxShadow: "3px 3px 0 #1a1a2e",
        }}>
          <span style={{ fontSize: 14, color: "#a78bfa" }}>&#9670;</span>
          <span style={{ fontSize: 12, color: "#1a1a2e", marginLeft: 4 }}>{crystals}/5</span>
        </div>

        {/* Show button */}
        <button onClick={() => setVisible(true)} style={{
          position: "absolute", bottom: 24, right: 24, background: "#fff",
          border: "3px solid #1a1a2e", borderRadius: 12, padding: "10px 18px",
          fontFamily: "Georgia, serif", fontSize: 12, cursor: "pointer",
          pointerEvents: "auto", boxShadow: "3px 3px 0 #1a1a2e",
        }}>
          Show Story [Esc]
        </button>

        {/* Help hint */}
        <div style={{
          position: "absolute", bottom: 24, left: 20, fontSize: 10, color: "#d1d5db",
        }}>
          Press H for controls
        </div>
      </div>
    );
  }

  // ─── Full story UI ───────────────────────────────────────────────────

  const current = storyChapters[page];
  const progress = ((page + 1) / storyChapters.length) * 100;

  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none",
      fontFamily: "Georgia, serif", zIndex: 10,
    }}>
      {/* Title */}
      <div style={{
        position: "absolute", top: 20, left: 20, background: "#fff",
        border: "3px solid #1a1a2e", borderRadius: 14, padding: "10px 18px",
        boxShadow: "3px 3px 0 #1a1a2e",
      }}>
        <div style={{ fontSize: 20, fontWeight: "bold", color: "#1a1a2e", letterSpacing: -1 }}>DRIFT</div>
      </div>

      {/* Chapter number + crystal counter */}
      <div style={{
        position: "absolute", top: 20, right: 20, display: "flex", gap: 8, alignItems: "center",
      }}>
        <div style={{
          background: "#fff", border: "3px solid #1a1a2e", borderRadius: 12,
          padding: "8px 14px", boxShadow: "3px 3px 0 #1a1a2e", fontSize: 12, color: "#6b7280",
        }}>
          Chapter {current.number} of {storyChapters.length}
        </div>
        <div style={{
          background: "#fff", border: "3px solid #1a1a2e", borderRadius: 12,
          padding: "8px 12px", boxShadow: "3px 3px 0 #1a1a2e",
        }}>
          <span style={{ color: "#a78bfa", fontSize: 14 }}>&#9670;</span>
          <span style={{ fontSize: 12, color: "#1a1a2e", marginLeft: 4 }}>{crystals}/5</span>
        </div>
      </div>

      {/* Close + Help buttons */}
      <div style={{ position: "absolute", top: 20, right: 240, display: "flex", gap: 6 }}>
        <button onClick={() => setShowHelp(true)} style={{
          background: "#fff", border: "3px solid #1a1a2e", borderRadius: 12,
          width: 32, height: 32, fontSize: 14, cursor: "pointer", pointerEvents: "auto",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "2px 2px 0 #1a1a2e", color: "#1a1a2e",
        }}>?</button>
        <button onClick={() => setVisible(false)} style={{
          background: "#fff", border: "3px solid #1a1a2e", borderRadius: 12,
          width: 32, height: 32, fontSize: 14, cursor: "pointer", pointerEvents: "auto",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "2px 2px 0 #1a1a2e", color: "#1a1a2e",
        }}>x</button>
      </div>

      {/* Progress bar */}
      <div style={{
        position: "absolute", top: 68, left: 20, right: 20, height: 3,
        background: "#e5e7eb", borderRadius: 2, overflow: "hidden",
      }}>
        <div style={{ width: `${progress}%`, height: "100%", background: "#1a1a2e", transition: "width 0.5s ease" }} />
      </div>

      {/* Story card */}
      <div key={page} style={{
        position: "absolute", bottom: 28, left: 20,
        background: current.color, border: "3px solid #1a1a2e", borderRadius: 16,
        padding: "24px 32px", boxShadow: "4px 4px 0 #1a1a2e", maxWidth: 400, width: "min(400px, calc(100vw - 40px))",
        animation: "cardIn 0.4s ease", pointerEvents: "auto",
      }}>
        <div style={{ fontSize: 19, fontWeight: "bold", color: "#1a1a2e", marginBottom: 10 }}>
          {current.title}
        </div>
        <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.8 }}>
          {current.text}
        </div>
        <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 14, fontStyle: "italic" }}>
          {current.characterLabel}
        </div>

        {/* Navigation */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16,
        }}>
          <button onClick={prev} disabled={page === 0} style={{
            background: page === 0 ? "#f3f4f6" : "#fff", border: "2px solid #1a1a2e", borderRadius: 8,
            padding: "6px 14px", fontSize: 12, fontFamily: "Georgia, serif",
            cursor: page === 0 ? "default" : "pointer", color: page === 0 ? "#d1d5db" : "#1a1a2e",
          }}>
            Back [P]
          </button>
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
          }}>
            Next [N]
          </button>
        </div>
      </div>

      {/* Controls hint */}
      <div style={{
        position: "absolute", bottom: 8, right: 20,
        fontSize: 10, color: "#d1d5db", textAlign: "right",
      }}>
        Click to capture mouse · WASD fly · Space/Shift up/down · N/P chapters · H help
      </div>

      <style>{`
        @keyframes cardIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
