import { SeededRandomNumberGenerator } from "./rng";

export function getRandomIntInRange(
  min: number,
  max: number,
  rng: SeededRandomNumberGenerator
) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(rng.next() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

export function pickRandomFromArray<T>(
  array: Array<T>,
  rng: SeededRandomNumberGenerator
) {
  const index = Math.floor(rng.next() * array.length);

  return array[index];
}
