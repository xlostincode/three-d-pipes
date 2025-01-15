import * as THREE from "three";
import { DIRECTION_LIST, DIRECTION_MAP } from "./const";

type PipeSegment = {
  position: THREE.Vector3;
  direction: THREE.Vector3;
};

type PipeSegmentWithNullableDirection = {
  position: THREE.Vector3;
  direction: THREE.Vector3 | null;
};

const getRotationFromDirection = (direction: THREE.Vector3) => {
  if (
    direction.equals(DIRECTION_MAP.UP) ||
    direction.equals(DIRECTION_MAP.DOWN)
  ) {
    return new THREE.Euler(0, Math.PI * 0.5, 0);
  }

  if (
    direction.equals(DIRECTION_MAP.LEFT) ||
    direction.equals(DIRECTION_MAP.RIGHT)
  ) {
    return new THREE.Euler(Math.PI * 0.5, 0, 0);
  }

  if (
    direction.equals(DIRECTION_MAP.FORWARD) ||
    direction.equals(DIRECTION_MAP.BACKWARD)
  ) {
    return new THREE.Euler(0, 0, Math.PI * 0.5);
  }

  return new THREE.Euler(0, 0, 0);
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
  const pipe: PipeSegmentWithNullableDirection[] = [
    {
      position: start,
      direction: null,
    },
  ];

  const existingSegmentPositions = new Set();
  existingSegmentPositions.add(createPositionKey(start));

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
    };

    existingSegmentPositions.add(createPositionKey(segment.position));
    pipe.push(segment);
  }

  // Starting segment has no direction so just copy the one from the next segment
  pipe[0].direction = pipe[1].direction;
  return pipe as PipeSegment[];
};

export class PipeRenderer {
  private index: number;
  private pipe: PipeSegment[];
  private scene: THREE.Scene;

  private pipeRadius: number;
  private pipeGeometry: THREE.CylinderGeometry;
  private pipeMaterial: THREE.MeshBasicMaterial;

  private jointBallRadius: number;
  private jointBallGeometry: THREE.SphereGeometry;
  private jointPipeGeometry: THREE.CylinderGeometry;

  constructor(pipe: PipeSegment[], scene: THREE.Scene) {
    this.index = 0;
    this.pipe = pipe;
    this.scene = scene;

    this.pipeRadius = 0.2;
    this.jointBallRadius = 0.3;

    this.pipeGeometry = new THREE.CylinderGeometry(
      this.pipeRadius,
      this.pipeRadius,
      1
    );
    this.pipeMaterial = new THREE.MeshBasicMaterial({
      color: "#84cc16",
      transparent: true,
      opacity: 0.5,
    });

    this.jointBallGeometry = new THREE.SphereGeometry(
      this.jointBallRadius,
      16,
      16
    );
    this.jointPipeGeometry = new THREE.CylinderGeometry(
      this.pipeRadius,
      this.pipeRadius,
      0.5
    );
  }

  renderPipeSegment() {
    if (this.index >= this.pipe.length) {
      return;
    }

    const previousSegment = this.pipe.at(this.index - 1);
    const segment = this.pipe[this.index];
    const nextSegment = this.pipe.at(this.index + 1);

    const previousSegmentDirection = previousSegment?.direction;
    const segmentDirection = segment.direction;
    const nextSegmentDirection = nextSegment?.direction;

    if (
      previousSegmentDirection &&
      nextSegmentDirection &&
      !segment.direction.equals(nextSegmentDirection)
    ) {
      if (!segment.direction.equals(nextSegmentDirection)) {
        const jointBallMesh = new THREE.Mesh(
          this.jointBallGeometry,
          this.pipeMaterial
        );

        const jointPipeOneMesh = new THREE.Mesh(
          this.jointPipeGeometry,
          this.pipeMaterial
        );

        const jointPipeTwoMesh = new THREE.Mesh(
          this.jointPipeGeometry,
          this.pipeMaterial
        );

        jointBallMesh.position.copy(segment.position);

        jointPipeOneMesh.position.copy(segment.position);
        jointPipeTwoMesh.position.copy(segment.position);

        jointPipeOneMesh.rotation.copy(
          getRotationFromDirection(previousSegmentDirection)
        );

        jointPipeOneMesh.position.multiply(
          previousSegmentDirection
            .clone()
            .multiply(new THREE.Vector3(0.5, 0.5, 0.5))
        );

        jointPipeTwoMesh.rotation.copy(
          getRotationFromDirection(nextSegmentDirection)
        );

        this.scene.add(jointPipeOneMesh, jointPipeTwoMesh);
      }
    } else {
      const pipeSegmentMesh = new THREE.Mesh(
        this.pipeGeometry,
        this.pipeMaterial
      );

      const rotation = getRotationFromDirection(segmentDirection);
      pipeSegmentMesh.rotation.copy(rotation);

      pipeSegmentMesh.position.copy(segment.position);

      this.scene.add(pipeSegmentMesh);
    }

    this.index++;
  }
}
