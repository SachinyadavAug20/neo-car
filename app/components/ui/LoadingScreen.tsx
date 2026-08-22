"use client";

import { useAppStore } from "@/app/lib/store";

export default function LoadingScreen() {
  const loaded = useAppStore((s) => s.loaded);

  if (loaded) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0e27]">
      <div className="relative">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-transparent border-t-[#4ecdc4] border-r-[#a78bfa]" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-3 w-3 rounded-full bg-[#4ecdc4] animate-pulse-glow" />
        </div>
      </div>
      <p className="mt-6 text-sm tracking-[0.3em] text-[#94a3b8] animate-pulse-glow">
        LOADING SKY
      </p>
    </div>
  );
}
