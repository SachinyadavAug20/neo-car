"use client";

import { useStore } from "zustand";
import { contextStore } from "../store/contextStore";

export default function GraphicsOverlay() {
  const state = useStore(contextStore, (s) => s.state);

  if (state === "ok") return null;

  const title =
    state === "lost" ? "GRAPHICS CONTEXT LOST" : "GRAPHICS CONTEXT UNAVAILABLE";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-50 flex items-center justify-center p-3">
      <div
        className="pointer-events-auto flex max-w-2xl flex-col items-center gap-2 rounded border border-[#f38ba8]/40 bg-[#050505]/95 px-4 py-3 text-center shadow-[0_0_24px_rgba(243,139,168,0.25)]"
        style={{ fontFamily: "var(--font-geist-mono), monospace", color: "#cad3f5" }}
      >
        <p className="text-[10px] font-bold tracking-[0.25em] text-[#f38ba8]">
          &gt; {title}
        </p>
<p className="max-w-xl text-[10px] leading-relaxed text-[#8aadf4]">
        {state === "lost"
          ? "The WebGL context was lost (too many active graphics contexts or a driver reset). Reload manually, or close this tab and open a fresh one to release the stale contexts."
          : "A WebGL context could not be acquired (too many active graphics contexts or no GPU). Close this tab and open a fresh one to release the stale contexts, then load again."}
      </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="cursor-pointer border border-[#8aadf4]/40 px-4 py-1 text-[10px] font-bold tracking-[0.25em] text-[#94e2d5] hover:bg-[#8aadf4]/10"
        >
          &gt; RELOAD SYSTEM
        </button>
      </div>
    </div>
  );
}