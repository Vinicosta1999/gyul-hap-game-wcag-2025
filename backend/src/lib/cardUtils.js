const DEFAULT_SHAPES = ["sun", "moon", "star"];
const DEFAULT_COLORS = ["green", "purple", "orange"];
const DEFAULT_BG_COLORS = ["red", "blue", "yellow"];

const COLOR_MAP = {
  green: "#34D399",
  purple: "#A78BFA",
  orange: "#FDBA74",
  red: "#F87171",
  blue: "#60A5FA",
  yellow: "#FDE047",
  cyan: "#22D3EE",
  pink: "#F472B6",
  lime: "#A3E635",
  gray: "#9CA3AF",
  teal: "#2DD4BF",
  indigo: "#818CF8",
};

class Card {
  constructor(shape, color, backgroundColor) {
    this.id = `${shape}-${color}-${backgroundColor}`;
    this.shape = shape;
    this.color = color;
    this.backgroundColor = backgroundColor;
  }
}

function generateDeck(shapes = DEFAULT_SHAPES, colors = DEFAULT_COLORS, bgColors = DEFAULT_BG_COLORS) {
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

let ALL_CARDS = generateDeck();

function updateCardSet(shapes, colors, bgColors) {
  ALL_CARDS = generateDeck(shapes, colors, bgColors);
  return ALL_CARDS;
}

function is_hap(card1, card2, card3) {
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

function find_all_haps(cards) {
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

function createPrng(seed) {
  let currentSeed = seed;
  return function random() {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };
}

function shuffleDeck(deck, seed) {
  const array = [...deck];
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

const CARD_SETS = {
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

function getDailySeed() {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return parseInt(`${year}${month}${day}`, 10);
}

module.exports = {
    DEFAULT_SHAPES,
    DEFAULT_COLORS,
    DEFAULT_BG_COLORS,
    COLOR_MAP,
    Card,
    generateDeck,
    ALL_CARDS, // Note: This will be the initial state of ALL_CARDS when required.
    updateCardSet, // This function can modify the ALL_CARDS in this module's scope.
    is_hap,
    find_all_haps,
    shuffleDeck,
    CARD_SETS,
    getDailySeed,
    // createPrng is not exported as it's a helper for shuffleDeck
};
