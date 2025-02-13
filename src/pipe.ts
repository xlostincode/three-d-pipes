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

  private jointBallRadius: number;
  private jointBallGeometry: THREE.SphereGeometry;

  private longestPipeLength: number;
  private pipeMaterial: THREE.MeshPhongMaterial;
  private normalSegmentCount: number;
  private ballSegmentCount: number;
  private segmentInstancedMesh: THREE.InstancedMesh<
    THREE.CylinderGeometry,
    THREE.MeshPhongMaterial,
    THREE.InstancedMeshEventMap
  >;
  private dummy: THREE.Object3D<THREE.Object3DEventMap>;
  private pipeColors: THREE.Color[];
  private segmentInstancedMeshIndex: number;
  private ballInstancedMesh: THREE.InstancedMesh<
    THREE.SphereGeometry,
    THREE.MeshPhongMaterial,
    THREE.InstancedMeshEventMap
  >;
  private ballInstancedMeshIndex: number;

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
    this.pipeMaterial = new THREE.MeshPhongMaterial();
    this.pipeColors = pipes.map(() => pickRandomFromArray(COLOR_LIST, rng));

    this.jointBallGeometry = new THREE.SphereGeometry(
      this.jointBallRadius,
      16,
      16
    );

    this.longestPipeLength = Math.max(...pipes.map((pipe) => pipe.length));

    // Count the number of meshes for use in InstancedMesh
    this.normalSegmentCount = 0;
    this.ballSegmentCount = 0;
    for (const pipe of this.pipes) {
      for (let index = 0; index < pipe.length; index++) {
        const currentSegment = pipe[index];
        const nextSegment = pipe[index + 1];

        this.normalSegmentCount += 1;

        if (
          nextSegment &&
          !currentSegment.direction.equals(nextSegment.direction)
        ) {
          this.normalSegmentCount += 1;
          this.ballSegmentCount += 1;
        }
      }
    }

    // Instanced mesh for segments
    this.segmentInstancedMesh = new THREE.InstancedMesh(
      this.pipeGeometry,
      this.pipeMaterial,
      this.normalSegmentCount
    );
    this.segmentInstancedMeshIndex = 0;

    // Instanced mesh for ball joints
    this.ballInstancedMesh = new THREE.InstancedMesh(
      this.jointBallGeometry,
      this.pipeMaterial,
      this.ballSegmentCount
    );
    this.ballInstancedMeshIndex = 0;

    this.dummy = new THREE.Object3D();

    this.scene.add(this.segmentInstancedMesh);
    this.scene.add(this.ballInstancedMesh);
  }

  renderNextSegments() {
    if (this.currentSegmentIndex >= this.longestPipeLength) {
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
        const color = this.pipeColors[pipeIndex];

        // Ball joint
        this.dummy.scale.set(1, 1, 1);
        this.dummy.position.copy(segment.position);
        this.dummy.updateMatrix();

        this.ballInstancedMesh.setMatrixAt(
          this.ballInstancedMeshIndex,
          this.dummy.matrix
        );
        this.ballInstancedMesh.setColorAt(this.ballInstancedMeshIndex, color);
        this.ballInstancedMeshIndex++;

        // Segment one
        this.dummy.scale.set(1, 0.5, 1);
        this.dummy.position.copy(segment.position);
        this.dummy.position.add(
          segmentDirection
            .clone()
            .multiply(new THREE.Vector3(-0.25, -0.25, -0.25))
        );
        this.dummy.rotation.copy(getRotationFromDirection(segmentDirection));
        this.dummy.updateMatrix();

        this.segmentInstancedMesh.setMatrixAt(
          this.segmentInstancedMeshIndex,
          this.dummy.matrix
        );
        this.segmentInstancedMesh.setColorAt(
          this.segmentInstancedMeshIndex,
          color
        );
        this.segmentInstancedMeshIndex++;

        // Segment two
        this.dummy.scale.set(1, 0.5, 1);
        this.dummy.position.copy(segment.position);
        this.dummy.position
          .add(
            nextSegmentDirection
              .clone()
              .multiply(new THREE.Vector3(0.25, 0.25, 0.25))
          )
          .clone()
          .multiply(new THREE.Vector3(0.25, 0.25, 0.25));
        this.dummy.rotation.copy(
          getRotationFromDirection(nextSegmentDirection)
        );
        this.dummy.updateMatrix();

        this.segmentInstancedMesh.setMatrixAt(
          this.segmentInstancedMeshIndex,
          this.dummy.matrix
        );
        this.segmentInstancedMesh.setColorAt(
          this.segmentInstancedMeshIndex,
          color
        );
        this.segmentInstancedMeshIndex++;

        this.segmentInstancedMesh.instanceMatrix.needsUpdate = true;
        if (this.segmentInstancedMesh.instanceColor) {
          this.segmentInstancedMesh.instanceColor.needsUpdate = true;
        }
        this.ballInstancedMesh.instanceMatrix.needsUpdate = true;
        if (this.ballInstancedMesh.instanceColor) {
          this.ballInstancedMesh.instanceColor.needsUpdate = true;
        }
      } else {
        const color = this.pipeColors[pipeIndex];
        const rotation = getRotationFromDirection(segmentDirection);

        this.dummy.scale.set(1, 1, 1);
        this.dummy.rotation.copy(rotation);
        this.dummy.position.copy(segment.position);
        this.dummy.updateMatrix();

        this.segmentInstancedMesh.setMatrixAt(
          this.segmentInstancedMeshIndex,
          this.dummy.matrix
        );
        this.segmentInstancedMesh.setColorAt(
          this.segmentInstancedMeshIndex,
          color
        );

        this.segmentInstancedMesh.instanceMatrix.needsUpdate = true;
        if (this.segmentInstancedMesh.instanceColor) {
          this.segmentInstancedMesh.instanceColor.needsUpdate = true;
        }

        this.segmentInstancedMeshIndex++;
      }
    }

    this.currentSegmentIndex++;
  }

  dispose() {
    this.scene.remove(this.segmentInstancedMesh);
    this.scene.remove(this.ballInstancedMesh);

    this.pipeMaterial.dispose();
    this.pipeGeometry.dispose();
    this.jointBallGeometry.dispose();
  }
}
