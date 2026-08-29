"use client";

import { useEffect, useRef } from "react";
import { Achievement } from "@/app/lib/useAchievements";
import gsap from "gsap";

interface AchievementToastProps {
  achievement: Achievement | null;
  onClose: () => void;
}

export function AchievementToast({ achievement, onClose }: AchievementToastProps) {
  const toastRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!achievement || !toastRef.current) return;

    // Pop in animation
    gsap.fromTo(
      toastRef.current,
      { y: 80, opacity: 0, scale: 0.8 },
      { y: 0, opacity: 1, scale: 1, duration: 0.4, ease: "back.out(1.7)" }
    );

    const timer = setTimeout(() => {
      if (toastRef.current) {
        gsap.to(toastRef.current, {
          y: 40,
          opacity: 0,
          scale: 0.9,
          duration: 0.3,
          ease: "power2.in",
          onComplete: onClose,
        });
      }
    }, 4000);

    return () => clearTimeout(timer);
  }, [achievement, onClose]);

  if (!achievement) return null;

  return (
    <div
      ref={toastRef}
      onClick={onClose}
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        gap: 14,
        background: "var(--bg-card)",
        border: "2px solid #fbbf24",
        borderRadius: 14,
        padding: "12px 20px",
        boxShadow: "0 10px 30px rgba(251, 191, 36, 0.25), 3px 3px 0 var(--shadow)",
        cursor: "pointer",
        maxWidth: 340,
      }}
    >
      <div
        style={{
          fontSize: 28,
          lineHeight: 1,
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
        }}
      >
        {achievement.icon}
      </div>
      <div>
        <div
          style={{
            fontSize: 10,
            fontFamily: "monospace",
            fontWeight: 700,
            color: "#d97706",
            letterSpacing: 1.2,
            textTransform: "uppercase",
            marginBottom: 2,
          }}
        >
          Achievement Unlocked!
        </div>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "Georgia, serif",
            color: "var(--text)",
            marginBottom: 2,
          }}
        >
          {achievement.title}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            lineHeight: 1.3,
          }}
        >
          {achievement.description}
        </div>
      </div>
    </div>
  );
}
