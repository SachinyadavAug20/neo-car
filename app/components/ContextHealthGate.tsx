"use client";

import { useState, type ReactNode } from "react";
import { useThree } from "@react-three/fiber";

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

  if (!healthy) return null;
  return <>{children}</>;
}