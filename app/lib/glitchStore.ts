type GlitchListener = () => void;

const listeners = new Set<GlitchListener>();

export function triggerGlitch(): void {
  listeners.forEach((listener) => listener());
}

export function onGlitch(listener: GlitchListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}