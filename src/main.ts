import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import "./style.css";
import * as THREE from "three";
import { Pane } from "tweakpane";
import { createPipes, PipeRenderer } from "./pipe";
import { DEFAULT_PARAMS } from "./const";
import { SeededRandomNumberGenerator } from "./rng";

const canvasElement = document.getElementById("webgl");

if (!canvasElement) {
  throw new Error("Canvas element not found.");
}

const canvasSize = {
  width: window.innerWidth,
  height: window.innerHeight,
};

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  canvasSize.width / canvasSize.height
);
camera.position.x = Math.round(DEFAULT_PARAMS.bounds.x * 0.5);
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

const rng = new SeededRandomNumberGenerator(DEFAULT_PARAMS.seed);
const parameters = {
  bounds: {
    x: DEFAULT_PARAMS.bounds.x,
    y: DEFAULT_PARAMS.bounds.y,
    z: DEFAULT_PARAMS.bounds.z,
  },
  pipeCount: DEFAULT_PARAMS.pipeCount,
  pipeLength: DEFAULT_PARAMS.pipeLength,
  pipeTurnRandomness: DEFAULT_PARAMS.pipeTurnRandomness,
  pipeRenderer: new PipeRenderer(
    createPipes(
      DEFAULT_PARAMS.pipeCount,
      DEFAULT_PARAMS.pipeLength,
      calculateBoundingBox(
        DEFAULT_PARAMS.bounds.x,
        DEFAULT_PARAMS.bounds.y,
        DEFAULT_PARAMS.bounds.z
      ),
      DEFAULT_PARAMS.pipeTurnRandomness,
      rng
    ),
    scene,
    rng
  ),
  seed: DEFAULT_PARAMS.seed,
  randomizeSeed: DEFAULT_PARAMS.randomizeSeed,
};

// GUI
const pane = new Pane();

pane.addBinding(parameters, "seed", {
  label: "Seed",
});

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

pane.addBinding(parameters, "randomizeSeed", {
  label: "Random seed",
});

const playButton = pane.addButton({
  title: "Play",
});

const copyButton = pane.addButton({
  title: "Copy link",
});

playButton.on("click", () => {
  camera.position.set(Math.round(DEFAULT_PARAMS.bounds.x * 0.5), 0, 0);

  parameters.pipeRenderer.dispose();

  if (parameters.randomizeSeed) {
    const newSeed = Math.random().toString().replace(".", "");
    rng.setSeed(newSeed);

    parameters.seed = newSeed;
    pane.refresh();
  } else {
    rng.setSeed(parameters.seed);
  }

  parameters.pipeRenderer = new PipeRenderer(
    createPipes(
      parameters.pipeCount,
      parameters.pipeLength,
      calculateBoundingBox(
        parameters.bounds.x,
        parameters.bounds.y,
        parameters.bounds.z
      ),
      parameters.pipeTurnRandomness,
      rng
    ),
    scene,
    rng
  );
});

copyButton.on("click", () => {
  const url = window.location.href.split("?")[0];

  window.navigator.clipboard.writeText(
    url +
      "?seed=" +
      parameters.seed +
      "&b=" +
      `${parameters.bounds.x},${parameters.bounds.y},${parameters.bounds.z}` +
      "&pc=" +
      `${parameters.pipeCount}` +
      "&pl=" +
      `${parameters.pipeLength}` +
      "&tr=" +
      `${parameters.pipeTurnRandomness}`
  );
});

// Render Loop
const tick = () => {
  parameters.pipeRenderer.renderNextSegments();

  renderer.render(scene, camera);
  controls.update();

  window.requestAnimationFrame(tick);
};
tick();
