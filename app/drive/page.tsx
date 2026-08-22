"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { subscribeCarStatus, type CarStatus } from "../lib/carStateStore";

const TERMINAL_FONT =
  "var(--font-geist-mono), 'Fira Code', 'JetBrains Mono', monospace";

function Key({ children }: { children: string }) {
  return (
    <span className="inline-block min-w-[1.5em] rounded border border-[#8aadf4]/40 bg-[#0b0f19] px-1 text-center text-[10px] text-[#cad3f5]">
      {children}
    </span>
  );
}

export default function DrivePage() {
  const [car, setCar] = useState<CarStatus>({
    kmh: 0,
    gear: "D",
    onRoad: true,
    throttle: false,
    oobTimer: 0,
  });
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = subscribeCarStatus(setCar);
    return unsub;
  }, []);

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;
    gsap.fromTo(
      el,
      { opacity: 0 },
      { opacity: 1, duration: 0.8, ease: "power2.out" },
    );
  }, []);

  const oobProgress = car.oobTimer / 3;
  const showWarning = car.oobTimer > 0.1;

  return (
    <div ref={overlayRef} className="pointer-events-none fixed inset-0 z-20">
      {/* OOB Warning */}
      {showWarning && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <div
            className="rounded-lg border border-[#f38ba8]/50 bg-[#f38ba8]/10 px-8 py-4 backdrop-blur-md"
            style={{ fontFamily: TERMINAL_FONT }}
          >
            <p className="mb-2 text-xs font-bold tracking-[0.3em] text-[#f38ba8]">
              SIGNAL DEGRADATION
            </p>
            <p className="mb-3 text-[10px] tracking-[0.2em] text-[#f38ba8]/80">
              RETURN TO LANE — {(3 - car.oobTimer).toFixed(1)}s
            </p>
            <div className="mx-auto h-1.5 w-48 overflow-hidden rounded-full border border-[#f38ba8]/30 bg-[#f38ba8]/10">
              <div
                className="h-full rounded-full bg-[#f38ba8] transition-all duration-100"
                style={{ width: `${oobProgress * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* HUD overlay */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        <div
          className="flex items-center gap-6 rounded-xl border border-white/10 bg-[#0b0f19]/70 px-6 py-3 backdrop-blur-md"
          style={{ fontFamily: TERMINAL_FONT }}
        >
          <div className="text-center">
            <p className="text-[8px] tracking-[0.3em] text-[#6c7086]">SPEED</p>
            <p className="text-2xl font-bold tabular-nums text-[#b4befe]">
              {Math.round(car.kmh)}
            </p>
            <p className="text-[8px] tracking-[0.2em] text-[#6c7086]">KM/H</p>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-center">
            <p className="text-[8px] tracking-[0.3em] text-[#6c7086]">GEAR</p>
            <p
              className={`text-lg font-bold ${
                car.gear === "R" ? "text-[#f38ba8]" : "text-[#a6e3a1]"
              }`}
            >
              {car.gear}
            </p>
          </div>
          <div className="h-8 w-px bg-white/10" />
          <div className="text-center">
            <p className="text-[8px] tracking-[0.3em] text-[#6c7086]">STATUS</p>
            <p
              className={`text-[10px] font-bold ${
                car.onRoad ? "text-[#a6e3a1]" : "text-[#f38ba8]"
              }`}
            >
              {car.onRoad ? "ON ROAD" : "OFF ROAD"}
            </p>
          </div>
        </div>
      </div>

      {/* Controls hint */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
        <div
          className="flex items-center gap-3 text-[8px] tracking-[0.15em] text-[#6c7086]/60"
          style={{ fontFamily: TERMINAL_FONT }}
        >
          <Key>W</Key> THROTTLE
          <Key>S</Key> BRAKE
          <Key>A</Key><Key>D</Key> STEER
          <span className="mx-1 text-[#6c7086]/30">|</span>
          <Key>SPACE</Key> PLAY/PAUSE
        </div>
      </div>
    </div>
  );
}
