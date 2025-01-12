import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import "./style.css";
import * as THREE from "three";
import { Pane } from "tweakpane";
import { DIRECTION_LIST } from "./const";
import { createPipe } from "./pipe";

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
camera.position.x = 20;
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
let pipe = createPipe(new THREE.Vector3(0, 0, 0), 100);

const pipeGeometry = new THREE.BoxGeometry(1, 1, 1);
const pipeMaterial = new THREE.MeshBasicMaterial({
  color: "#84cc16",
  transparent: true,
  opacity: 0.1,
});
const drawPipeSegment = (position: THREE.Vector3) => {
  const box = new THREE.Mesh(pipeGeometry, pipeMaterial);

  box.position.copy(position);
  scene.add(box);
};

// Render Loop
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  if (pipe.length) {
    const segment = pipe.pop()!;
    drawPipeSegment(segment);
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
