"use client";

import Scene from "./components/three/Scene";

export default function LayoutClient() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden" }}>
      <Scene />
    </div>
  );
}
