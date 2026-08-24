"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

export default function LoadingExperience() {
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [mounted, setMounted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setTimeout(() => setIsComplete(true), 500);
          return 100;
        }
        return prev + Math.random() * 3 + 1;
      });
    }, 50);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  if (!mounted || isComplete) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-[#050816] flex items-center justify-center">
      <div className="text-center">
        <div className="mb-8">
          <div className="text-[10px] tracking-[1em] text-white/20 mb-4">LOADING</div>
          <div className="text-4xl font-display tracking-[0.5em] text-white/80">DRIFT</div>
        </div>

        <div className="w-64 mx-auto mb-6">
          <div className="h-[1px] bg-white/10 relative overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#4ecdc4] to-[#a78bfa] transition-all duration-300"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
        </div>

        <div className="text-[10px] tracking-[0.5em] text-white/20">
          {Math.min(Math.floor(progress), 100)}%
        </div>

        <div className="mt-12 text-[10px] text-white/10 tracking-[0.3em]">
          PREPARING YOUR JOURNEY
        </div>
      </div>
    </div>
  );
}
