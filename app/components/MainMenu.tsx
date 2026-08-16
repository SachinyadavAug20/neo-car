"use client";

import { useEffect, useState } from "react";
import { useStore } from "zustand";
import { gameStore } from "../store/gameStore";

const TERMINAL_FONT =
  "var(--font-geist-mono), 'Fira Code', 'JetBrains Mono', monospace";

const BOOT_LINES: readonly string[] = [
  "[    0.000000] Linux version 6.1.0-meow_tui (builder@tui) #1 SMP",
  "[    0.012301] Command line: BOOT_IMAGE=/vmlinuz-meow root=/dev/meow_tui ro quiet",
  "[    0.098110] CPU0: Meow_TUI Virtual Processor detected",
  "[  OK  ] Reached target Local File Systems.",
  "[  OK  ] Reached target Network.",
  "[  OK  ] Started Meow_TUI Daemon.",
  "[  OK  ] Mounted /dev/meow/neon_drive at /run/neon_drive",
  "[  OK  ] Started NEON_DRIVE subsystem.",
  "[  OK  ] Reached target Multi-User System.",
];

const BOOT_LINE_INTERVAL_MS = 130;
const BOOT_DURATION_MS = 2000;

export default function MainMenu() {
  const gameState = useStore(gameStore, (state) => state.gameState);
  const [bootLines, setBootLines] = useState<string[]>([]);
  const [bootComplete, setBootComplete] = useState(false);

  useEffect(() => {
    if (gameState !== "boot") return;

    let index = 0;
    const interval = setInterval(() => {
      if (index >= BOOT_LINES.length) return;
      setBootLines((prev) => [...prev, BOOT_LINES[index]]);
      index += 1;
    }, BOOT_LINE_INTERVAL_MS);

    const timer = setTimeout(() => {
      clearInterval(interval);
      setBootComplete(true);
    }, BOOT_DURATION_MS);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [gameState]);

  useEffect(() => {
    if (gameState !== "boot" || !bootComplete) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") gameStore.getState().startGame();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [gameState, bootComplete]);

  if (gameState !== "boot") return null;

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col items-center justify-center bg-[#050505] p-4 backdrop-blur-md"
      style={{ fontFamily: TERMINAL_FONT, color: "#cad3f5" }}
    >
      <div className="w-full max-w-2xl">
        <p className="mb-6 text-center text-[10px] font-bold tracking-[0.25em] text-[#cba6f7] sm:text-sm">
          +---[ MEOW_TUI OS ]---+
        </p>
        <div className="mb-6 h-56 overflow-hidden rounded border border-[#8aadf4]/25 bg-black/40 p-3 text-[10px] leading-relaxed text-[#a6e3a1] sm:text-xs">
          {bootLines.map((line, index) => (
            <p key={`${line}-${index}`} className="whitespace-pre-wrap break-all">
              {line}
            </p>
          ))}
          {!bootComplete && (
            <span className="animate-pulse text-[#94e2d5]">_</span>
          )}
        </div>
        {bootComplete && (
          <p className="animate-pulse text-center text-sm font-bold tracking-[0.3em] text-[#94e2d5] sm:text-base">
            &gt; PRESS ENTER TO EXECUTE NEON_DRIVE.BIN
          </p>
        )}
      </div>
    </div>
  );
}