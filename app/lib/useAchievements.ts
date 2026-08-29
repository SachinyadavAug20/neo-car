"use client";

import { useState, useEffect, useCallback } from "react";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: number;
}

export const ACHIEVEMENTS_LIST: Achievement[] = [
  { id: "first_flight", title: "First Flight", description: "Take your first jump with Milo the crane", icon: "🦢" },
  { id: "storm_survivor", title: "Tempest Endured", description: "Survive the roaring paper storm in Act 2", icon: "⛈️" },
  { id: "forest_friend", title: "Forest Secrets", description: "Discover the hidden origami fox in Act 3", icon: "🦊" },
  { id: "secret_folder", title: "Master Origami", description: "Unlock the legendary Secret Fold in Act 5", icon: "✨" },
  { id: "grand_voyage", title: "The Whole Story", description: "Complete all 8 acts of DRIFT", icon: "📜" },
  { id: "paparazzi", title: "Paper Photographer", description: "Capture a photo postcard in Photo Mode", icon: "📷" },
  { id: "hacker", title: "Drafting Architect", description: "Open the Drafting Terminal (Ctrl+~)", icon: "💻" },
  { id: "sound_maestro", title: "Sound Maestro", description: "Play a procedural sound via Soundboard", icon: "🎵" },
  { id: "flora_touch", title: "Green Thumb", description: "Make a blooming paper flower blossom", icon: "🌸" },
  { id: "frog_whisperer", title: "Frog Whisperer", description: "Make a paper frog leap into the air", icon: "🐸" },
  { id: "cinematic_gazer", title: "Cinematic Gazer", description: "Experience the Cinematic Auto-Tour", icon: "🎬" },
];

const STORAGE_KEY = "drift_unlocked_achievements_v1";

export function useAchievements() {
  const [unlocked, setUnlocked] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return {};
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch {
      return {};
    }
  });

  const [recentUnlock, setRecentUnlock] = useState<Achievement | null>(null);

  const unlockAchievement = useCallback((id: string) => {
    setUnlocked((prev) => {
      if (prev[id]) return prev; // already unlocked
      const next = { ...prev, [id]: Date.now() };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {}

      const found = ACHIEVEMENTS_LIST.find((a) => a.id === id);
      if (found) {
        setRecentUnlock(found);
        window.dispatchEvent(new CustomEvent("success"));
        window.dispatchEvent(new CustomEvent("victory"));
      }
      return next;
    });
  }, []);

  const clearRecent = useCallback(() => {
    setRecentUnlock(null);
  }, []);

  return {
    unlocked,
    recentUnlock,
    unlockAchievement,
    clearRecent,
    allAchievements: ACHIEVEMENTS_LIST,
  };
}
