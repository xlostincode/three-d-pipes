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
  pipeMaterial: THREE.MeshPhongMaterial;
  _normalSegmentCount: number;
  _jointSegmentCount: number;
  _ballSegmentCount: number;
  _segmentInstancedMesh: THREE.InstancedMesh<
    THREE.CylinderGeometry,
    THREE.MeshPhongMaterial,
    THREE.InstancedMeshEventMap
  >;
  _dummy: THREE.Object3D<THREE.Object3DEventMap>;
  pipeColors: THREE.Color[];
  _segmentInstancedMeshIndex: number;
  _ballInstancedMesh: THREE.InstancedMesh<
    THREE.CylinderGeometry,
    THREE.MeshPhongMaterial,
    THREE.InstancedMeshEventMap
  >;
  private _ballInstancedMeshIndex: number;

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
    this.jointPipeGeometry = new THREE.CylinderGeometry(
      this.pipeRadius,
      this.pipeRadius,
      0.5
    );

    this._meshes = [];
    this._longestPipeLength = Math.max(...pipes.map((pipe) => pipe.length));

    this._normalSegmentCount = 0;
    this._jointSegmentCount = 0;
    this._ballSegmentCount = 0;

    for (const pipe of this.pipes) {
      for (let index = 0; index < pipe.length - 1; index++) {
        if (pipe[index].direction.equals(pipe[index + 1].direction)) {
          this._normalSegmentCount += 1;
        } else {
          this._normalSegmentCount += 2;
          this._ballSegmentCount += 1;
        }
      }
    }

    console.log(
      this._normalSegmentCount,
      this._jointSegmentCount,
      this._ballSegmentCount
    );

    this._segmentInstancedMesh = new THREE.InstancedMesh(
      this.pipeGeometry,
      this.pipeMaterial,
      this._normalSegmentCount
    );
    this._segmentInstancedMeshIndex = 0;

    this._ballInstancedMesh = new THREE.InstancedMesh(
      this.jointBallGeometry,
      this.pipeMaterial,
      this._ballSegmentCount
    );
    this._ballInstancedMeshIndex = 0;

    this._dummy = new THREE.Object3D();

    this.scene.add(this._segmentInstancedMesh);
    this.scene.add(this._ballInstancedMesh);
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
        const color = this.pipeColors[pipeIndex];

        // Ball joint
        this._dummy.scale.set(1, 1, 1);
        this._dummy.position.copy(segment.position);
        this._dummy.updateMatrix();

        this._ballInstancedMesh.setMatrixAt(
          this._ballInstancedMeshIndex,
          this._dummy.matrix
        );
        this._ballInstancedMesh.setColorAt(this._ballInstancedMeshIndex, color);
        this._ballInstancedMeshIndex++;

        // Segment one
        this._dummy.scale.set(0.5, 0.5, 0.5);
        this._dummy.position.copy(segment.position);
        this._dummy.position.add(
          segmentDirection
            .clone()
            .multiply(new THREE.Vector3(-0.25, -0.25, -0.25))
        );
        this._dummy.rotation.copy(getRotationFromDirection(segmentDirection));
        this._dummy.updateMatrix();

        this._segmentInstancedMesh.setMatrixAt(
          this._segmentInstancedMeshIndex,
          this._dummy.matrix
        );
        this._segmentInstancedMeshIndex++;

        // Segment two
        this._dummy.scale.set(0.5, 0.5, 0.5);
        this._dummy.position.copy(segment.position);
        this._dummy.position
          .add(
            nextSegmentDirection
              .clone()
              .multiply(new THREE.Vector3(0.25, 0.25, 0.25))
          )
          .clone()
          .multiply(new THREE.Vector3(0.25, 0.25, 0.25));
        this._dummy.rotation.copy(
          getRotationFromDirection(nextSegmentDirection)
        );
        this._dummy.updateMatrix();

        this._segmentInstancedMesh.setMatrixAt(
          this._segmentInstancedMeshIndex,
          this._dummy.matrix
        );
        this._segmentInstancedMeshIndex++;

        this._segmentInstancedMesh.instanceMatrix.needsUpdate = true;
        if (this._segmentInstancedMesh.instanceColor) {
          this._segmentInstancedMesh.instanceColor.needsUpdate = true;
        }
        this._ballInstancedMesh.instanceMatrix.needsUpdate = true;
        if (this._ballInstancedMesh.instanceColor) {
          this._ballInstancedMesh.instanceColor.needsUpdate = true;
        }
      } else {
        const color = this.pipeColors[pipeIndex];
        const rotation = getRotationFromDirection(segmentDirection);

        this._dummy.scale.set(1, 1, 1);
        this._dummy.rotation.copy(rotation);
        this._dummy.position.copy(segment.position);
        this._dummy.updateMatrix();

        this._segmentInstancedMesh.setMatrixAt(
          this._segmentInstancedMeshIndex,
          this._dummy.matrix
        );
        this._segmentInstancedMesh.setColorAt(
          this._segmentInstancedMeshIndex,
          color
        );

        this._segmentInstancedMesh.instanceMatrix.needsUpdate = true;
        if (this._segmentInstancedMesh.instanceColor) {
          this._segmentInstancedMesh.instanceColor.needsUpdate = true;
        }

        this._segmentInstancedMeshIndex++;
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
