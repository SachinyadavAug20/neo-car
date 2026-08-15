"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { onFade } from "../lib/fadeStore";

export default function PortalFade() {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = onFade(() => {
      const overlay = overlayRef.current;
      if (overlay) {
        gsap.fromTo(
          overlay,
          { opacity: 0 },
          { opacity: 1, duration: 1.2, ease: "power2.in" },
        );
      }
    });
    return unsubscribe;
  }, []);

  return (
    <div
      ref={overlayRef}
      className="pointer-events-none fixed inset-0 z-50 bg-white opacity-0"
    />
  );
}