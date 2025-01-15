import * as THREE from "three";
import { DIRECTION_LIST, DIRECTION_MAP } from "./const";

type PipeSegment = {
  position: THREE.Vector3;
  direction: THREE.Vector3 | null;
  isOverlapping: boolean;
};

const createPositionKey = (position: THREE.Vector3) =>
  `${position.x},${position.y},${position.z},`;

const doesOverlap = (position: THREE.Vector3, positions: Set<any>) => {
  const key = createPositionKey(position);
  return positions.has(key);
};

const doesExceedBounds = (position: THREE.Vector3, boundingBox: THREE.Box3) => {
  return !boundingBox.containsPoint(position);
};

export const createPipe = (
  start: THREE.Vector3,
  length: number,
  boundingBox: THREE.Box3
) => {
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

      let _doesOverlap = doesOverlap(segmentPosition, existingSegmentPositions);
      let _doesExceedBounds = doesExceedBounds(segmentPosition, boundingBox);

      if (!_doesOverlap && !_doesExceedBounds) {
        const segment = {
          position: segmentPosition,
          direction: nextDirection,
          isOverlapping: false,
        };

        pipe.push(segment);
        existingSegmentPositions.add(createPositionKey(segmentPosition));
        continue;
      }
    }

    const possibleDirections = [...DIRECTION_LIST];
    let randomIndex = Math.floor(Math.random() * possibleDirections.length);

    let nextDirection = possibleDirections.splice(randomIndex, 1)[0];
    let segmentPosition = previousSegmentPosition.clone().add(nextDirection);

    let _doesOverlap = doesOverlap(segmentPosition, existingSegmentPositions);
    let _doesExceedBounds = doesExceedBounds(segmentPosition, boundingBox);

    while ((_doesOverlap || _doesExceedBounds) && possibleDirections.length) {
      randomIndex = Math.floor(Math.random() * possibleDirections.length);
      nextDirection = possibleDirections.splice(randomIndex, 1)[0];
      segmentPosition = previousSegmentPosition.clone().add(nextDirection);

      _doesOverlap = doesOverlap(segmentPosition, existingSegmentPositions);
      _doesExceedBounds = doesExceedBounds(segmentPosition, boundingBox);
    }

    // Dead end
    if (
      (_doesOverlap || _doesExceedBounds) &&
      possibleDirections.length === 0
    ) {
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

  // Starting point has no direction so just copy the one from the next segment
  pipe[0].direction = pipe[1].direction;
  return pipe;
};

export class PipeRenderer {
  private index: number;
  private pipe: PipeSegment[];
  private scene: THREE.Scene;
  private pipeGeometry: THREE.CylinderGeometry;
  private pipeMaterial: THREE.MeshBasicMaterial;

  constructor(pipe: PipeSegment[], scene: THREE.Scene) {
    this.index = 0;
    this.pipe = pipe;
    this.scene = scene;

    this.pipeGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1);
    this.pipeMaterial = new THREE.MeshBasicMaterial({
      color: "#84cc16",
      transparent: true,
      opacity: 0.5,
    });
  }

  renderPipeSegment() {
    if (this.index >= this.pipe.length) {
      return;
    }

    const segment = this.pipe[this.index];
    const segmentDirection = segment.direction;

    const pipeSegmentMesh = new THREE.Mesh(
      this.pipeGeometry,
      this.pipeMaterial
    );

    if (segmentDirection) {
      if (
        segmentDirection.equals(DIRECTION_MAP.UP) ||
        segmentDirection.equals(DIRECTION_MAP.DOWN)
      ) {
        pipeSegmentMesh.rotation.set(0, Math.PI * 0.5, 0);
      }

      if (
        segmentDirection.equals(DIRECTION_MAP.LEFT) ||
        segmentDirection.equals(DIRECTION_MAP.RIGHT)
      ) {
        pipeSegmentMesh.rotation.set(Math.PI * 0.5, 0, 0);
      }

      if (
        segmentDirection.equals(DIRECTION_MAP.FORWARD) ||
        segmentDirection.equals(DIRECTION_MAP.BACKWARD)
      ) {
        pipeSegmentMesh.rotation.set(0, 0, Math.PI * 0.5);
      }
    }

    pipeSegmentMesh.position.copy(segment.position);

    this.scene.add(pipeSegmentMesh);
    this.index++;
  }
}
