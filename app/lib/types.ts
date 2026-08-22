export interface Island {
  id: string;
  name: string;
  description: string;
  color: string;
  accentColor: string;
  position: [number, number, number];
  cameraOffset: [number, number, number];
  cameraLookAt: [number, number, number];
}

export const ISLANDS: Island[] = [
  {
    id: "crystal",
    name: "Crystal Cavern",
    description: "Bioluminescent crystals hum with ancient energy, casting prismatic light across cavern walls that breathe with the rhythm of the deep earth.",
    color: "#67e8f9",
    accentColor: "#0891b2",
    position: [0, 0, 0],
    cameraOffset: [8, 6, 12],
    cameraLookAt: [0, 1, 0],
  },
  {
    id: "mushroom",
    name: "Mushroom Grove",
    description: "Giant fungal towers reach toward the sky, their caps glowing softly as spores drift upward like inverse rain, carrying whispers of the forest.",
    color: "#a78bfa",
    accentColor: "#7c3aed",
    position: [35, -5, -20],
    cameraOffset: [10, 8, 14],
    cameraLookAt: [0, 2, 0],
  },
  {
    id: "ruins",
    name: "Ancient Ruins",
    description: "Forgotten pillars of a sky civilization stand sentinel over floating fragments, each stone humming with the memory of what once was.",
    color: "#fbbf24",
    accentColor: "#d97706",
    position: [-30, -8, -35],
    cameraOffset: [12, 7, 10],
    cameraLookAt: [0, 1.5, 0],
  },
  {
    id: "garden",
    name: "Sky Garden",
    description: "Ethereal flora cascade from floating petals, their bioluminescent stems weaving a tapestry of light that dances between the clouds.",
    color: "#f472b6",
    accentColor: "#db2777",
    position: [15, -12, -50],
    cameraOffset: [9, 5, 13],
    cameraLookAt: [0, 1, 0],
  },
];

export const OVERVIEW_CAMERA = {
  position: [25, 30, 45] as [number, number, number],
  lookAt: [0, -5, -20] as [number, number, number],
};
