"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { subscribeCarStatus, type CarStatus } from "../lib/carStateStore";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";
import { useAppStore } from "../lib/appStore";

const TERMINAL_FONT =
  "var(--font-geist-mono), 'Fira Code', 'JetBrains Mono', monospace";

export default function DrivePage() {
  const [car, setCar] = useState<CarStatus>({
    kmh: 0,
    gear: "D",
    onRoad: true,
    throttle: false,
    oobTimer: 0,
  });
  const overlayRef = useRef<HTMLDivElement>(null);
  const setRoute = useAppStore((s) => s.setRoute);
  const { getTrackName } = useAudioAnalyzer();

  useEffect(() => {
    setRoute("/drive");
  }, [setRoute]);

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
      { opacity: 1, duration: 1.2, ease: "power2.out" },
    );
  }, []);

  const oobProgress = car.oobTimer / 3;
  const showWarning = car.oobTimer > 0.1;

  return (
    <div ref={overlayRef} className="pointer-events-none fixed inset-0 z-20">
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

      <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
        <p
          className="text-[8px] tracking-[0.2em] text-[#585b70]/60"
          style={{ fontFamily: TERMINAL_FONT }}
        >
          {getTrackName()}
        </p>
      </div>

      <div className="absolute top-4 right-4 pointer-events-auto">
        <Link
          href="/"
          onClick={() => setRoute("/")}
          className="rounded border border-white/10 px-3 py-1.5 text-[9px] tracking-[0.15em] text-[#585b70] transition-all hover:border-white/20 hover:text-white"
          style={{ fontFamily: TERMINAL_FONT }}
        >
          EXIT
        </Link>
      </div>
    </div>
  );
}
