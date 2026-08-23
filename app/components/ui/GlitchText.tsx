"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

interface GlitchTextProps {
  text: string;
  className?: string;
  color?: string;
  effect?: "glitch" | "pulse" | "fade" | "shatter" | "ripple" | "typewriter";
  trigger?: boolean;
}

const GLITCH_CHARS = "!@#$%^&*()_+-=[]{}|;':\",./<>?`~";

export default function GlitchText({ text, className = "", color, effect = "fade", trigger = true }: GlitchTextProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [displayText, setDisplayText] = useState(text);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!trigger || !ref.current) return;
    const el = ref.current;

    if (effect === "typewriter") {
      setIsAnimating(true);
      const chars = text.split("");
      setDisplayText("");
      chars.forEach((char, i) => {
        setTimeout(() => {
          setDisplayText(text.slice(0, i + 1));
          if (i === chars.length - 1) setIsAnimating(false);
        }, i * 40);
      });
      return;
    }

    if (effect === "glitch") {
      setIsAnimating(true);
      let count = 0;
      const interval = setInterval(() => {
        setDisplayText(
          text
            .split("")
            .map((char, i) => {
              if (char === " ") return " ";
              if (Math.random() < 0.3) {
                return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)];
              }
              return char;
            })
            .join(""),
        );
        count++;
        if (count > 15) {
          clearInterval(interval);
          setDisplayText(text);
          setIsAnimating(false);
        }
      }, 50);
      return () => clearInterval(interval);
    }

    if (effect === "fade") {
      gsap.fromTo(el, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 1, ease: "power2.out" });
    }

    if (effect === "pulse") {
      gsap.fromTo(el, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.8, ease: "elastic.out(1, 0.5)" });
    }

    if (effect === "shatter") {
      gsap.fromTo(el, { opacity: 0, scale: 1.5, filter: "blur(10px)" }, { opacity: 1, scale: 1, filter: "blur(0px)", duration: 1.2, ease: "power3.out" });
    }

    if (effect === "ripple") {
      gsap.fromTo(el, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 1, ease: "back.out(1.7)" });
    }
  }, [trigger, text, effect]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ color: color || "inherit" }}
    >
      {displayText.split("\n").map((line, i) => (
        <span key={i}>
          {line}
          {i < displayText.split("\n").length - 1 && <br />}
        </span>
      ))}
    </div>
  );
}
