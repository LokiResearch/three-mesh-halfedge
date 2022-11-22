import {GUI} from 'dat.gui';
import { AmbientLight,  BackSide,  BufferGeometry, 
  FrontSide, GreaterDepth, Mesh, MeshPhongMaterial, PerspectiveCamera, 
  PointLight, Scene, Vector2, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {HalfedgeDS, Halfedge, Face} from '../src/index';
import {debounce} from 'throttle-debounce';
import { removeTrianglesFromGeometry, setupMeshGeometry, Shape } from './utils';
import { LineSegments2 } from 'three/examples/jsm/lines/LineSegments2';
import { LineSegmentsGeometry } from 'three/examples/jsm/lines/LineSegmentsGeometry';
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial';

const struct = new HalfedgeDS();
const vec2 = new Vector2();

const params = {
  shape: Shape.Cylinder,
  holes: 0,
  lineWidth: 2,
  showHidden: true,
}

const bgColor = 0x444444;

// Init renderer
const renderer = new WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(bgColor, 1);
document.body.appendChild(renderer.domElement);

// Init scene
const scene = new Scene();
scene.add(new AmbientLight(0xffffff, 0.8));

// Init camera
const camera = new PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50);
camera.position.set(3, 3, 3);
camera.far = 100;
camera.updateProjectionMatrix();

// Init camera light
const camLight = new PointLight(0xffffff, 0.5);
camera.add(camLight);
camLight.position.set(0.5, 1, 0);
scene.add(camera);

// Init gui
const gui = new GUI();
gui.add(params, 'shape', Shape).onChange(shapeChanged);
gui.add(params, 'showHidden').onChange(showHiddenChanged);
const holesGUI = gui.add(params, 'holes', 0, 5, 1).onFinishChange(build);
gui.add(params, 'lineWidth', 1, 5, 0.1).onChange(setLineWidth);
gui.add({'rebuild':build}, 'rebuild');
gui.open();

// Init controls
const orbitControls = new OrbitControls(camera, renderer.domElement);

orbitControls.addEventListener('change', onOrbitChanged);

window.addEventListener('resize', function () {

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  render();

}, false);

// Init mesh
const meshFrontMaterial = new MeshPhongMaterial({
  color: 0x555577,
  flatShading: true,
  side: FrontSide,
});
const meshBackMaterial = new MeshPhongMaterial({
  color: 0x333355,
  flatShading: true,
  side: BackSide,
})
const mesh = new Mesh(new BufferGeometry(), meshFrontMaterial);
const backMesh = new Mesh(mesh.geometry, meshBackMaterial);
scene.add(mesh);
scene.add(backMesh);

// Init half edges visualizations
let silhouetteGeometry = new LineSegmentsGeometry();
let boundaryGeometry = new LineSegmentsGeometry();

vec2.set(window.innerWidth, window.innerHeight);

const silMaterial = new LineMaterial({
  color: 0x00FF00,
  depthWrite: false,
  linewidth: params.lineWidth,
});

const boundMaterialHidden = new LineMaterial({
  color: 0xFF0000,
  depthWrite: false,
  dashed: true,
  dashSize: 0.05,
  gapSize: 0.05,
  linewidth: params.lineWidth,
  depthFunc: GreaterDepth,
  polygonOffset: true,
  polygonOffsetFactor: -5.0,
  polygonOffsetUnits: -5.0
});

const boundMaterialVisible = new LineMaterial({
  color: 0xFF0000,
  depthWrite: false,
  linewidth: params.lineWidth,
});


const boundaryHiddenLines = new LineSegments2(boundaryGeometry, boundMaterialHidden);
const boundaryVisibleLines = new LineSegments2(boundaryGeometry, boundMaterialVisible);
const silhouetteLines = new LineSegments2(silhouetteGeometry, silMaterial);


mesh.renderOrder = 5;
backMesh.renderOrder = 5;
boundaryHiddenLines.renderOrder = 10;
boundaryVisibleLines.renderOrder = 20;
silhouetteLines.renderOrder = 30;

scene.add(boundaryHiddenLines);
scene.add(boundaryVisibleLines);
scene.add(silhouetteLines);

const frontFaces = new Set<Face>();
const silhouetteHalfedges = new Array<Halfedge>();
const boundaryHalfedges = new Array<Halfedge>();



function setLineWidth() {
  silMaterial.linewidth = params.lineWidth;
  boundMaterialHidden.linewidth = params.lineWidth;
  boundMaterialVisible.linewidth = params.lineWidth;
  render();
}

function updateContours() {

  silhouetteGeometry.dispose();
  silhouetteGeometry = new LineSegmentsGeometry();
  boundaryGeometry.dispose();
  boundaryGeometry = new LineSegmentsGeometry();

  boundaryHiddenLines.geometry = boundaryGeometry
  boundaryVisibleLines.geometry = boundaryGeometry
  silhouetteLines.geometry = silhouetteGeometry

  extractHalfEdges();
  updateGeometryFromHalfedges(silhouetteGeometry, silhouetteHalfedges);
  updateGeometryFromHalfedges(boundaryGeometry, boundaryHalfedges);
  boundaryHiddenLines.computeLineDistances();
  boundaryVisibleLines.computeLineDistances();
  silhouetteLines.computeLineDistances();

}

function updateFrontFaces() {

  frontFaces.clear();

  // Get the camera pos in object space
  const localCamPos = mesh.worldToLocal(camera.position.clone());

  // Get the front faces list
  for (const face of struct.faces) {
    if (face.isFront(localCamPos)) {
      frontFaces.add(face)
    }
  }
}

function showHiddenChanged() {
  boundaryHiddenLines.visible = params.showHidden;
  render();
}

function extractHalfEdges() {

  updateFrontFaces();

  silhouetteHalfedges.clear();
  boundaryHalfedges.clear();

  const handled = new Set<Halfedge>();

  for (const halfedge of struct.halfedges) {

    if (!handled.has(halfedge.twin)) {
      handled.add(halfedge);

      if (halfedge.face === null || halfedge.twin.face === null) {
        boundaryHalfedges.push(halfedge);
      } else if (frontFaces.has(halfedge.face) !== frontFaces.has(halfedge.twin.face)) {
        silhouetteHalfedges.push(halfedge);
      }
    }
  }
}

function updateGeometryFromHalfedges(
    target: LineSegmentsGeometry,
    halfEdges: Array<Halfedge>){

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

  target.setPositions(vertices);
}

function onOrbitChanged() {
  updateContours();
  render();
}

function updateHolesGui() {
  const index = mesh.geometry.getIndex();
  const position = mesh.geometry.getAttribute('position');
  const nbOfFaces = index ? index.count/3 : position.count/3;
  holesGUI.max(nbOfFaces/3);
  params.holes = Math.min(params.holes, nbOfFaces/3);
  holesGUI.setValue(params.holes);
}

function shapeChanged() {
  setupMeshGeometry(mesh, params.shape);
  backMesh.geometry = mesh.geometry;
  updateHolesGui();
  build();
}

const debounceBuild = debounce(200, () => {
  struct.clear();
  setupMeshGeometry(mesh, params.shape);
  backMesh.geometry = mesh.geometry;
  removeTrianglesFromGeometry(mesh.geometry, params.holes);
  struct.setFromGeometry(mesh.geometry);
  updateContours();
  render();
});

function build() {
  debounceBuild();
}

function updateInfo() {
  const silInfo = document.getElementById('silInfo');
  if (silInfo) {
    silInfo.innerHTML = `Silhouette: ${silhouetteHalfedges.length} edges`
  }

  const boundInfo = document.getElementById("boundInfo");
  if (boundInfo) {
    boundInfo.innerHTML = `Boundary: ${boundaryHalfedges.length} edges`
  }
}


function render() {

  renderer.getSize(vec2);
  silMaterial.resolution.copy(vec2);
  boundMaterialHidden.resolution.copy(vec2);
  boundMaterialVisible.resolution.copy(vec2);

  gui.updateDisplay();

  updateInfo();

  renderer.render(scene, camera);

}

shapeChanged();