import * as THREE from "three";
import { COLOR_LIST, DIRECTION_LIST, DIRECTION_MAP } from "./const";
import { getRandomIntInRange, pickRandomFromArray } from "./utils";
import { SeededRandomNumberGenerator } from "./rng";

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
  boundingBox: THREE.Box3,
  turnRandomness: number = 0.5,
  rng: SeededRandomNumberGenerator,
  initialExistingPositions?: Set<string>
) => {
  const pipe: PipeSegmentWithNullableDirection[] = [
    {
      position: start,
      direction: null,
    },
  ];

  const existingSegmentPositions = new Set();
  existingSegmentPositions.add(createPositionKey(start));

  if (initialExistingPositions) {
    initialExistingPositions.forEach((position) =>
      existingSegmentPositions.add(position)
    );
  }

  for (let index = 1; index < length; index++) {
    const previousSegment = pipe[index - 1];
    const previousSegmentPosition = previousSegment.position.clone();

    // Preserve the direction
    if (rng.next() > turnRandomness && previousSegment.direction) {
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
    let randomIndex = Math.floor(rng.next() * possibleDirections.length);

    let nextDirection = possibleDirections.splice(randomIndex, 1)[0];
    let segmentPosition = previousSegmentPosition.clone().add(nextDirection);

    let _doesOverlap = doesOverlap(segmentPosition, existingSegmentPositions);
    let _doesExceedBounds = doesExceedBounds(segmentPosition, boundingBox);

    while ((_doesOverlap || _doesExceedBounds) && possibleDirections.length) {
      randomIndex = Math.floor(rng.next() * possibleDirections.length);
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

export const createPipes = (
  count: number,
  length: number,
  boundingBox: THREE.Box3,
  turnRandomness: number = 0.5,
  rng: SeededRandomNumberGenerator
) => {
  console.log(count, length);
  const existingSegmentPositions = new Set<string>();

  const pipes: PipeSegment[][] = [];

  let index = 0;
  while (index < count) {
    const x = getRandomIntInRange(boundingBox.min.x, boundingBox.max.x, rng);
    const y = getRandomIntInRange(boundingBox.min.y, boundingBox.max.y, rng);
    const z = getRandomIntInRange(boundingBox.min.z, boundingBox.max.z, rng);

    const startingPosition = new THREE.Vector3(x, y, z);

    if (!existingSegmentPositions.has(createPositionKey(startingPosition))) {
      const pipe = createPipe(
        startingPosition,
        length,
        boundingBox,
        turnRandomness,
        rng,
        existingSegmentPositions
      );

      pipe.forEach((segment) =>
        existingSegmentPositions.add(createPositionKey(segment.position))
      );

      pipes.push(pipe);

      index++;
    }
  }

  return pipes;
};

export class PipeRenderer {
  private currentSegmentIndex: number;
  private pipes: PipeSegment[][];
  private scene: THREE.Scene;

  private pipeRadius: number;
  private pipeGeometry: THREE.CylinderGeometry;
  private pipeMaterials: THREE.MeshPhongMaterial[];

  private jointBallRadius: number;
  private jointBallGeometry: THREE.SphereGeometry;
  private jointPipeGeometry: THREE.CylinderGeometry;

  private _meshes: THREE.Mesh[];
  private _longestPipeLength: number;

  constructor(
    pipes: PipeSegment[][],
    scene: THREE.Scene,
    rng: SeededRandomNumberGenerator
  ) {
    this.currentSegmentIndex = 0;
    this.pipes = pipes;
    this.scene = scene;

    this.pipeRadius = 0.2;
    this.jointBallRadius = 0.3;

    this.pipeGeometry = new THREE.CylinderGeometry(
      this.pipeRadius,
      this.pipeRadius,
      1
    );
    this.pipeMaterials = pipes.map(
      (_) =>
        new THREE.MeshPhongMaterial({
          color: pickRandomFromArray(COLOR_LIST, rng),
        })
    );

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

    this._meshes = [];
    this._longestPipeLength = Math.max(...pipes.map((pipe) => pipe.length));
  }

  renderNextSegments() {
    if (this.currentSegmentIndex >= this._longestPipeLength) {
      return;
    }

    for (let pipeIndex = 0; pipeIndex < this.pipes.length; pipeIndex++) {
      const segment = this.pipes[pipeIndex].at(this.currentSegmentIndex);

      if (!segment) {
        continue;
      }

      const nextSegment = this.pipes[pipeIndex].at(
        this.currentSegmentIndex + 1
      );

      const segmentDirection = segment.direction;
      const nextSegmentDirection = nextSegment?.direction;

      if (
        nextSegmentDirection &&
        !segment.direction.equals(nextSegmentDirection)
      ) {
        if (!segment.direction.equals(nextSegmentDirection)) {
          const jointBallMesh = new THREE.Mesh(
            this.jointBallGeometry,
            this.pipeMaterials[pipeIndex]
          );

          const jointPipeOneMesh = new THREE.Mesh(
            this.jointPipeGeometry,
            this.pipeMaterials[pipeIndex]
          );

          const jointPipeTwoMesh = new THREE.Mesh(
            this.jointPipeGeometry,
            this.pipeMaterials[pipeIndex]
          );

          jointBallMesh.position.copy(segment.position);

          jointPipeOneMesh.position.copy(segment.position);
          jointPipeTwoMesh.position.copy(segment.position);

          jointPipeOneMesh.rotation.copy(
            getRotationFromDirection(segmentDirection)
          );
          jointPipeTwoMesh.rotation.copy(
            getRotationFromDirection(nextSegmentDirection)
          );

          jointPipeOneMesh.position.add(
            segmentDirection
              .clone()
              .multiply(new THREE.Vector3(-0.25, -0.25, -0.25))
          );
          jointPipeTwoMesh.position.add(
            nextSegmentDirection
              .clone()
              .multiply(new THREE.Vector3(0.25, 0.25, 0.25))
          );

          this.scene.add(jointBallMesh, jointPipeOneMesh, jointPipeTwoMesh);
          this._meshes.push(jointBallMesh, jointPipeOneMesh, jointPipeTwoMesh);
        }
      } else {
        const pipeSegmentMesh = new THREE.Mesh(
          this.pipeGeometry,
          this.pipeMaterials[pipeIndex]
        );

        const rotation = getRotationFromDirection(segmentDirection);
        pipeSegmentMesh.rotation.copy(rotation);

        pipeSegmentMesh.position.copy(segment.position);

        this.scene.add(pipeSegmentMesh);
        this._meshes.push(pipeSegmentMesh);
      }
    }

    this.currentSegmentIndex++;
  }

  dispose() {
    this._meshes.forEach((mesh) => {
      this.scene.remove(mesh);
    });
    this._meshes.forEach((mesh) => {
      // @ts-expect-error - Material will not be an array so its safe to call dispose directly
      mesh.material.dispose();
      mesh.geometry.dispose();
    });
  }
}
