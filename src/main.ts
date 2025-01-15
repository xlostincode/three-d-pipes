import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import "./style.css";
import * as THREE from "three";
import { Pane } from "tweakpane";
import { createPipe, PipeRenderer } from "./pipe";

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
    x: 100,
    y: 100,
    z: 100,
  },
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
camera.position.x = 2;
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

const pipe = createPipe(
  new THREE.Vector3(0, 0, 0),
  100,
  calculateBoundingBox()
);
const pipeRenderer = new PipeRenderer(pipe, scene);

// Render Loop
const clock = new THREE.Clock();

const tick = () => {
  const elapsedTime = clock.getElapsedTime();

  pipeRenderer.renderPipeSegment();

  renderer.render(scene, camera);
  controls.update();

  window.requestAnimationFrame(tick);
};
tick();

const drawBoundingBox = () => {
  const height = parameters.bounds.y;
  const width = parameters.bounds.x;
  const depth = parameters.bounds.z;

  const boxGeometry = new THREE.BoxGeometry(width, height, depth);

  const edgeGeometry = new THREE.EdgesGeometry(boxGeometry);
  const edgeMaterial = new THREE.LineBasicMaterial({
    color: "#84cc16",
  });

  const boxEdges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
  scene.add(boxEdges);
};

// drawBoundingBox();
// console.time("pipe");
// const pipe = createPipe(new THREE.Vector3(0, 0, 0), 100000);
// console.timeEnd("pipe");
// console.log("Pipe length", pipe.length);

// const bounds = calculateBoundingBox();
// const box3Helper = new THREE.Box3Helper(bounds, "#84cc16");
// scene.add(box3Helper);

const box = new THREE.Box3(
  new THREE.Vector3(-0.5, -0.5, -0.5),
  new THREE.Vector3(0.5, 0.5, 0.5)
);
const box3Helper = new THREE.Box3Helper(box, "#84cc16");
scene.add(box3Helper);

// const pipeJointBall = new THREE.SphereGeometry(0.3, 16, 16);
// const pipeJointSegmentOne = new THREE.CylinderGeometry(0.2, 0.2, 0.5);
// const pipeJointSegmentTwo = new THREE.CylinderGeometry(0.2, 0.2, 0.5);

// const pjb = new THREE.Mesh(pipeJointBall, pipeMaterial);
// const pjso = new THREE.Mesh(pipeJointSegmentOne, pipeMaterial);
// pjso.rotateX(Math.PI * 0.5);
// pjso.position.z = 0.25;

// const pjst = new THREE.Mesh(pipeJointSegmentTwo, pipeMaterial);
// pjst.rotateZ(Math.PI * 0.5);
// pjst.position.x = 0.25;
// scene.add(pjb, pjso, pjst);
