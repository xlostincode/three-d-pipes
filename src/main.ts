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

const DEFAULTS = {
  bounds: {
    x: 25,
    y: 25,
    z: 25,
  },
  pipeCount: 10,
  pipeLength: 200,
  pipeTurnRandomness: 0.25,
};

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  canvasSize.width / canvasSize.height
);
camera.position.x = Math.round(DEFAULTS.bounds.x * 0.5);
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

// Parameters
const calculateBoundingBox = (x: number, y: number, z: number) => {
  const minX = x - x * 1.5;
  const maxX = x - x * 0.5;

  const minY = y - y * 1.5;
  const maxY = y - y * 0.5;

  const minZ = z - z * 1.5;
  const maxZ = z - z * 0.5;

  return new THREE.Box3(
    new THREE.Vector3(minX, minY, minZ),
    new THREE.Vector3(maxX, maxY, maxZ)
  );
};

const parameters = {
  bounds: {
    x: DEFAULTS.bounds.x,
    y: DEFAULTS.bounds.y,
    z: DEFAULTS.bounds.z,
  },
  pipeCount: DEFAULTS.pipeCount,
  pipeLength: DEFAULTS.pipeLength,
  pipeTurnRandomness: DEFAULTS.pipeTurnRandomness,
  pipeRenderer: new PipeRenderer(
    createPipes(
      10,
      100,
      calculateBoundingBox(
        DEFAULTS.bounds.x,
        DEFAULTS.bounds.y,
        DEFAULTS.bounds.z
      )
    ),
    scene
  ),
};

// GUI
const pane = new Pane();

pane.addBinding(parameters, "bounds", {
  label: "Bounds (x,y,z)",
  min: 5,
  max: 100,
  step: 1,
});

pane.addBinding(parameters, "pipeCount", {
  label: "Number of pipes",
  min: 1,
  max: 50,
  step: 1,
});

pane.addBinding(parameters, "pipeLength", {
  label: "Length of pipes",
  min: 2,
  max: 1000,
  step: 1,
});

pane.addBinding(parameters, "pipeTurnRandomness", {
  label: "Pipe turn randomness",
  tag: "Tests",
  min: 0,
  max: 1,
  step: 0.05,
});

pane.addBlade({
  view: "separator",
});

const playButton = pane.addButton({
  title: "Play",
});

playButton.on("click", () => {
  camera.position.set(Math.round(DEFAULTS.bounds.x * 0.5), 0, 0);

  parameters.pipeRenderer.dispose();

  parameters.pipeRenderer = new PipeRenderer(
    createPipes(
      parameters.pipeCount,
      parameters.pipeLength,
      calculateBoundingBox(
        parameters.bounds.x,
        parameters.bounds.y,
        parameters.bounds.z
      ),
      parameters.pipeTurnRandomness
    ),
    scene
  );
});

// Render Loop
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  parameters.pipeRenderer.renderNextSegments();

  renderer.render(scene, camera);
  controls.update();

  window.requestAnimationFrame(tick);
};
tick();
