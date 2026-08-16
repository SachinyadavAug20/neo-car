"use client";

import { useStore } from "zustand";
import { contextStore } from "../store/contextStore";

export default function GraphicsOverlay() {
  const state = useStore(contextStore, (s) => s.state);

  if (state === "ok") return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-[#050505] p-6 text-center"
      style={{ fontFamily: "var(--font-geist-mono), monospace", color: "#cad3f5" }}
    >
      <p className="text-sm font-bold tracking-[0.3em] text-[#cba6f7]">
        &gt; {state === "lost" ? "GRAPHICS CONTEXT LOST" : "GRAPHICS CONTEXT UNAVAILABLE"}
      </p>
      <p className="max-w-md text-xs leading-relaxed text-[#8aadf4]">
        {state === "lost"
          ? "The WebGL context was lost (too many active graphics contexts or a driver reset). This tab already reloaded once — further automatic reloads were disabled to avoid a reload loop."
          : "A WebGL context could not be acquired (the browser has too many active graphics contexts open)."}
        {" "}Fully close this tab and reopen it to release the stale contexts, then load again.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="cursor-pointer border border-[#8aadf4]/40 px-5 py-2 text-xs font-bold tracking-[0.25em] text-[#94e2d5] hover:bg-[#8aadf4]/10"
      >
        &gt; RELOAD SYSTEM
      </button>
    </div>
  );
}