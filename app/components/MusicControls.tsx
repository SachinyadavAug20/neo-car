"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";
import { subscribeCarStatus, type CarStatus } from "../lib/carStateStore";
import { useIntensity } from "../lib/intensityContext";

const TERMINAL_FONT = "var(--font-geist-mono), 'Fira Code', 'JetBrains Mono', monospace";

function Key({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block min-w-[1.5em] rounded border border-[#8aadf4]/40 bg-[#0b0f19] px-1 text-center text-[#cad3f5]">
      {children}
    </span>
  );
}

export default function MusicControls() {
  const { play, pause, getState, subscribe, nextTrack, prevTrack, getProgress } =
    useAudioAnalyzer();
  const { mode, setMode } = useIntensity();
  const [playState, setPlayState] = useState<"playing" | "paused">("paused");
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(true);
  const [started, setStarted] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("autostart"),
  );
  const [flash, setFlash] = useState(false);
  const [car, setCar] = useState<CarStatus>({
    kmh: 0,
    gear: "D",
    onRoad: true,
    throttle: false,
  });
  const startedRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => subscribe(setPlayState), [subscribe]);

  useEffect(() => subscribeCarStatus(setCar), []);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (playState !== "playing") return;
      setProgress(getProgress() * 100);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playState, getProgress]);

  useEffect(() => {
    const onMove = () => {
      setVisible(true);
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => setVisible(false), 3000);
    };
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  const start = useCallback(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    setStarted(true);
    play();
  }, [play]);

  useEffect(() => {
    const onStart = () => start();
    window.addEventListener("click", onStart);
    window.addEventListener("keydown", onStart);
    return () => {
      window.removeEventListener("click", onStart);
      window.removeEventListener("keydown", onStart);
    };
  }, [start]);

  const flashNow = useCallback(() => {
    setFlash(true);
    clearTimeout(flashTimerRef.current);
    flashTimerRef.current = setTimeout(() => setFlash(false), 350);
  }, []);

  const togglePlay = useCallback(() => {
    if (getState() === "playing") pause();
    else play();
  }, [getState, pause, play]);

  useEffect(() => {
    if (!started) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      } else if (e.key === "]") {
        nextTrack();
        flashNow();
      } else if (e.key === "[") {
        prevTrack();
        flashNow();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [started, togglePlay, nextTrack, prevTrack, flashNow]);

  useEffect(() => {
    return () => {
      clearTimeout(hideTimerRef.current);
      clearTimeout(flashTimerRef.current);
    };
  }, []);

  if (!started) {
    return (
      <button
        type="button"
        onClick={start}
        className="absolute inset-0 z-30 flex w-full cursor-pointer flex-col items-center justify-center gap-4 bg-[#0b0f19]"
        style={{ fontFamily: TERMINAL_FONT }}
      >
        <h1 className="text-4xl font-bold tracking-[0.25em] text-[#b4befe] drop-shadow-[0_0_18px_rgba(180,190,254,0.55)]">
          NEON_DRIVE
        </h1>
        <p className="text-xs tracking-[0.3em] text-[#a5adcb]">AMBIENT VISUALIZER</p>
        <p className="mt-6 animate-pulse text-sm tracking-[0.2em] text-[#8aadf4]">
          CLICK OR PRESS SPACE TO START
        </p>
        <div className="mt-4 space-y-1 text-xs tracking-[0.15em] text-[#a5adcb]">
          <p>
            <Key>W</Key> / <Key>&uarr;</Key> THROTTLE
            <span className="mx-3 text-[#6c7086]">|</span>
            <Key>S</Key> / <Key>&darr;</Key> BRAKE / REVERSE
          </p>
          <p>
            <Key>A</Key> <Key>D</Key> / <Key>&larr;</Key> <Key>&rarr;</Key> STEER
            <span className="mx-3 text-[#6c7086]">|</span>
            <Key>SPACE</Key> PLAY / PAUSE
          </p>
          <p>
            <Key>[</Key> <Key>]</Key> SKIP TRACK
          </p>
        </div>
      </button>
    );
  }

  return (
    <div
      className="absolute inset-0 z-10 flex flex-col justify-between p-6"
      style={{ fontFamily: TERMINAL_FONT, pointerEvents: "none" }}
    >
      {flash && (
        <div className="pointer-events-none absolute inset-0 z-20 bg-[#b4befe]/20" />
      )}

      <div className="pointer-events-none flex items-start justify-between">
        <div className="pointer-events-auto self-start">
          <h1 className="text-2xl font-bold tracking-[0.15em] text-[#b4befe] drop-shadow-[0_0_12px_rgba(180,190,254,0.45)]">
            NEON_DRIVE
          </h1>
          <p className="text-[10px] tracking-[0.2em] text-[#a5adcb]">AMBIENT VISUALIZER</p>
        </div>

        <div className="pointer-events-auto text-right" title="car status">
          <div className="flex items-center justify-end gap-2">
            <span
              className={`rounded border px-1.5 py-0.5 text-xs font-bold ${
                car.gear === "R"
                  ? "border-[#f38ba8]/50 text-[#f38ba8]"
                  : "border-[#8aadf4]/50 text-[#8aadf4]"
              }`}
            >
              {car.gear}
            </span>
            <span
              className={`text-3xl font-bold tabular-nums tracking-[0.1em] drop-shadow-[0_0_12px_rgba(138,173,244,0.45)] ${
                car.kmh > 70
                  ? "text-[#f38ba8]"
                  : car.kmh > 40
                    ? "text-[#f9e2af]"
                    : "text-[#b4befe]"
              }`}
            >
              {Math.round(car.kmh)}
            </span>
            <span className="text-[10px] tracking-[0.25em] text-[#6c7086]">KM/H</span>
          </div>
          <div className="ml-auto mt-1 h-1.5 w-44 overflow-hidden rounded border border-[#8aadf4]/30 bg-[#1e2030]">
            <div
              className={`h-full transition-all duration-100 ${
                car.kmh > 70 ? "bg-[#f38ba8]" : "bg-[#b4befe]"
              }`}
              style={{ width: `${Math.min(100, (car.kmh / 250) * 100)}%` }}
            />
          </div>
          <p
            className={`mt-1 text-[10px] tracking-[0.25em] ${
              car.onRoad ? "text-[#a6e3a1]" : "text-[#f38ba8]"
            }`}
          >
            {car.onRoad ? "ON ROAD" : "OFF ROAD"}
            {car.throttle ? " \u00b7 THROTTLE" : ""}
          </p>
        </div>
      </div>

      <div className="pointer-events-none flex items-end justify-between">
        <div
          className={`pointer-events-auto rounded border border-[#8aadf4]/30 bg-[#1e2030]/80 px-3 py-2 text-[10px] leading-relaxed tracking-[0.15em] text-[#a5adcb] transition-opacity duration-500 ${
            visible ? "opacity-100" : "opacity-0"
          }`}
        >
          <p className="mb-1 font-bold tracking-[0.2em] text-[#b4befe]">CONTROLS</p>
          <p>
            <Key>W</Key> / <Key>&uarr;</Key> THROTTLE
          </p>
          <p>
            <Key>S</Key> / <Key>&darr;</Key> BRAKE / REVERSE
          </p>
          <p>
            <Key>A</Key> <Key>D</Key> / <Key>&larr;</Key> <Key>&rarr;</Key> STEER
          </p>
          <p>
            <Key>SPACE</Key> PLAY / PAUSE
          </p>
          <p>
            <Key>[</Key> <Key>]</Key> SKIP TRACK
          </p>
        </div>

        <div className="pointer-events-auto flex flex-col items-center gap-3">
          <p className="text-xs tracking-[0.15em] text-[#cba6f7]">Retro Electronic</p>

          <div className="h-1 w-64 overflow-hidden rounded border border-[#8aadf4]/40 bg-[#1e2030]">
            <div
              className="h-full bg-[#b4befe] transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                prevTrack();
                flashNow();
              }}
              className="rounded border border-[#8aadf4]/30 px-3 py-1 text-[#cad3f5]/60 transition hover:border-[#8aadf4] hover:text-[#cad3f5]"
            >
              &lt;&lt;
            </button>
            <button
              onClick={togglePlay}
              className="rounded border border-[#8aadf4]/60 bg-[#1e2030] px-6 py-2 font-bold text-[#cad3f5] shadow-[0_0_14px_rgba(138,173,244,0.3)] transition hover:bg-[#8aadf4] hover:text-[#1e2030] active:scale-95"
            >
              {playState === "playing" ? "[ PAUSE ]" : "[ PLAY ]"}
            </button>
            <button
              onClick={() => {
                nextTrack();
                flashNow();
              }}
              className="rounded border border-[#8aadf4]/30 px-3 py-1 text-[#cad3f5]/60 transition hover:border-[#8aadf4] hover:text-[#cad3f5]"
            >
              &gt;&gt;
            </button>
          </div>

          <div className="mt-1 flex items-center gap-4 text-[10px] tracking-[0.2em] text-[#6c7086]">
            <button
              onClick={() => setMode(mode === "chill" ? "intense" : "chill")}
              className="rounded border border-[#8aadf4]/30 px-2 py-0.5 transition hover:border-[#8aadf4] hover:text-[#cad3f5]"
            >
              INTENSITY: {mode === "chill" ? "CHILL" : "INTENSE"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}