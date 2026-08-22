"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Pause, Play, SkipBack, SkipForward } from "lucide-react";
import { useAudioAnalyzer } from "../hooks/useAudioAnalyzer";
import { subscribeCarStatus, type CarStatus } from "../lib/carStateStore";
import { useIntensity } from "../lib/intensityContext";
import { FlameWrap } from "./canvasui/FlameWrap";

const TERMINAL_FONT = "var(--font-geist-mono), 'Fira Code', 'JetBrains Mono', monospace";

function Key({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block min-w-[1.5em] rounded border border-[#8aadf4]/40 bg-[#0b0f19] px-1 text-center text-[#cad3f5]">
      {children}
    </span>
  );
}

const LERP_SPEED = 0.08;
const BASE_HEIGHT = 40;
const BEAT_HEIGHT = 140;
const BASE_INTENSITY = 0.3;
const BEAT_INTENSITY = 1.8;
const BASE_SPREAD = 4;
const BEAT_SPREAD = 12;
const BASE_RIM = 1.5;
const BEAT_RIM = 3;
const BASE_MELT = 1.5;
const BEAT_MELT = 4;

function AudioReactiveFlames({
  children,
  playState,
  getFrequencies,
}: {
  children: ReactNode;
  playState: "playing" | "paused";
  getFrequencies: () => [number, number, number];
}) {
  const flameHeight = useRef(BASE_HEIGHT);
  const flameIntensity = useRef(BASE_INTENSITY);
  const flameSpread = useRef(BASE_SPREAD);
  const flameRim = useRef(BASE_RIM);
  const flameMelt = useRef(BASE_MELT);
  const [renderTick, setRenderTick] = useState(0);
  const tickRef = useRef(0);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const playing = playState === "playing";
      const [bass] = getFrequencies();
      const beat = playing ? bass : 0;

      const hTarget = playing ? BASE_HEIGHT + beat * BEAT_HEIGHT : BASE_HEIGHT;
      const iTarget = playing ? BASE_INTENSITY + beat * BEAT_INTENSITY : 0;
      const sTarget = playing ? BASE_SPREAD + beat * BEAT_SPREAD : BASE_SPREAD;
      const rTarget = playing ? BASE_RIM + beat * BEAT_RIM : 0;
      const mTarget = playing ? BASE_MELT + beat * BEAT_MELT : 0;

      flameHeight.current += (hTarget - flameHeight.current) * LERP_SPEED;
      flameIntensity.current += (iTarget - flameIntensity.current) * LERP_SPEED;
      flameSpread.current += (sTarget - flameSpread.current) * LERP_SPEED;
      flameRim.current += (rTarget - flameRim.current) * LERP_SPEED;
      flameMelt.current += (mTarget - flameMelt.current) * LERP_SPEED;

      tickRef.current++;
      if (tickRef.current % 3 === 0) setRenderTick((t) => t + 1);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playState, getFrequencies]);

  const smoothHeight = Math.round(flameHeight.current);
  const smoothIntensity = Math.round(flameIntensity.current * 100) / 100;
  const smoothSpread = Math.round(flameSpread.current);
  const smoothRim = Math.round(flameRim.current * 10) / 10;
  const smoothMelt = Math.round(flameMelt.current * 10) / 10;

  return (
    <FlameWrap
      intensity={smoothIntensity}
      height={smoothHeight}
      spread={smoothSpread}
      radius={12}
      speed={0.4}
      scale={0.75}
      turbulence={0.6}
      turbulenceScale={0.5}
      turbulenceReach={15}
      sparks={2.0}
      sparkSize={0.35}
      sparkDensity={1}
      sparkSpeed={1.2}
      rim={smoothRim}
      melt={smoothMelt}
      distortion={8}
      smoke={1.2}
      ember={2}
      scorch={0}
      color={[0.0, 0.89, 1.0]}
    >
      {children}
    </FlameWrap>
  );
}

export default function MusicControls() {
  const {
    play,
    pause,
    getState,
    getFrequencies,
    subscribe,
    subscribeTrack,
    getTrackName,
    nextTrack,
    prevTrack,
    getProgress,
  } = useAudioAnalyzer();
  const { mode, setMode } = useIntensity();
  const [playState, setPlayState] = useState<"playing" | "paused">("paused");
  const [trackName, setTrackName] = useState("Retro Electronic");
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
    oobTimer: 0,
  });
  const startedRef = useRef(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => subscribe(setPlayState), [subscribe]);

  useEffect(() => {
    setTrackName(getTrackName());
    return subscribeTrack(setTrackName);
  }, [subscribeTrack, getTrackName]);

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
        <FlameWrap
          intensity={0.6}
          height={120}
          spread={6}
          radius={12}
          speed={0.3}
          scale={0.8}
          turbulence={0.6}
          turbulenceScale={0.5}
          turbulenceReach={20}
          sparks={2}
          sparkSize={0.4}
          sparkDensity={1.2}
          sparkSpeed={1.2}
          rim={3}
          melt={3}
          distortion={8}
          smoke={1}
          ember={2.5}
          scorch={0}
          color={[0.44, 0.56, 0.96]}
        >
          <h1 className="text-4xl font-bold tracking-[0.25em] text-[#b4befe] drop-shadow-[0_0_18px_rgba(180,190,254,0.55)]">
            NEON_DRIVE
          </h1>
        </FlameWrap>
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

        <FlameWrap
          intensity={Math.min(0.3 + (car.kmh / 900) * 1.7, 2)}
          height={Math.min(30 + (car.kmh / 900) * 140, 170)}
          spread={4 + (car.kmh / 900) * 8}
          radius={12}
          speed={0.2 + (car.kmh / 900) * 0.4}
          scale={0.7}
          turbulence={0.4 + (car.kmh / 900) * 0.4}
          turbulenceScale={0.5}
          turbulenceReach={15}
          sparks={car.kmh > 400 ? 2.5 : 0}
          sparkSize={0.35}
          sparkDensity={1}
          sparkSpeed={1.5}
          rim={2 + (car.kmh / 900) * 2}
          melt={2 + (car.kmh / 900) * 4}
          distortion={6 + (car.kmh / 900) * 8}
          smoke={car.kmh > 500 ? 1.5 : 0}
          ember={1.5 + (car.kmh / 900) * 1.5}
          scorch={car.kmh > 600 ? 0.5 : 0}
          color={
            car.kmh > 700
              ? [0.95, 0.27, 0.37]
              : car.kmh > 400
                ? [0.76, 0.49, 0.93]
                : [0.44, 0.56, 0.96]
          }
          className="self-start"
        >
          <div
            className="rounded-xl border border-white/10 bg-white/5 p-3 text-right shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-md"
            title="car status"
          >
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
                car.kmh > 700
                  ? "text-[#f38ba8]"
                  : car.kmh > 350
                    ? "text-[#f9e2af]"
                    : "text-[#b4befe]"
              }`}
            >
              {Math.round(car.kmh)}
            </span>
            <span className="text-[10px] tracking-[0.25em] text-[#6c7086]">KM/H</span>
          </div>
          <div className="ml-auto mt-1 h-1.5 w-44 overflow-hidden rounded border border-white/10 bg-white/5">
            <div
              className={`h-full transition-all duration-100 ${
                car.kmh > 700 ? "bg-[#f38ba8]" : "bg-[#b4befe]"
              }`}
              style={{ width: `${Math.min(100, (car.kmh / 900) * 100)}%` }}
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
        </FlameWrap>
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

        <AudioReactiveFlames playState={playState} getFrequencies={getFrequencies}>
          <div className="flex w-72 flex-col items-center gap-3 rounded-xl border border-white/10 bg-black/60 p-4 shadow-[0_4px_30px_rgba(0,0,0,0.1)] backdrop-blur-md">
            <p
              className="text-xs tracking-[0.15em] text-[#cba6f7]"
              style={{ textShadow: "0 0 12px rgba(203,166,247,0.75)" }}
            >
              {trackName}
            </p>

          <div className="h-0.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#89b4fa] to-[#cba6f7]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous track"
              onClick={() => {
                prevTrack();
                flashNow();
              }}
              className="rounded-lg p-2 text-[#cad3f5]/60 transition-all hover:bg-white/10 hover:text-white active:scale-95"
            >
              <SkipBack size={16} />
            </button>
            <button
              type="button"
              aria-label={playState === "playing" ? "Pause" : "Play"}
              onClick={togglePlay}
              className="rounded-lg border border-white/10 bg-white/10 p-3 text-[#cad3f5] shadow-[0_0_14px_rgba(138,173,244,0.25)] transition-all hover:bg-white/20 hover:text-white active:scale-95"
            >
              {playState === "playing" ? (
                <Pause size={18} />
              ) : (
                <Play size={18} className="translate-x-[1px]" />
              )}
            </button>
            <button
              type="button"
              aria-label="Next track"
              onClick={() => {
                nextTrack();
                flashNow();
              }}
              className="rounded-lg p-2 text-[#cad3f5]/60 transition-all hover:bg-white/10 hover:text-white active:scale-95"
            >
              <SkipForward size={16} />
            </button>
          </div>

          <div className="mt-1 flex items-center gap-4 text-[10px] tracking-[0.2em] text-[#a5adcb]">
            <button
              type="button"
              onClick={() => setMode(mode === "chill" ? "intense" : "chill")}
              className="rounded-lg px-2 py-1 transition-all hover:bg-white/10 hover:text-white"
            >
              INTENSITY: {mode === "chill" ? "CHILL" : "INTENSE"}
            </button>
          </div>
        </div>
        </AudioReactiveFlames>
      </div>
    </div>
  );
}