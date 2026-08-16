"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useThree } from "@react-three/fiber";
import { contextStore } from "../store/contextStore";

interface Props {
  children: ReactNode;
}

export default function ContextHealthGate({ children }: Props) {
  const gl = useThree((state) => state.gl);

  const [healthy] = useState(() => {
    try {
      const context = gl.getContext();
      if (!context) return false;
      if (typeof context.isContextLost === "function" && context.isContextLost()) {
        return false;
      }
      if (context.getContextAttributes() === null) return false;
      return true;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!healthy) contextStore.getState().setUnavailable();
  }, [healthy]);

  if (!healthy) return null;
  return <>{children}</>;
}