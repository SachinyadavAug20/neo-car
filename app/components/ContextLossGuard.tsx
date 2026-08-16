"use client";

import { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import { contextStore } from "../store/contextStore";

export default function ContextLossGuard() {
  const gl = useThree((state) => state.gl);

  useEffect(() => {
    const canvas = gl.domElement;
    const handleLost = (event: Event) => {
      event.preventDefault();
      contextStore.getState().setLost();
    };
    canvas.addEventListener("webglcontextlost", handleLost);
    return () => {
      canvas.removeEventListener("webglcontextlost", handleLost);
    };
  }, [gl]);

  useEffect(() => {
    const release = (event: PageTransitionEvent) => {
      if (event.persisted) return;
      try {
        const ctx = gl.getContext() as
          | WebGLRenderingContext
          | WebGL2RenderingContext
          | null;
        ctx?.getExtension("WEBGL_lose_context")?.loseContext();
      } catch {
        // ignore
      }
    };
    window.addEventListener("pagehide", release);
    return () => window.removeEventListener("pagehide", release);
  }, [gl]);

  return null;
}