"use client";

export interface CarStatus {
  kmh: number;
  gear: "D" | "R";
  onRoad: boolean;
  throttle: boolean;
}

type StatusListener = (status: CarStatus) => void;

const IDLE_STATUS: CarStatus = {
  kmh: 0,
  gear: "D",
  onRoad: true,
  throttle: false,
};

let status: CarStatus = IDLE_STATUS;
const listeners = new Set<StatusListener>();

export function setCarStatus(next: CarStatus): void {
  const changed =
    Math.round(next.kmh) !== Math.round(status.kmh) ||
    next.gear !== status.gear ||
    next.onRoad !== status.onRoad ||
    next.throttle !== status.throttle;
  if (!changed) return;
  status = { ...next, kmh: Math.round(next.kmh) };
  listeners.forEach((listener) => listener(status));
}

export function getCarStatus(): CarStatus {
  return status;
}

export function subscribeCarStatus(listener: StatusListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}