"use client";

import { useRef, useEffect, useCallback, useState } from "react";

export interface JourneyStats {
  startTime: number;
  endTime: number;
  totalClicks: number;
  totalKeys: number;
  totalMouseMoveDistance: number; // in world units
  actTimes: number[]; // ms spent in each act
  actClicks: number[]; // clicks per act
  actInteractions: number[]; // interactions completed per act
  actBeatCount: number[]; // beats visited per act
  secretsFound: string[];
  currentAct: number;
  loreCollected: number;
  charactersMet: string[];
  jumpsMade: number;
  windGenerated: number;
  leavesCollected: number;
  cellsToggled: number;
  boatStrokes: number;
  butterfliesFollowed: number;
  cranesReleased: number;
  shattersTriggered: number;
  pendulumsPushed: number;
  crittersFound: number;
  foldsUnlocked: boolean;
}

const INITIAL_JOURNEY: JourneyStats = {
  startTime: Date.now(),
  endTime: 0,
  totalClicks: 0,
  totalKeys: 0,
  totalMouseMoveDistance: 0,
  actTimes: [0, 0, 0, 0, 0, 0, 0, 0],
  actClicks: [0, 0, 0, 0, 0, 0, 0, 0],
  actInteractions: [0, 0, 0, 0, 0, 0, 0, 0],
  actBeatCount: [0, 0, 0, 0, 0, 0, 0, 0],
  secretsFound: [],
  currentAct: 0,
  loreCollected: 0,
  charactersMet: [],
  jumpsMade: 0,
  windGenerated: 0,
  leavesCollected: 0,
  cellsToggled: 0,
  boatStrokes: 0,
  butterfliesFollowed: 0,
  cranesReleased: 0,
  shattersTriggered: 0,
  pendulumsPushed: 0,
  crittersFound: 0,
  foldsUnlocked: false,
};

export function useJourneyTracker() {
  const statsRef = useRef<JourneyStats>({ ...INITIAL_JOURNEY, startTime: Date.now() });
  const lastMousePos = useRef({ x: 0, y: 0 });
  const lastActTime = useRef(Date.now());
  const [stats, setStats] = useState<JourneyStats>({ ...INITIAL_JOURNEY, startTime: Date.now() });

  const updateStats = useCallback(() => {
    statsRef.current.endTime = Date.now();
    setStats({ ...statsRef.current });
  }, []);

  // Track mouse distance
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      statsRef.current.totalMouseMoveDistance += Math.sqrt(dx * dx + dy * dy) * 0.01;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  // Track clicks
  useEffect(() => {
    const onClick = () => {
      statsRef.current.totalClicks++;
      const act = statsRef.current.currentAct;
      if (act >= 0 && act < 8) statsRef.current.actClicks[act]++;
      updateStats();
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [updateStats]);

  // Track key presses
  useEffect(() => {
    const onKey = () => {
      statsRef.current.totalKeys++;
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Track act changes
  const setCurrentAct = useCallback((act: number) => {
    const now = Date.now();
    const prev = statsRef.current.currentAct;
    if (prev >= 0 && prev < 8) {
      statsRef.current.actTimes[prev] += now - lastActTime.current;
    }
    statsRef.current.currentAct = act;
    lastActTime.current = now;
    updateStats();
  }, [updateStats]);

  // Track beat visits
  const visitBeat = useCallback((act: number, beat: number) => {
    if (act >= 0 && act < 8) {
      statsRef.current.actBeatCount[act] = Math.max(statsRef.current.actBeatCount[act], beat + 1);
    }
    updateStats();
  }, [updateStats]);

  // Track interaction completion
  const completeInteraction = useCallback((act: number) => {
    if (act >= 0 && act < 8) statsRef.current.actInteractions[act]++;
    updateStats();
  }, [updateStats]);

  // Track specific events
  const trackEvent = useCallback((event: string, detail?: any) => {
    switch (event) {
      case "milo-jump": statsRef.current.jumpsMade++; break;
      case "wind-generated": statsRef.current.windGenerated += detail?.force || 1; break;
      case "collect-leaf": statsRef.current.leavesCollected++; break;
      case "toggle-cell": statsRef.current.cellsToggled++; break;
      case "row-boat": statsRef.current.boatStrokes++; break;
      case "follow-butterfly": statsRef.current.butterfliesFollowed++; break;
      case "celebrate": statsRef.current.cranesReleased++; break;
      case "secret-found": if (detail?.word) statsRef.current.secretsFound.push(detail.word); break;
      case "lore-collected": statsRef.current.loreCollected++; break;
      case "shatter": statsRef.current.shattersTriggered++; break;
      case "pendulum-push": statsRef.current.pendulumsPushed++; break;
      case "critter-found": statsRef.current.crittersFound++; break;
    }
    updateStats();
  }, [updateStats]);

  return { stats, setCurrentAct, visitBeat, completeInteraction, trackEvent };
}

// Helper to format time
export function formatTime(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min > 60) {
    const hr = Math.floor(min / 60);
    const remainMin = min % 60;
    return `${hr}h ${remainMin}m`;
  }
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`;
}

// Helper to get most engaged act
export function getMostEngagedAct(stats: JourneyStats): number {
  let maxScore = 0;
  let maxAct = 0;
  for (let i = 0; i < 8; i++) {
    const score = stats.actClicks[i] + stats.actInteractions[i] * 5 + stats.actBeatCount[i] * 2;
    if (score > maxScore) {
      maxScore = score;
      maxAct = i;
    }
  }
  return maxAct;
}

// Get act engagement label
export function getActEngagementLabel(act: number): string {
  const labels = [
    "The Cliff Edge", "The Storm", "The Forest", "The Unfolded Lands",
    "The Secret Fold", "The Return", "The Boat Named Pip", "The Moral Fold"
  ];
  return labels[act] || `Act ${act + 1}`;
}

// Get act color
export function getActColor(act: number): string {
  const colors = ["#ef4444", "#6b7280", "#22c55e", "#a78bfa", "#fbbf24", "#3b82f6", "#67e8f9", "#f472b6"];
  return colors[act] || "#1a1a2e";
}
