export interface ChapterWaypoint {
  position: [number, number, number];
  lookAt: [number, number, number];
  background: string;
}

export const chapters: ChapterWaypoint[] = [
  { position: [0, 4, 15], lookAt: [0, 0, 0], background: "#fdf6e3" },
  { position: [8, 5, 8], lookAt: [0, 2, 0], background: "#fff7ed" },
  { position: [-6, 4, 10], lookAt: [-5, 0, 5], background: "#fef3c7" },
  { position: [15, 5, -5], lookAt: [10, 0, -8], background: "#f5f5f4" },
  { position: [-10, 6, -8], lookAt: [-8, 0, -10], background: "#faf5ff" },
  { position: [5, 4, -15], lookAt: [0, 0, -10], background: "#f0fdf4" },
  { position: [-15, 5, 5], lookAt: [-10, 0, 0], background: "#fff7ed" },
  { position: [0, 8, 0], lookAt: [0, 0, 0], background: "#fefce8" },
];
