"use client";

import { useEffect, useRef, useState } from "react";
import { useThree } from "@react-three/fiber";
import { contextStore } from "../store/contextStore";

const RELOADED_KEY = "neon-drive-context-reloaded";

export default function ContextLossGuard() {
  const gl = useThree((state) => state.gl);
  const [lost, setLost] = useState(false);
  const reloadHandled = useRef(false);

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
    if (!lost || reloadHandled.current) return;
    reloadHandled.current = true;
    if (sessionStorage.getItem(RELOADED_KEY)) {
      contextStore.getState().setLost();
      return;
    }
    sessionStorage.setItem(RELOADED_KEY, "1");
    const timer = window.setTimeout(() => {
      window.location.reload();
    }, 800);
    return () => window.clearTimeout(timer);
  }, [lost]);

  return null;
}