export const DEFAULT_SHAPES = ["sun", "moon", "star"];
export const DEFAULT_COLORS = ["green", "purple", "orange"];
export const DEFAULT_BG_COLORS = ["red", "blue", "yellow"];

// Define color mappings for Tailwind/CSS
export const COLOR_MAP = {
  green: "#34D399", // Emerald 400
  purple: "#A78BFA", // Violet 400
  orange: "#FDBA74", // Orange 300
  red: "#F87171", // Red 400
  blue: "#60A5FA", // Blue 400
  yellow: "#FDE047", // Yellow 300
  cyan: "#22D3EE",   // Cyan 400
  pink: "#F472B6",   // Pink 400
  lime: "#A3E635",   // Lime 400
  gray: "#9CA3AF",   // Cool Gray 400
  teal: "#2DD4BF",   // Teal 400
  indigo: "#818CF8", // Indigo 400
};

export class Card {
  constructor(shape, color, backgroundColor) {
    this.id = `${shape}-${color}-${backgroundColor}`;
    this.shape = shape;
    this.color = color;
    this.backgroundColor = backgroundColor;
  }
}

export function generateDeck(shapes = DEFAULT_SHAPES, colors = DEFAULT_COLORS, bgColors = DEFAULT_BG_COLORS) {
  const deck = [];
  for (const shape of shapes) {
    for (const color of colors) {
      for (const bgColor of bgColors) {
        deck.push(new Card(shape, color, bgColor));
      }
    }
  }
  return deck;
}

export let ALL_CARDS = generateDeck(); // Default deck, will be updated by updateCardSet

export function updateCardSet(shapes, colors, bgColors) {
  ALL_CARDS = generateDeck(shapes, colors, bgColors);
  return ALL_CARDS;
}

export function is_hap(card1, card2, card3) {
  if (!card1 || !card2 || !card3) return false;
  const checkProperty = (prop) => {
    const val1 = card1[prop];
    const val2 = card2[prop];
    const val3 = card3[prop];
    const allSame = val1 === val2 && val2 === val3;
    const allDifferent = val1 !== val2 && val1 !== val3 && val2 !== val3;
    return allSame || allDifferent;
  };

  return (
    checkProperty("shape") &&
    checkProperty("color") &&
    checkProperty("backgroundColor")
  );
}

export function find_all_haps(cards) {
  const haps = [];
  const n = cards.length;
  if (n < 3) {
    return haps;
  }
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        if (is_hap(cards[i], cards[j], cards[k])) {
          haps.push([cards[i], cards[j], cards[k]]);
        }
      }
    }
  }
  return haps;
}

// Seedable pseudo-random number generator (LCG)
function createPrng(seed) {
  let currentSeed = seed;
  return function random() {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };
}

// Fisher-Yates shuffle algorithm, can be seeded
export function shuffleDeck(deck, seed) {
  const array = [...deck]; // Create a copy to avoid mutating the original deck
  let m = array.length, t, i;
  const random = seed !== undefined ? createPrng(seed) : Math.random;

  while (m) {
    i = Math.floor(random() * m--);
    t = array[m];
    array[m] = array[i];
    array[i] = t;
  }
  return array;
}

export const CARD_SETS = {
  default: {
    shapes: DEFAULT_SHAPES,
    colors: DEFAULT_COLORS,
    bgColors: DEFAULT_BG_COLORS,
    name: "Default (3x3x3)"
  },
  extended_shapes: {
    shapes: ["sun", "moon", "star", "heart"],
    colors: DEFAULT_COLORS,
    bgColors: DEFAULT_BG_COLORS,
    name: "Extended Shapes (4x3x3)"
  },
  extended_colors: {
    shapes: DEFAULT_SHAPES,
    colors: ["green", "purple", "orange", "cyan"],
    bgColors: DEFAULT_BG_COLORS,
    name: "Extended Colors (3x4x3)"
  },
  extended_bgColors: {
    shapes: DEFAULT_SHAPES,
    colors: DEFAULT_COLORS,
    bgColors: ["red", "blue", "yellow", "pink"],
    name: "Extended Backgrounds (3x3x4)"
  },
  mini_set: {
    shapes: ["sun", "moon"],
    colors: ["green", "purple"],
    bgColors: ["red", "blue"],
    name: "Mini Set (2x2x2)"
  }
};

// Function to get a seed based on the current date (YYYYMMDD format)
export function getDailySeed() {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return parseInt(`${year}${month}${day}`, 10);
}

