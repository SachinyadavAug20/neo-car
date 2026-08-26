"use client";

import dynamic from "next/dynamic";

const Scene = dynamic(() => import("./components/three/Scene"), { ssr: false });

export default function HomePage() {
  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden" }}>
      <Scene />
    </div>
  );
}
