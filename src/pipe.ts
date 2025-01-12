import * as THREE from "three";
import { DIRECTION_LIST } from "./const";

export const createPipe = (start: THREE.Vector3, length: number) => {
  const directions: THREE.Vector3[] = [];

  const doesNegateDirection = (
    vector1: THREE.Vector3,
    vector2: THREE.Vector3
  ) => {
    return (
      vector1.x + vector2.x === 0 &&
      vector1.y + vector2.y === 0 &&
      vector1.z + vector2.z === 0
    );
  };

  for (let index = 0; index < length; index++) {
    let randomIndex = Math.floor(Math.random() * DIRECTION_LIST.length);
    let nextDirection = DIRECTION_LIST[randomIndex];

    if (index === 0) {
      directions.push(nextDirection);
    } else {
      const previousDirection = directions[index - 1];

      while (doesNegateDirection(previousDirection, nextDirection)) {
        randomIndex = Math.floor(Math.random() * DIRECTION_LIST.length);
        nextDirection = DIRECTION_LIST[randomIndex];
      }

      directions.push(nextDirection);
    }
  }

  const pipe = [
    {
      position: start,
      isOverlapping: false,
    },
  ];

  const existingPositions = new Set();

  for (let index = 1; index < directions.length; index++) {
    const previousSegment = pipe[index - 1].position.clone();
    const nextDirection = directions[index].clone();

    const segmentPosition = previousSegment.add(nextDirection);

    const positionKey = `${segmentPosition.x},${segmentPosition.y},${segmentPosition.z},`;
    const isOverlapping = existingPositions.has(positionKey);

    pipe.push({
      position: segmentPosition,
      isOverlapping: isOverlapping,
    });

    existingPositions.add(positionKey);
  }

  return pipe;
};
