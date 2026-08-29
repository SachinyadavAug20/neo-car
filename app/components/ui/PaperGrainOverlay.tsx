"use client";

import { memo } from "react";

export const PaperGrainOverlay = memo(function PaperGrainOverlay() {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 25,
        overflow: "hidden",
        boxShadow: "inset 0 0 100px rgba(26, 26, 46, 0.06)",
      }}
    />
  );
});
