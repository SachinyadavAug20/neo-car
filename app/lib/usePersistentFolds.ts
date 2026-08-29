"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "drift-persistent-folds";

export interface PersistentFolds {
  secretFoldUnlocked: boolean;
  actsCompleted: number[];
  totalPlaythroughs: number;
  lastVisit: string;
  colorShifts: Record<string, string>;
  totalPlayTimeMs: number;
}

const DEFAULT_FOLDS: PersistentFolds = {
  secretFoldUnlocked: false,
  actsCompleted: [],
  totalPlaythroughs: 0,
  lastVisit: "",
  colorShifts: {},
  totalPlayTimeMs: 0,
};

function loadFolds(): PersistentFolds {
  if (typeof window === "undefined") return DEFAULT_FOLDS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_FOLDS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.actsCompleted)) parsed.actsCompleted = [];
    if (!Array.isArray(parsed.secretsFound)) parsed.secretsFound = [];
    return { ...DEFAULT_FOLDS, ...parsed };
  } catch {
    return DEFAULT_FOLDS;
  }
}

function saveFolds(folds: PersistentFolds) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(folds));
  } catch (e) {
    console.warn("DRIFT: Failed to save progress", e);
  }
}

export function usePersistentFolds() {
  const [folds, setFolds] = useState<PersistentFolds>(() => {
    const initial = loadFolds();
    if (typeof window !== "undefined") {
      const withVisit = { ...initial, lastVisit: new Date().toISOString() };
      saveFolds(withVisit);
      return withVisit;
    }
    return initial;
  });
  const [loaded] = useState(true);

  const unlockSecretFold = useCallback(() => {
    setFolds(prev => {
      if (prev.secretFoldUnlocked) return prev;
      const next = { ...prev, secretFoldUnlocked: true };
      saveFolds(next);
      return next;
    });
  }, []);

  const completeAct = useCallback((actIndex: number) => {
    setFolds(prev => {
      if (prev.actsCompleted.includes(actIndex)) return prev;
      const next = { ...prev, actsCompleted: [...prev.actsCompleted, actIndex] };
      saveFolds(next);
      return next;
    });
  }, []);

  const incrementPlaythrough = useCallback(() => {
    setFolds(prev => {
      const next = { ...prev, totalPlaythroughs: prev.totalPlaythroughs + 1 };
      saveFolds(next);
      return next;
    });
  }, []);

  const addPlayTime = useCallback((ms: number) => {
    setFolds(prev => {
      const next = { ...prev, totalPlayTimeMs: prev.totalPlayTimeMs + ms };
      saveFolds(next);
      return next;
    });
  }, []);

  const setColorShift = useCallback((key: string, color: string) => {
    setFolds(prev => {
      const next = { ...prev, colorShifts: { ...prev.colorShifts, [key]: color } };
      saveFolds(next);
      return next;
    });
  }, []);

  const resetFolds = useCallback(() => {
    setFolds(DEFAULT_FOLDS);
    saveFolds(DEFAULT_FOLDS);
  }, []);

  return {
    folds,
    loaded,
    unlockSecretFold,
    completeAct,
    incrementPlaythrough,
    addPlayTime,
    setColorShift,
    resetFolds,
  };
}
