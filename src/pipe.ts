import * as THREE from "three";
import { DIRECTION_LIST } from "./const";

const createPositionKey = (position: THREE.Vector3) =>
  `${position.x},${position.y},${position.z},`;

const doesOverlap = (position: THREE.Vector3, positions: Set<any>) => {
  const key = createPositionKey(position);
  return positions.has(key);
};

type PipeSegment = {
  position: THREE.Vector3;
  direction: THREE.Vector3 | null;
  isOverlapping: boolean;
};

export const createPipe = (start: THREE.Vector3, length: number) => {
  const pipe: PipeSegment[] = [
    {
      position: start,
      direction: null,
      isOverlapping: false,
    },
  ];

  const existingSegmentPositions = new Set();

  for (let index = 1; index < length; index++) {
    const previousSegment = pipe[index - 1];
    const previousSegmentPosition = previousSegment.position.clone();

    // Preserve the direction
    if (Math.random() > 0.5 && previousSegment.direction) {
      const nextDirection = previousSegment.direction.clone();
      const segmentPosition = previousSegmentPosition
        .clone()
        .add(nextDirection);

      const segment = {
        position: segmentPosition,
        direction: nextDirection,
        isOverlapping: false,
      };

      pipe.push(segment);
      existingSegmentPositions.add(createPositionKey(segmentPosition));
      continue;
    }

    const possibleDirections = [...DIRECTION_LIST];
    let randomIndex = Math.floor(Math.random() * possibleDirections.length);

    let nextDirection = possibleDirections.splice(randomIndex, 1)[0];
    let segmentPosition = previousSegmentPosition.add(nextDirection);

    let _doesOverlap = doesOverlap(segmentPosition, existingSegmentPositions);

    // Can this get stuck?
    while (_doesOverlap && possibleDirections.length) {
      randomIndex = Math.floor(Math.random() * possibleDirections.length);
      nextDirection = possibleDirections.splice(randomIndex, 1)[0];
      segmentPosition = previousSegmentPosition.clone().add(nextDirection);

      _doesOverlap = doesOverlap(segmentPosition, existingSegmentPositions);
    }

    if (_doesOverlap && possibleDirections.length) {
      console.error("Generation stuck. Exiting.");
      break;
    }

    const segment: PipeSegment = {
      position: segmentPosition,
      direction: nextDirection,
      isOverlapping: false,
    };

    existingSegmentPositions.add(createPositionKey(segment.position));
    pipe.push(segment);
  }

  return pipe;
};
