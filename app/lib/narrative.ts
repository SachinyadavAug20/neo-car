export interface StoryBeat {
  id: string;
  text: string;
  subtitle?: string;
  duration: number;
}

export interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  color: string;
  islandId: string;
  cameraPath: [number, number, number][];
  lookAtPath: [number, number, number][];
  ambientColor: string;
  fogDensity: number;
  beats: StoryBeat[];
  lore: { title: string; text: string };
}

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: "The Awakening",
    subtitle: "Where light first learned to dream",
    color: "#67e8f9",
    islandId: "crystal",
    cameraPath: [[30,25,40],[12,8,16],[5,4,8],[2,3,5]],
    lookAtPath: [[0,-5,-20],[0,1,0],[1.5,2,0.5],[1.5,2,0.5]],
    ambientColor: "#67e8f9",
    fogDensity: 0.012,
    beats: [
      { id:"a1", text:"In the beginning, there was only the Void.", subtitle:"A darkness so complete it had forgotten itself.", duration:4000 },
      { id:"a2", text:"Then, a single spark. Fragile. Impossible.", subtitle:"It did not know why it burned. It only knew it must.", duration:4500 },
      { id:"a3", text:"The spark fell through infinite space and landed on stone that had never known light.", subtitle:"And the stone began to sing.", duration:5000 },
      { id:"a4", text:"From that song, crystals grew.", subtitle:"Each one a memory the Void had tried to forget.", duration:4000 },
    ],
    lore: { title:"The First Spark", text:"The Void was not empty. It was full of things that had not yet happened. The first spark was not created - it was remembered. Something ancient, buried in the fabric of nothingness, decided it was time to begin again." },
  },
  {
    id: 2,
    title: "The Growth",
    subtitle: "When the world learned to breathe",
    color: "#a78bfa",
    islandId: "mushroom",
    cameraPath: [[45,20,10],[40,8,-15],[37,5,-20],[36,4,-21]],
    lookAtPath: [[0,-5,-20],[35,2,-20],[37,3,-22],[37,3,-22]],
    ambientColor: "#a78bfa",
    fogDensity: 0.015,
    beats: [
      { id:"g1", text:"Life did not ask permission.", subtitle:"It erupted from the cracks, wild and unwelcome.", duration:4000 },
      { id:"g2", text:"Fungal towers rose like cathedrals, their caps glowing with inner knowing.", subtitle:"They spoke in spores - a language older than words.", duration:5000 },
      { id:"g3", text:"The grove became a library. Every spore carried a story.", subtitle:"The air itself was made of whispered histories.", duration:4500 },
      { id:"g4", text:"And somewhere in the canopy, the first dreamer closed their eyes.", subtitle:"And saw everything that was to come.", duration:4500 },
    ],
    lore: { title:"The Spore Library", text:"The Mushroom Grove is the oldest living archive in Drift. Each fungal tower stores centuries of memories in its rings. The spores they release are not seeds - they are stories, drifting on the wind, waiting for someone to breathe them in and remember." },
  },
  {
    id: 3,
    title: "The Forgetting",
    subtitle: "What remains when memory fades",
    color: "#fbbf24",
    islandId: "ruins",
    cameraPath: [[-20,15,-15],[-28,6,-30],[-30,4,-35],[-31,3,-36]],
    lookAtPath: [[0,-5,-20],[-30,1,-35],[-30,2,-35],[-30,2,-35]],
    ambientColor: "#fbbf24",
    fogDensity: 0.018,
    beats: [
      { id:"f1", text:"Not all things endure.", subtitle:"Some are meant to crumble, to teach us the shape of loss.", duration:4500 },
      { id:"f2", text:"The pillars stood for centuries, holding up a sky that forgot them.", subtitle:"Stone remembers longer than flesh. But even stone eventually lets go.", duration:5000 },
      { id:"f3", text:"In the ruins, echoes still bounce between broken walls.", subtitle:"Each echo is a conversation that never finished.", duration:4500 },
      { id:"f4", text:"But look closely - between the cracks, new light is growing.", subtitle:"Forgetting makes room for becoming.", duration:4000 },
    ],
    lore: { title:"The Forgotten City", text:"The Ruins were once the capital of Drift - a civilization of memory-keepers who catalogued every moment of existence. When they discovered that some things are meant to be forgotten, their city began to dissolve. The pillars that remain are the last stubborn fragments of a people who chose to let go." },
  },
  {
    id: 4,
    title: "The Becoming",
    subtitle: "Where endings learn to bloom",
    color: "#f472b6",
    islandId: "garden",
    cameraPath: [[25,10,-35],[18,4,-48],[15,3,-50],[14,3,-51]],
    lookAtPath: [[0,-5,-20],[15,1,-50],[15,2,-50],[15,2,-50]],
    ambientColor: "#f472b6",
    fogDensity: 0.014,
    beats: [
      { id:"b1", text:"After the forgetting comes the garden.", subtitle:"Where fallen memories take root and bloom into something new.", duration:4500 },
      { id:"b2", text:"Each petal is a story that refused to end.", subtitle:"They drift upward, defying gravity, defying finality.", duration:5000 },
      { id:"b3", text:"The garden does not grow from soil. It grows from longing.", subtitle:"From the quiet ache of things half-remembered.", duration:4500 },
      { id:"b4", text:"And in the center, a single flower waits.", subtitle:"It has been waiting since before the beginning.", duration:4000 },
    ],
    lore: { title:"The Garden of Echoes", text:"The Sky Garden grows on the compost of forgotten memories. Each flower is a moment that someone loved so deeply it refused to dissolve. They bloom upward, reaching for a sky they will never touch, because the reaching itself is the point." },
  },
  {
    id: 5,
    title: "The Return",
    subtitle: "Where all things converge",
    color: "#c4b5fd",
    islandId: "crystal",
    cameraPath: [[5,20,25],[3,12,15],[2,8,10],[0,6,5]],
    lookAtPath: [[0,-5,-20],[0,3,0],[0,2,0],[0,1,0]],
    ambientColor: "#c4b5fd",
    fogDensity: 0.01,
    beats: [
      { id:"r1", text:"The journey ends where it began.", subtitle:"But everything has changed. Including you.", duration:4500 },
      { id:"r2", text:"The crystals remember the spark. The spark remembers the Void.", subtitle:"And the Void remembers why it decided to begin.", duration:5000 },
      { id:"r3", text:"You are not a visitor here. You are the story itself.", subtitle:"Every island you touched, every note you placed, every crystal you found - that was you, writing yourself into existence.", duration:6000 },
      { id:"r4", text:"Drift is not a place. It is a state of becoming.", subtitle:"And it will be here, waiting, whenever you need to remember who you are.", duration:5000 },
    ],
    lore: { title:"The Return", text:"Drift was never meant to be explored. It was meant to be experienced. Every visitor who walks these floating paths adds their own chapter to the story. The islands shift and change based on who looks at them. You are not the same person who started this journey. Neither is Drift." },
  },
];

export const TOTAL_DURATION = CHAPTERS.reduce(
  (acc, ch) => acc + ch.beats.reduce((a, b) => a + b.duration, 0),
  0,
);
