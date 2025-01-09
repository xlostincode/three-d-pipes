import * as THREE from "three";

export const DIRECTION_MAP = {
  FORWARD: new THREE.Vector3(-1, 0, 0),
  BACKWARD: new THREE.Vector3(1, 0, 0),
  LEFT: new THREE.Vector3(0, 0, 1),
  RIGHT: new THREE.Vector3(0, 0, -1),
  UP: new THREE.Vector3(0, 1, 0),
  DOWN: new THREE.Vector3(0, -1, 0),
};

export const DIRECTION_LIST = Object.values(DIRECTION_MAP);
