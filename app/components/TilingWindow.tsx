"use client";

import { useEffect, useRef, type ReactNode } from "react";
import gsap from "gsap";

const TERMINAL_FONT =
  "var(--font-geist-mono), 'Fira Code', 'JetBrains Mono', monospace";

interface TilingWindowProps {
  title: string;
  children: ReactNode;
  className?: string;
  hideControls?: boolean;
}

export default function TilingWindow({
  title,
  children,
  className = "",
  hideControls = false,
}: TilingWindowProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { opacity: 0, scale: 0.92, y: 18 },
      {
        opacity: 1,
        scale: 1,
        y: 0,
        duration: 0.5,
        ease: "power3.out",
        clearProps: "transform",
      },
    );
  }, []);

  return (
    <div
      ref={ref}
      className={`pointer-events-auto overflow-hidden rounded-lg border border-[#8aadf4]/40 bg-[#1e2030]/80 shadow-2xl backdrop-blur-md ${className}`}
      style={{ fontFamily: TERMINAL_FONT }}
    >
      {!hideControls && (
        <div className="flex items-center gap-2 border-b border-[#8aadf4]/20 bg-[#181926]/80 px-3 py-1.5">
          <div className="flex gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[#f38ba8]/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#f9e2af]/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-[#a6e3a1]/70" />
          </div>
          <span className="ml-2 flex-1 truncate text-[10px] tracking-[0.15em] text-[#6c7086]">
            {title}
          </span>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
