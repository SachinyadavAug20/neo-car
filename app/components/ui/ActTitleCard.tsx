"use client";

import { useEffect, useRef, useState } from "react";
import { STORY_ACTS } from "@/app/lib/narrative";
import gsap from "gsap";

interface ActTitleCardProps {
  actIndex: number;
}

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII"];

export function ActTitleCard({ actIndex }: ActTitleCardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const watermarkRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  const [visible, setVisible] = useState(false);
  const act = STORY_ACTS[actIndex];

  useEffect(() => {
    if (!act) return;
    setVisible(true);

    const tl = gsap.timeline({
      onComplete: () => {
        gsap.to(containerRef.current, {
          opacity: 0,
          y: -20,
          duration: 0.8,
          delay: 2.5,
          ease: "power2.inOut",
          onComplete: () => setVisible(false),
        });
      },
    });

    if (containerRef.current && titleRef.current && subtitleRef.current && lineRef.current) {
      gsap.set(containerRef.current, { opacity: 1, y: 0 });

      tl.fromTo(
        watermarkRef.current,
        { scale: 0.5, opacity: 0 },
        { scale: 1, opacity: 0.08, duration: 1, ease: "power2.out" }
      )
        .fromTo(
          lineRef.current,
          { scaleX: 0 },
          { scaleX: 1, duration: 0.8, ease: "power3.inOut" },
          "-=0.6"
        )
        .fromTo(
          titleRef.current,
          { y: 30, opacity: 0, filter: "blur(8px)" },
          { y: 0, opacity: 1, filter: "blur(0px)", duration: 0.9, ease: "power3.out" },
          "-=0.5"
        )
        .fromTo(
          subtitleRef.current,
          { y: 15, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7, ease: "power2.out" },
          "-=0.4"
        );
    }
  }, [actIndex, act]);

  if (!visible || !act) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        top: "20%",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 45,
        pointerEvents: "none",
        textAlign: "center",
        width: "90%",
        maxWidth: 700,
      }}
    >
      {/* Huge Roman Numeral Watermark */}
      <div
        ref={watermarkRef}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "14rem",
          fontWeight: 900,
          fontFamily: "Georgia, serif",
          color: "#09090b",
          lineHeight: 1,
          userSelect: "none",
          zIndex: -1,
        }}
      >
        {ROMAN_NUMERALS[actIndex] || ""}
      </div>

      {/* Act Number Subtitle */}
      <p
        ref={subtitleRef}
        style={{
          fontSize: 12,
          fontFamily: "monospace",
          letterSpacing: 4,
          textTransform: "uppercase",
          color: "#09090b",
          marginBottom: 8,
          fontWeight: 800,
        }}
      >
        ACT {ROMAN_NUMERALS[actIndex]} &middot; CHAPTER {actIndex + 1}
      </p>

      {/* Title */}
      <h1
        ref={titleRef}
        style={{
          fontSize: "clamp(30px, 5vw, 52px)",
          fontWeight: 800,
          fontFamily: "Georgia, serif",
          color: "#09090b",
          margin: 0,
          letterSpacing: -1.5,
          lineHeight: 1.15,
          textShadow: "0 1px 12px rgba(255,255,255,0.9)",
        }}
      >
        {act.title}
      </h1>

      {/* Decorative Crease Line */}
      <div
        ref={lineRef}
        style={{
          width: 80,
          height: 3,
          background: "#09090b",
          margin: "16px auto 0",
          borderRadius: 2,
        }}
      />
    </div>
  );
}
