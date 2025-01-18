import { seededRandom } from "three/src/math/MathUtils.js";

function stringToInt(str: string) {
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }

  return Math.abs(hash);
}

export class SeededRandomNumberGenerator {
  private _originalSeed: number;
  private _seed: number;

  constructor(seed: string) {
    this._originalSeed = stringToInt(seed);
    this._seed = this._originalSeed;
  }

  next() {
    return seededRandom(this._seed++);
  }

  reset() {
    this._seed = this._originalSeed;
  }

  setSeed(seed: string) {
    this._seed = stringToInt(seed);
  }
}
