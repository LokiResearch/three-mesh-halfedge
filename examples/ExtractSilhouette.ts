import {GUI} from 'dat.gui';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {HalfEdgeStructure, HalfEdge, Face} from '../src/index';
import * as THREE from 'three';


const possibleObjects = {
  "cube": "cube",
  "sphere": "sphere",
  "cylinder": "cylinder",
  "torusknot": "torusknot",
}

const params = {
  shape: "cube",
  tolerance: 1e-4,
  hashNormals: false
}

const bgColor = 0x555555;

// Init renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(bgColor, 1);
document.body.appendChild(renderer.domElement);

// Init scene
const scene = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 0.8));

// Init camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);
camera.position.set(3, 3, 3);
camera.far = 100;
camera.updateProjectionMatrix();

// Init camera light
const camLight = new THREE.PointLight(0xffffff, 0.5);
camera.add(camLight);
camLight.position.set(0.5, 1, 0);
scene.add(camera);

// Init gui
const gui = new GUI();
gui.add(params, 'shape', possibleObjects).onChange(updateGeometry);
const folder = gui.addFolder('HalfEdge Structure')
folder.add(params, 'tolerance', 1e-10, 1).onChange(updateGeometry);
folder.add(params, 'hashNormals').onChange(updateGeometry);
gui.open();

// Init controls
const orbitControls = new OrbitControls(camera, renderer.domElement);

orbitControls.addEventListener('change', function () {
  updateHalfEdgesGeometries();
  render();
});

window.addEventListener('resize', function () {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  render();

}, false);

// Init mesh
const meshMaterial = new THREE.MeshPhongMaterial({
  color: 0x333388,
  flatShading: true,
  side: THREE.DoubleSide,
});
let geometry = getNewGeometry();
const mesh = new THREE.Mesh(geometry, meshMaterial);
scene.add(mesh);

// Init half edges visualizations
const silhouetteGeometry = new THREE.BufferGeometry();
const boundaryGeometry = new THREE.BufferGeometry();
const silMaterial = new THREE.LineBasicMaterial({
  color: 0x00FF00,
  depthTest: false,
  depthWrite: false,
  side: THREE.DoubleSide,
});
const boundMaterial = new THREE.LineBasicMaterial({
  color: 0xFF0000,
  depthTest: false,
  depthWrite: false,
  side: THREE.DoubleSide,
});
const silLine = new THREE.LineSegments(silhouetteGeometry, silMaterial);
const boundLine = new THREE.LineSegments(boundaryGeometry, boundMaterial);
scene.add(silLine);
scene.add(boundLine);

const frontFaces = new Set<Face>();
const silhouetteHalfEdges = new Set<HalfEdge>();
const boundaryHalfEdges = new Set<HalfEdge>();




// Init HalfEdge Structure
let halfEdgeStructure: HalfEdgeStructure;

function updateHalfEdgesGeometries() {

  updateFrontFaces();
  extractHalfEdges();
  updateGeometryFromHalfEdges(silhouetteGeometry, silhouetteHalfEdges);
  updateGeometryFromHalfEdges(boundaryGeometry, boundaryHalfEdges);
  silLine.matrix.copy(mesh.matrix);
  boundLine.matrix.copy(mesh.matrix);

}


function updateFrontFaces() {

  frontFaces.clear();

  // Get the camera pos in object space
  const localCamPos = mesh.worldToLocal(camera.position.clone());

  // Get the front faces list
  for (const face of halfEdgeStructure.faces) {
    if (face.isFront(localCamPos)) {
      frontFaces.add(face)
    }
  }

}


function extractHalfEdges() {

  // For manifold objects
  // silhouette = edges between front and back faces
  // boundary = edges with one connected face

  silhouetteHalfEdges.clear();
  boundaryHalfEdges.clear();

  for (const halfEdge of halfEdgeStructure.halfEdges) {

    const twin = halfEdge.twin;

    if (twin) {
      if (!silhouetteHalfEdges.has(twin) &&
        (frontFaces.has(halfEdge.face) !== frontFaces.has(twin.face))) {
        silhouetteHalfEdges.add(halfEdge);
      }
    } else {
      boundaryHalfEdges.add(halfEdge)
    }

  }
}

function updateGeometryFromHalfEdges(
    target: THREE.BufferGeometry,
    halfEdges: Set<HalfEdge>
){

  // Update silhouette geometries
  const vertices = new Array<number>();
  for (const halfEdge of halfEdges) {
    vertices.push(halfEdge.vertex.position.x);
    vertices.push(halfEdge.vertex.position.y);
    vertices.push(halfEdge.vertex.position.z);
    vertices.push(halfEdge.next.vertex.position.x);
    vertices.push(halfEdge.next.vertex.position.y);
    vertices.push(halfEdge.next.vertex.position.z);
  }

  target.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));

}


function getNewGeometry() {
  switch (params.shape) {
  case "sphere":
    return new THREE.SphereGeometry();
  case "cylinder":
    return new THREE.CylinderGeometry(0.5, 0.5, 3, 8, 3, true);
  case "torusknot":
    return new THREE.TorusKnotGeometry();
  case "cube":
  default:
    return new THREE.BoxGeometry();
  }
}

function updateGeometry() {

  geometry.dispose();
  geometry = getNewGeometry();
  mesh.geometry = geometry;

  halfEdgeStructure = new HalfEdgeStructure(geometry, {
    hashNormals: params.hashNormals,
    tolerance: params.tolerance,
  });
  halfEdgeStructure.build();
  updateHalfEdgesGeometries();
  render();

}

function updateInfo() {
  const silInfo = document.getElementById('silInfo');
  if (silInfo) {
    silInfo.innerHTML = `Silhouette: ${silhouetteHalfEdges.size} edges`
  }

  const boundInfo = document.getElementById("boundInfo");
  if (boundInfo) {
    boundInfo.innerHTML = `Silhouette: ${boundaryHalfEdges.size} edges`
  }
}


function render() {

  gui.updateDisplay();

  updateInfo();

  renderer.render(scene, camera);

}

updateGeometry();
render();