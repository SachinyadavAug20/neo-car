export interface ChapterWaypoint {
  position: [number, number, number];
  lookAt: [number, number, number];
  background: string;
}

export const chapters: ChapterWaypoint[] = [
  {
    position: [0, 3, 8],
    lookAt: [0, 0, 0],
    background: "#fdf6e3",
  },
  {
    position: [2, 4, 4],
    lookAt: [0, 1, -1],
    background: "#fff7ed",
  },
  {
    position: [-3, 2, 5],
    lookAt: [-2.5, 0, 2.5],
    background: "#fef3c7",
  },
  {
    position: [9, 3, -1],
    lookAt: [9, 0, 1],
    background: "#f5f5f4",
  },
  {
    position: [1, 6, 2],
    lookAt: [0, 2, 0],
    background: "#faf5ff",
  },
  {
    position: [0, 8, -5],
    lookAt: [0, 3, -8],
    background: "#f0fdf4",
  },
  {
    position: [5, 2, 6],
    lookAt: [5, 0, 5],
    background: "#fff7ed",
  },
  {
    position: [2, 3, 4],
    lookAt: [0, 0, 2],
    background: "#fefce8",
  },
];
