"use client";

import { useEffect, useState } from "react";
import { useThree } from "@react-three/fiber";

export default function ContextLossGuard() {
  const gl = useThree((state) => state.gl);
  const [lost, setLost] = useState(false);

  useEffect(() => {
    const canvas = gl.domElement;
    const handleLost = (event: Event) => {
      event.preventDefault();
      setLost(true);
    };
    canvas.addEventListener("webglcontextlost", handleLost);
    return () => {
      canvas.removeEventListener("webglcontextlost", handleLost);
    };
  }, [gl]);

  useEffect(() => {
    if (!lost) return;
    const timer = window.setTimeout(() => {
      window.location.reload();
    }, 500);
    return () => window.clearTimeout(timer);
  }, [lost]);

  return null;
}