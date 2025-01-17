import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import "./style.css";
import * as THREE from "three";
import { Pane } from "tweakpane";
import { createPipes, PipeRenderer } from "./pipe";

const canvasElement = document.getElementById("webgl");

if (!canvasElement) {
  throw new Error("Canvas element not found.");
}

const canvasSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// Parameters
const parameters = {
  bounds: {
    x: 20,
    y: 20,
    z: 20,
  },
};

// GUI
const pane = new Pane();

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  canvasSize.width / canvasSize.height
);
camera.position.x = 2;
scene.add(camera);

// Lights
const directionalLight1 = new THREE.DirectionalLight("#ffffff", 1);
const directionalLight2 = new THREE.DirectionalLight("#ffffff", 1);
const directionalLight3 = new THREE.DirectionalLight("#ffffff", 1);

directionalLight1.position.set(0, 0, 1);
directionalLight2.position.set(1, 0, 0);
directionalLight3.position.set(0, 0, -1);

scene.add(directionalLight1, directionalLight2, directionalLight3);
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

// Custom
const calculateBoundingBox = () => {
  const minX = parameters.bounds.x - parameters.bounds.x * 1.5;
  const maxX = parameters.bounds.x - parameters.bounds.x * 0.5;

  const minY = parameters.bounds.y - parameters.bounds.y * 1.5;
  const maxY = parameters.bounds.y - parameters.bounds.y * 0.5;

  const minZ = parameters.bounds.z - parameters.bounds.z * 1.5;
  const maxZ = parameters.bounds.z - parameters.bounds.z * 0.5;

  return new THREE.Box3(
    new THREE.Vector3(minX, minY, minZ),
    new THREE.Vector3(maxX, maxY, maxZ)
  );
};

const boundingBox = calculateBoundingBox();

const pipes = createPipes(10, 100, boundingBox);
const pipeRenderer = new PipeRenderer(pipes, scene);
// Helpers
// const axisHelper = new THREE.AxesHelper(1);
// scene.add(axisHelper);

// const bounds = calculateBoundingBox();
// const box3Helper = new THREE.Box3Helper(bounds, "#84cc16");
// scene.add(box3Helper);

// Render Loop
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  pipeRenderer.renderNextSegments();

  renderer.render(scene, camera);
  controls.update();

  window.requestAnimationFrame(tick);
};
tick();
