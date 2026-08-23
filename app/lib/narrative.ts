export interface StoryBeat {
  id: string;
  text: string;
  subtitle?: string;
  duration: number;
  effect?: "glitch" | "pulse" | "fade" | "shatter" | "ripple" | "typewriter";
}

export interface StoryChoice {
  id: string;
  text: string;
  followUp: string;
  mood: "hope" | "loss" | "wonder" | "courage";
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
  choice?: StoryChoice;
  lore: { title: string; text: string };
  irlTheme: string;
}

export const CHAPTERS: Chapter[] = [
  {
    id: 1,
    title: "The Awakening",
    subtitle: "Where light first learned to dream",
    color: "#67e8f9",
    islandId: "crystal",
    cameraPath: [[30,25,40],[18,15,28],[10,8,16],[5,4,8],[2,3,5]],
    lookAtPath: [[0,-5,-20],[0,0,-10],[0,1,0],[1.5,2,0.5],[1.5,2,0.5]],
    ambientColor: "#67e8f9",
    fogDensity: 0.012,
    irlTheme: "The Big Bang - how everything began from nothing",
    beats: [
      { id:"a1", text:"Before time had a name,\nbefore space knew its own shape,", subtitle:"there was a silence so deep it hummed.", duration:5000, effect:"fade" },
      { id:"a2", text:"In that silence, something stirred.", subtitle:"Not a sound. Not a light. A intention.", duration:4500, effect:"pulse" },
      { id:"a3", text:"A single point of warmth\nin an infinite cold.", subtitle:"It did not explode. It remembered.", duration:5000, effect:"glitch" },
      { id:"a4", text:"And from that memory,\ncrystals erupted from the void -", subtitle:"each one a question the universe asked itself.", duration:5000, effect:"ripple" },
      { id:"a5", text:"What am I?\nWhat could I become?", subtitle:"The stones hummed the answer back.", duration:4500, effect:"typewriter" },
    ],
    choice: {
      id: "c1",
      text: "The spark hesitates. Do you let it burn, or let it fade?",
      followUp: "You chose to let it burn. Courage is the first element of creation.",
      mood: "courage",
    },
    lore: { title:"The First Spark", text:"The Void was not empty. It was full of things that had not yet happened. The first spark was not created - it was remembered. Something ancient, buried in the fabric of nothingness, decided it was time to begin again. The crystals that grew from its landing point are called Memory Stones. Each one contains a fragment of what was, and a seed of what could be." },
  },
  {
    id: 2,
    title: "The Growth",
    subtitle: "When the world learned to breathe",
    color: "#a78bfa",
    islandId: "mushroom",
    cameraPath: [[45,20,10],[42,12,-8],[40,8,-15],[38,5,-20],[37,4,-21]],
    lookAtPath: [[0,-5,-20],[35,0,-15],[35,2,-20],[37,3,-22],[37,3,-22]],
    ambientColor: "#a78bfa",
    fogDensity: 0.015,
    irlTheme: "Life on Earth - how nature found a way against all odds",
    beats: [
      { id:"g1", text:"Life did not ask permission.", subtitle:"It erupted from the cracks, wild and unwelcome.", duration:4500, effect:"pulse" },
      { id:"g2", text:"Fungal towers rose like cathedrals,\ntheir caps glowing with inner knowing.", subtitle:"They spoke in spores - a language older than words.", duration:5000, effect:"fade" },
      { id:"g3", text:"The grove became a library.\nEvery spore carried a story.", subtitle:"The air itself was made of whispered histories.", duration:5000, effect:"typewriter" },
      { id:"g4", text:"And somewhere in the canopy,\nthe first dreamer closed their eyes.", subtitle:"And saw everything that was to come.", duration:4500, effect:"glitch" },
      { id:"g5", text:"Growth is not gentle.\nIt tears through stone.", subtitle:"But what emerges is always more beautiful than what was broken.", duration:5000, effect:"ripple" },
    ],
    choice: {
      id: "c2",
      text: "A spore drifts toward you. Do you breathe it in, or let it pass?",
      followUp: "You breathed it in. Now you carry the memory of ten thousand years.",
      mood: "wonder",
    },
    lore: { title:"The Spore Library", text:"The Mushroom Grove is the oldest living archive in Drift. Each fungal tower stores centuries of memories in its rings. The spores they release are not seeds - they are stories, drifting on the wind, waiting for someone to breathe them in and remember." },
  },
  {
    id: 3,
    title: "The Connection",
    subtitle: "How孤独 became belonging",
    color: "#4ecdc4",
    islandId: "crystal",
    cameraPath: [[5,18,30],[3,12,20],[2,8,12],[1,5,8],[0,4,6]],
    lookAtPath: [[0,-5,-20],[0,1,-5],[0,2,0],[0,2,0],[0,2,0]],
    ambientColor: "#4ecdc4",
    fogDensity: 0.011,
    irlTheme: "Human connection - how we find each other in the dark",
    beats: [
      { id:"n1", text:"Between the crystals,\nlight began to find light.", subtitle:"Photons recognizing photons across the void.", duration:5000, effect:"ripple" },
      { id:"n2", text:"This is how the universe holds itself together.\nNot with gravity. With recognition.", subtitle:"The quiet knowing that you are not alone.", duration:5500, effect:"fade" },
      { id:"n3", text:"Every connection is a bridge\nbetween two infinities.", subtitle:"You are infinite. So is the person beside you.", duration:5000, effect:"typewriter" },
      { id:"n4", text:"The crystals hummed louder now.\nA chord. A harmony.", subtitle:"Multiple voices becoming one song.", duration:4500, effect:"pulse" },
    ],
    lore: { title:"The Resonance", text:"When two Memory Stones are placed close together, they begin to resonate. Their frequencies merge into something neither could produce alone. This phenomenon is called The Resonance, and it is the fundamental force that holds Drift together. Not gravity. Not magic. Connection." },
  },
  {
    id: 4,
    title: "The Forgetting",
    subtitle: "What remains when memory fades",
    color: "#fbbf24",
    islandId: "ruins",
    cameraPath: [[-20,15,-15],[-25,10,-22],[-28,6,-30],[-30,4,-35],[-31,3,-36]],
    lookAtPath: [[0,-5,-20],[-28,0,-28],[-30,1,-35],[-30,2,-35],[-30,2,-35]],
    ambientColor: "#fbbf24",
    fogDensity: 0.018,
    irlTheme: "Loss and grief - how we carry what we've lost",
    beats: [
      { id:"f1", text:"Not all things endure.\nSome are meant to crumble.", subtitle:"To teach us the shape of loss.", duration:5000, effect:"shatter" },
      { id:"f2", text:"The pillars stood for centuries,\nholding up a sky that forgot them.", subtitle:"Stone remembers longer than flesh.", duration:5000, effect:"fade" },
      { id:"f3", text:"In the ruins, echoes still bounce\nbetween broken walls.", subtitle:"Each echo is a conversation that never finished.", duration:5000, effect:"glitch" },
      { id:"f4", text:"But look closely -\nbetween the cracks, new light is growing.", subtitle:"Forgetting makes room for becoming.", duration:4500, effect:"pulse" },
      { id:"f5", text:"Grief is not the opposite of love.\nIt is love with nowhere to go.", subtitle:"And so it grows outward, like roots through stone.", duration:5500, effect:"typewriter" },
    ],
    choice: {
      id: "c3",
      text: "A pillar begins to fall. Do you catch it, or let it break?",
      followUp: "You let it break. Some things must fall so new things can rise.",
      mood: "loss",
    },
    lore: { title:"The Forgotten City", text:"The Ruins were once the capital of Drift - a civilization of memory-keepers who catalogued every moment of existence. When they discovered that some things are meant to be forgotten, their city began to dissolve. The pillars that remain are the last stubborn fragments of a people who chose to let go." },
  },
  {
    id: 5,
    title: "The Storm",
    subtitle: "When the sky turned against itself",
    color: "#ef4444",
    islandId: "ruins",
    cameraPath: [[-30,20,-35],[-32,12,-38],[-34,8,-40],[-35,6,-42],[-35,5,-42]],
    lookAtPath: [[0,-5,-20],[-32,0,-38],[-34,2,-42],[-35,3,-42],[-35,3,-42]],
    ambientColor: "#ef4444",
    fogDensity: 0.022,
    irlTheme: "Conflict and chaos - how destruction precedes transformation",
    beats: [
      { id:"s1", text:"The sky cracked open.\nNot with thunder - with truth.", subtitle:"Some truths are too heavy for the air to hold.", duration:5000, effect:"glitch" },
      { id:"s2", text:"Lightning carved new rivers\nthrough the stone.", subtitle:"Each strike a question: what are you willing to lose?", duration:5000, effect:"shatter" },
      { id:"s3", text:"The ruins shook.\nThe mushrooms bent.\nThe crystals sang louder.", subtitle:"Everything was breaking. Everything was beginning.", duration:5500, effect:"pulse" },
      { id:"s4", text:"In the eye of the storm,\na single flower bloomed.", subtitle:"Calm is not the absence of chaos. It is the center of it.", duration:5000, effect:"ripple" },
      { id:"s5", text:"Destruction is not the end.\nIt is the universe clearing its throat.", subtitle:"Preparing to say something important.", duration:5000, effect:"typewriter" },
    ],
    lore: { title:"The Great Unraveling", text:"Every few centuries, Drift experiences The Great Unraveling - a storm that tears through all four islands simultaneously. It is not destructive. It is digestive. The storm breaks down what has become too rigid, too fixed, too afraid to change. What remains is always stronger, always more alive." },
  },
  {
    id: 6,
    title: "The Becoming",
    subtitle: "Where endings learn to bloom",
    color: "#f472b6",
    islandId: "garden",
    cameraPath: [[25,10,-35],[20,6,-42],[18,4,-48],[16,3,-50],[15,3,-51]],
    lookAtPath: [[0,-5,-20],[16,0,-45],[15,1,-50],[15,2,-50],[15,2,-50]],
    ambientColor: "#f472b6",
    fogDensity: 0.014,
    irlTheme: "Rebirth and renewal - how beauty emerges from broken places",
    beats: [
      { id:"b1", text:"After the storm comes the garden.\nWhere fallen memories take root.", subtitle:"And bloom into something new.", duration:5000, effect:"ripple" },
      { id:"b2", text:"Each petal is a story\nthat refused to end.", subtitle:"They drift upward, defying gravity, defying finality.", duration:5000, effect:"fade" },
      { id:"b3", text:"The garden does not grow from soil.\nIt grows from longing.", subtitle:"From the quiet ache of things half-remembered.", duration:5000, effect:"typewriter" },
      { id:"b4", text:"And in the center,\na single flower waits.", subtitle:"It has been waiting since before the beginning.", duration:4500, effect:"pulse" },
      { id:"b5", text:"You are not broken.\nYou are becoming.", subtitle:"Every crack is a door. Every ending is a seed.", duration:5000, effect:"glitch" },
    ],
    choice: {
      id: "c4",
      text: "The flower opens. Do you step through, or stay and watch?",
      followUp: "You stepped through. On the other side is everything you were afraid to want.",
      mood: "hope",
    },
    lore: { title:"The Garden of Echoes", text:"The Sky Garden grows on the compost of forgotten memories. Each flower is a moment that someone loved so deeply it refused to dissolve. They bloom upward, reaching for a sky they will never touch, because the reaching itself is the point." },
  },
  {
    id: 7,
    title: "The Understanding",
    subtitle: "What the islands have been trying to tell you",
    color: "#c084fc",
    islandId: "mushroom",
    cameraPath: [[37,15,-20],[36,10,-21],[35,7,-22],[35,5,-22],[35,4,-22]],
    lookAtPath: [[0,-5,-20],[35,0,-22],[35,2,-22],[35,3,-22],[35,3,-22]],
    ambientColor: "#c084fc",
    fogDensity: 0.013,
    irlTheme: "Wisdom - the patterns that connect all living things",
    beats: [
      { id:"u1", text:"The islands are not separate.\nThey never were.", subtitle:"They are four faces of the same thought.", duration:5000, effect:"pulse" },
      { id:"u2", text:"Crystal. Mushroom. Ruin. Garden.\nBirth. Growth. Loss. Renewal.", subtitle:"The cycle does not end. It spirals.", duration:5500, effect:"ripple" },
      { id:"u3", text:"You have walked through all of them.\nYou carry all of them now.", subtitle:"You are not who you were when you arrived.", duration:5000, effect:"glitch" },
      { id:"u4", text:"This is what the universe has been\ntrying to tell you:", subtitle:"You are the story it is telling.", duration:5000, effect:"typewriter" },
    ],
    lore: { title:"The Spiral Path", text:"Drift is not a destination. It is a spiral. Every visitor who walks its paths adds their own loop to the pattern. The islands shift and change not because they are unstable, but because they are alive. They remember everyone who has ever touched them, and they become something new because of it." },
  },
  {
    id: 8,
    title: "The Return",
    subtitle: "Where all things converge",
    color: "#e2e8f0",
    islandId: "crystal",
    cameraPath: [[5,20,25],[3,14,15],[2,10,10],[1,7,6],[0,5,3]],
    lookAtPath: [[0,-5,-20],[0,1,-5],[0,2,0],[0,2,0],[0,1,0]],
    ambientColor: "#e2e8f0",
    fogDensity: 0.008,
    irlTheme: "Legacy - what we leave behind for those who come after",
    beats: [
      { id:"r1", text:"The journey ends where it began.\nBut everything has changed.", subtitle:"Including you.", duration:5000, effect:"fade" },
      { id:"r2", text:"The crystals remember the spark.\nThe spark remembers the Void.", subtitle:"And the Void remembers why it decided to begin.", duration:5500, effect:"pulse" },
      { id:"r3", text:"You are not a visitor here.\nYou are the story itself.", subtitle:"Every island you touched, every note you placed - that was you, writing yourself into existence.", duration:6000, effect:"typewriter" },
      { id:"r4", text:"Drift is not a place.\nIt is a state of becoming.", subtitle:"And it will be here, waiting, whenever you need to remember who you are.", duration:5500, effect:"ripple" },
      { id:"r5", text:"Go now.\nCarry the light.", subtitle:"The universe is waiting to see what you become next.", duration:5000, effect:"glitch" },
    ],
    lore: { title:"The Return", text:"Drift was never meant to be explored. It was meant to be experienced. Every visitor who walks these floating paths adds their own chapter to the story. The islands shift and change based on who looks at them. You are not the same person who started this journey. Neither is Drift." },
  },
];

export const TOTAL_DURATION = CHAPTERS.reduce(
  (acc, ch) => acc + ch.beats.reduce((a, b) => a + b.duration, 0),
  0,
);
