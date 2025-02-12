import * as THREE from "three";

const searchParams = new URLSearchParams(window.location.search);

const getBoundsFromParams = () => {
  const defaultBounds = {
    x: 25,
    y: 25,
    z: 25,
  };

  const boundsStr = searchParams.get("b");

  const bounds = boundsStr?.split(",").map((value) => parseInt(value));

  if (!bounds) {
    return defaultBounds;
  }

  if (bounds.length !== 3) {
    return defaultBounds;
  }

  bounds.forEach((value, index, array) => {
    if (value < 5) {
      array[index] = 5;
    } else if (value > 50) {
      array[index] = 50;
    }
  });

  return {
    x: bounds[0],
    y: bounds[1],
    z: bounds[2],
  };
};

const getPipeCountFromParams = () => {
  const defaultPipeCount = 10;

  const pipeCountStr = searchParams.get("pc");

  if (!pipeCountStr) {
    return defaultPipeCount;
  }

  const pipeCount = parseInt(pipeCountStr);

  if (!pipeCount || pipeCount < 0 || pipeCount > 50) {
    return defaultPipeCount;
  }

  return pipeCount;
};

const getPipeLengthFromParams = () => {
  const defaultPipeLength = 200;

  const pipeLengthStr = searchParams.get("pl");

  if (!pipeLengthStr) {
    return defaultPipeLength;
  }

  const pipeLength = parseInt(pipeLengthStr);

  if (!pipeLength || pipeLength < 2 || pipeLength > 1000) {
    return defaultPipeLength;
  }

  return pipeLength;
};

const getTurnRandomnessFromParams = () => {
  const defaultTurnRandomness = 0.25;

  const turnRandomnessStr = searchParams.get("tr");

  if (!turnRandomnessStr) {
    return defaultTurnRandomness;
  }

  const turnRandomness = parseFloat(turnRandomnessStr);

  if (!turnRandomness || turnRandomness < 0 || turnRandomness > 1) {
    return defaultTurnRandomness;
  }

  return turnRandomness;
};

export const DEFAULT_PARAMS = {
  bounds: getBoundsFromParams(),
  pipeCount: getPipeCountFromParams(),
  pipeLength: getPipeLengthFromParams(),
  pipeTurnRandomness: getTurnRandomnessFromParams(),
  seed: searchParams.get("seed") || "lost-in-code",
  randomizeSeed: true,
};

export const DIRECTION_MAP = {
  FORWARD: new THREE.Vector3(-1, 0, 0),
  BACKWARD: new THREE.Vector3(1, 0, 0),
  LEFT: new THREE.Vector3(0, 0, 1),
  RIGHT: new THREE.Vector3(0, 0, -1),
  UP: new THREE.Vector3(0, 1, 0),
  DOWN: new THREE.Vector3(0, -1, 0),
};

export const DIRECTION_LIST = Object.values(DIRECTION_MAP);

export const COLOR_MAP = {
  RED: new THREE.Color("#FF4D4D"),
  GREEN: new THREE.Color("#4CD964"),
  BLUE: new THREE.Color("#4DCFFF"),
  YELLOW: new THREE.Color("#FFDA3A"),
  CYAN: new THREE.Color("#3DEDF1"),
  MAGENTA: new THREE.Color("#FF6FB3"),
  ORANGE: new THREE.Color("#FF914D"),
  PURPLE: new THREE.Color("#A84DFF"),
  LIME: new THREE.Color("#B8FF36"),
  TEAL: new THREE.Color("#2FE2AA"),
  PINK: new THREE.Color("#FF85D1"),
  BROWN: new THREE.Color("#C8804F"),
  GOLD: new THREE.Color("#FFBB2D"),
  SILVER: new THREE.Color("#C4C4C4"),
  TURQUOISE: new THREE.Color("#2EF1C4"),
  VIOLET: new THREE.Color("#BF57FF"),
  INDIGO: new THREE.Color("#8C4DFF"),
  CRIMSON: new THREE.Color("#FF4A5A"),
  SALMON: new THREE.Color("#FF8D6D"),
  CHOCOLATE: new THREE.Color("#D0723A"),
  CORAL: new THREE.Color("#FF715C"),
  KHAKI: new THREE.Color("#E2C341"),
  PLUM: new THREE.Color("#D652D9"),
  OLIVE: new THREE.Color("#A5CF2A"),
  MAROON: new THREE.Color("#C74154"),
  NAVY: new THREE.Color("#496EFF"),
  BEIGE: new THREE.Color("#FFD9A1"),
  AQUA: new THREE.Color("#36F0EE"),
  FUCHSIA: new THREE.Color("#FF5DAE"),
  SANDY_BROWN: new THREE.Color("#EA9D5C"),
  ROYAL_BLUE: new THREE.Color("#6289FF"),
  SPRING_GREEN: new THREE.Color("#54F268"),
  HOT_PINK: new THREE.Color("#FF4BAA"),
  DEEP_SKY_BLUE: new THREE.Color("#38D5FF"),
  LAVENDER: new THREE.Color("#CBA1FF"),
  SEA_GREEN: new THREE.Color("#3ECF84"),
  MINT: new THREE.Color("#A8F278"),
  PEACH: new THREE.Color("#FFC075"),
  SKY_BLUE: new THREE.Color("#5CB9FF"),
  MIDNIGHT_BLUE: new THREE.Color("#4967CF"),
  LIGHT_CORAL: new THREE.Color("#FF5A5A"),
  MEDIUM_SLATE_BLUE: new THREE.Color("#815CFF"),
  PERIWINKLE: new THREE.Color("#98A9FF"),
  LIGHT_GREEN: new THREE.Color("#8BEE5E"),
  DARK_ORANGE: new THREE.Color("#FF8000"),
  TOMATO: new THREE.Color("#FF5C4D"),
  DODGER_BLUE: new THREE.Color("#4C98FF"),
  GOLDENROD: new THREE.Color("#F29B33"),
  SLATE_GRAY: new THREE.Color("#7E93B3"),
  LIGHT_SEA_GREEN: new THREE.Color("#2FE19A"),
  APPLE_GREEN: new THREE.Color("#69E760"),
  CREAM: new THREE.Color("#FFF2B3"),
  LILAC: new THREE.Color("#D9B3FF"),
  BRIGHT_AQUA: new THREE.Color("#2FF2E6"),
  ROSE: new THREE.Color("#FF7997"),
  APRICOT: new THREE.Color("#FFC58A"),
  WISTERIA: new THREE.Color("#A67FFF"),
  JADE: new THREE.Color("#3FF295"),
  SUNFLOWER: new THREE.Color("#FFD94C"),
  FLAMINGO: new THREE.Color("#FF6D71"),
  CERULEAN: new THREE.Color("#5DD9FF"),
  CHARTREUSE: new THREE.Color("#A8FF2F"),
  BUBBLEGUM: new THREE.Color("#FF6FCA"),
  POWDER_BLUE: new THREE.Color("#A8DFFF"),
  LEMON: new THREE.Color("#FFF44C"),
  BLUSH: new THREE.Color("#FF88A8"),
  AMBER: new THREE.Color("#FFC047"),
  EMERALD: new THREE.Color("#4CDB71"),
  SAPPHIRE: new THREE.Color("#4D89FF"),
  ORCHID: new THREE.Color("#D982FF"),
  MANGO: new THREE.Color("#FFA94C"),
  HONEY: new THREE.Color("#FFCD66"),
  SKY_LILAC: new THREE.Color("#BAAFFF"),
  TANGERINE: new THREE.Color("#FF854D"),
  COTTON_CANDY: new THREE.Color("#FFA3D9"),
  BANANA: new THREE.Color("#FFED66"),
  AZURE: new THREE.Color("#69CFFF"),
  PASTEL_RED: new THREE.Color("#FF7070"),
  PASTEL_GREEN: new THREE.Color("#66E47A"),
  PASTEL_BLUE: new THREE.Color("#66D9FF"),
  SUNSET: new THREE.Color("#FF9470"),
  MOCHA: new THREE.Color("#C4884F"),
  MULBERRY: new THREE.Color("#A74D8C"),
  ICE_BLUE: new THREE.Color("#66F0FF"),
  PEAR: new THREE.Color("#CFFF4D"),
  RUBY: new THREE.Color("#FF5470"),
  BUTTERSCOTCH: new THREE.Color("#FFB366"),
  SPRUCE: new THREE.Color("#57C68C"),
  FOG: new THREE.Color("#A6B8C9"),
  SEASHELL: new THREE.Color("#FFE7C7"),
  TULIP: new THREE.Color("#FF698C"),
  NEON_GREEN: new THREE.Color("#57FF5A"),
  CARNATION: new THREE.Color("#FF8CA8"),
  COBALT: new THREE.Color("#3A79FF"),
  PAPAYA: new THREE.Color("#FFA859"),
  RASPBERRY: new THREE.Color("#E14D85"),
  PISTACHIO: new THREE.Color("#A4E47A"),
  OPAL: new THREE.Color("#69F3E8"),
  CORNFLOWER: new THREE.Color("#709BFF"),
  TROPICAL_BLUE: new THREE.Color("#73D3FF"),
};

export const COLOR_LIST = Object.values(COLOR_MAP);
