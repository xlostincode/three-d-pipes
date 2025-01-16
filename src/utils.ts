export function getRandomIntInRange(min: number, max: number) {
  const minCeiled = Math.ceil(min);
  const maxFloored = Math.floor(max);
  return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // The maximum is exclusive and the minimum is inclusive
}

export function pickRandomFromArray<T>(array: Array<T>) {
  const index = Math.floor(Math.random() * array.length);

  return array[index];
}
