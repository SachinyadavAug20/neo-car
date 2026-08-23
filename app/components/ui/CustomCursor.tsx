"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/app/lib/store";
import { useNarrative } from "@/app/lib/narrativeStore";
import { CHAPTERS } from "@/app/lib/narrative";

export default function CustomCursor() {
  const { started } = useNarrative();
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [trails, setTrails] = useState<{ x: number; y: number; id: number }[]>([]);
  const trailId = useRef(0);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      trailId.current++;
      setTrails((prev) => [
        ...prev.slice(-8),
        { x: e.clientX, y: e.clientY, id: trailId.current },
      ]);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, []);

  useEffect(() => {
    if (trails.length === 0) return;
    const timer = setTimeout(() => {
      setTrails((prev) => prev.slice(1));
    }, 100);
    return () => clearTimeout(timer);
  }, [trails]);

  const chapter = CHAPTERS[0];
  const color = started ? (chapter?.color || "#67e8f9") : "#67e8f9";

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      {/* Trail dots */}
      {trails.map((trail, i) => (
        <div
          key={trail.id}
          className="absolute rounded-full"
          style={{
            left: trail.x - 3,
            top: trail.y - 3,
            width: 6,
            height: 6,
            backgroundColor: color,
            opacity: (i / trails.length) * 0.3,
            transform: `scale(${0.5 + (i / trails.length) * 0.5})`,
            transition: "opacity 0.3s, transform 0.3s",
          }}
        />
      ))}

      {/* Main cursor */}
      <div
        className="absolute rounded-full mix-blend-screen"
        style={{
          left: pos.x - 8,
          top: pos.y - 8,
          width: 16,
          height: 16,
          border: `1px solid ${color}40`,
          boxShadow: `0 0 10px ${color}20`,
          transition: "left 0.05s, top 0.05s",
        }}
      />

      {/* Outer ring */}
      <div
        className="absolute rounded-full"
        style={{
          left: pos.x - 20,
          top: pos.y - 20,
          width: 40,
          height: 40,
          border: `1px solid ${color}15`,
          transition: "left 0.15s ease-out, top 0.15s ease-out",
        }}
      />
    </div>
  );
}
