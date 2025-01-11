import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import "./style.css";
import * as THREE from "three";
import { Pane } from "tweakpane";
import { DIRECTION_LIST, DIRECTION_MAP } from "./const";

const canvasElement = document.getElementById("webgl");

if (!canvasElement) {
  throw new Error("Canvas element not found.");
}

const canvasSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// GUI
const pane = new Pane();

// Scene
const scene = new THREE.Scene();
// const debugBox = new THREE.Mesh(
//   new THREE.BoxGeometry(1, 1, 1),
//   new THREE.MeshBasicMaterial({
//     color: "#84cc16",
//     transparent: true,
//     wireframe: true,
//     opacity: 0.1,
//   })
// );
// scene.add(debugBox);

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  canvasSize.width / canvasSize.height
);
camera.position.x = 10;
scene.add(camera);

// Controls
const controls = new OrbitControls(camera, canvasElement);
controls.enableDamping = true;

// Renderer
const renderer = new THREE.WebGLRenderer({
  canvas: canvasElement,
});
renderer.setSize(canvasSize.width, canvasSize.height);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// Listeners
window.addEventListener("resize", () => {
  canvasSize.width = window.innerWidth;
  canvasSize.height = window.innerHeight;

  camera.aspect = canvasSize.width / canvasSize.height;
  camera.updateProjectionMatrix();

  renderer.setSize(canvasSize.width, canvasSize.height);
});

// Helpers
const axisHelper = new THREE.AxesHelper(1);
scene.add(axisHelper);

// Custom
const createPipe = (start: THREE.Vector3, length: number) => {
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

  console.log(directions);

  const pipe: THREE.Vector3[] = [start];

  for (let index = 1; index < directions.length; index++) {
    const previous = directions[index - 1].clone();
    const current = directions[index].clone();

    pipe.push(
      new THREE.Vector3(
        previous.x + current.x,
        previous.y + current.y,
        previous.z + current.z
      )
    );
  }

  return pipe;
};

const pipe = createPipe(new THREE.Vector3(0, 0, 0), 100);

// Render Loop
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  if (pipe.length) {
    const segment = pipe.shift()!;

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshBasicMaterial({
        color: "#84cc16",
        transparent: true,
        wireframe: true,
        opacity: 0.1,
      })
    );

    box.position.copy(segment);
    scene.add(box);
  }
  renderer.render(scene, camera);
  controls.update();

  window.requestAnimationFrame(tick);
};
tick();

const drawDebugBox = () => {
  const height = 5;
  const width = 5;
  const depth = 5;

  const boxGeometry = new THREE.BoxGeometry(1, 1, 1);

  const edgeGeometry = new THREE.EdgesGeometry(boxGeometry);
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: "#84cc16",
    transparent: true,
    opacity: 0.1,
  });

  for (let x = 0; x < depth; x++) {
    for (let y = 0; y < height; y++) {
      for (let z = 0; z < width; z++) {
        const boxEdges = new THREE.LineSegments(edgeGeometry, edgeMaterial);

        const px = x - depth / 2 + 0.5;
        const py = y - height / 2 + 0.5;
        const pz = z - width / 2 + 0.5;

        boxEdges.position.set(px, py, pz);
        scene.add(boxEdges);
      }
    }
  }
};
