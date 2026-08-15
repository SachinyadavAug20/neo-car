type FadeListener = () => void;

const listeners = new Set<FadeListener>();

export function triggerFade(): void {
  listeners.forEach((listener) => listener());
}

export function onFade(listener: FadeListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}