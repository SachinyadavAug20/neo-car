"use client";

import { create } from "zustand";

export type RouteId = "home" | "about" | "projects" | "drive";

interface RouteStore {
  route: RouteId;
  setRoute: (route: RouteId) => void;
}

export const useRouteStore = create<RouteStore>((set) => ({
  route: "home",
  setRoute: (route) => set({ route }),
}));

export const ROUTE_CONFIG: Record<
  RouteId,
  {
    label: string;
    key: string;
    camPos: [number, number, number];
    camLook: [number, number, number];
    fov: number;
  }
> = {
  home: {
    label: "HOME",
    key: "1",
    camPos: [0, 8, 26],
    camLook: [0, 3, 15],
    fov: 50,
  },
  about: {
    label: "ABOUT",
    key: "2",
    camPos: [-12, 10, 22],
    camLook: [0, 3, 15],
    fov: 48,
  },
  projects: {
    label: "PROJECTS",
    key: "3",
    camPos: [12, 10, 22],
    camLook: [0, 3, 15],
    fov: 48,
  },
  drive: {
    label: "DRIVE",
    key: "4",
    camPos: [0, 5, 18],
    camLook: [0, 2, 20],
    fov: 60,
  },
};
