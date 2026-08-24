"use client";

import { useState, useEffect } from "react";

const storyPages = [
  {
    title: "Once upon a time...",
    text: "There was a little paper world where mountains floated and trees danced.",
    color: "#fef3c7",
  },
  {
    title: "A tiny boat",
    text: "Sailed across a paper sea, looking for the edge of the world.",
    color: "#e0f2fe",
  },
  {
    title: "The paper birds",
    text: "Whispered secrets of faraway lands made of cardboard and dreams.",
    color: "#fce7f3",
  },
  {
    title: "And so...",
    text: "The story never ended. It just folded into a new page.",
    color: "#f0fdf4",
  },
];

export default function PaperUI() {
  const [page, setPage] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setPage((p) => (p + 1) % storyPages.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  if (!visible) {
    return (
      <button
        onClick={() => setVisible(true)}
        style={{
          position: "fixed",
          bottom: 20,
          right: 20,
          background: "#fff",
          border: "3px solid #1a1a2e",
          borderRadius: 12,
          padding: "8px 16px",
          fontFamily: "Georgia, serif",
          fontSize: 14,
          cursor: "pointer",
          zIndex: 100,
        }}
      >
        Show Story
      </button>
    );
  }

  const current = storyPages[page];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        fontFamily: "Georgia, serif",
        zIndex: 10,
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 30,
          left: 30,
          background: "#fff",
          border: "3px solid #1a1a2e",
          borderRadius: 16,
          padding: "16px 24px",
          boxShadow: "4px 4px 0 #1a1a2e",
        }}
      >
        <div
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: "#1a1a2e",
            letterSpacing: -1,
          }}
        >
          DRIFT
        </div>
        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 4 }}>
          A Paper World
        </div>
      </div>

      {/* Story card */}
      <div
        key={page}
        style={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          background: current.color,
          border: "3px solid #1a1a2e",
          borderRadius: 16,
          padding: "24px 32px",
          boxShadow: "4px 4px 0 #1a1a2e",
          maxWidth: 400,
          width: "90%",
          animation: "fadeSlide 0.5s ease",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            fontSize: 18,
            fontWeight: "bold",
            color: "#1a1a2e",
            marginBottom: 8,
          }}
        >
          {current.title}
        </div>
        <div style={{ fontSize: 15, color: "#374151", lineHeight: 1.6 }}>
          {current.text}
        </div>

        {/* Page dots */}
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 16,
            justifyContent: "center",
          }}
        >
          {storyPages.map((_, i) => (
            <div
              key={i}
              onClick={() => setPage(i)}
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: i === page ? "#1a1a2e" : "#d1d5db",
                border: "2px solid #1a1a2e",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={() => setVisible(false)}
        style={{
          position: "absolute",
          top: 30,
          right: 30,
          background: "#fff",
          border: "3px solid #1a1a2e",
          borderRadius: 12,
          width: 36,
          height: 36,
          fontSize: 18,
          cursor: "pointer",
          pointerEvents: "auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "2px 2px 0 #1a1a2e",
        }}
      >
        x
      </button>

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `}</style>
    </div>
  );
}
