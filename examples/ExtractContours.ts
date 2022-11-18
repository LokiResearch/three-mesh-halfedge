import {GUI} from 'dat.gui';
import { AmbientLight,  BackSide,  BufferGeometry, Float32BufferAttribute, 
  FrontSide, 
  LineBasicMaterial, LineDashedMaterial, LineSegments, Mesh, MeshPhongMaterial, PerspectiveCamera, 
  PointLight, Scene, WebGLRenderer } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {HalfedgeDS, Halfedge, Face} from '../src/index';
import {debounce} from 'throttle-debounce';
import { removeTrianglesFromGeometry, setupMeshGeometry, Shape } from './utils';

const struct = new HalfedgeDS();

const params = {
  shape: Shape.Cylinder,
  holes: 0,
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
const silhouetteGeometry = new BufferGeometry();
const boundaryGeometry = new BufferGeometry();
const silMaterial = new LineBasicMaterial({
  color: 0x00FF00,
  depthTest: false,
  depthWrite: false,
});

const boundMaterialHidden = new LineDashedMaterial({
  color: 0xFF0000,
  depthTest: false,
  depthWrite: false,
  dashSize: 0.03,
  gapSize: 0.03,
});

const boundMaterialVisible = new LineBasicMaterial({
  color: 0xFF0000,
  depthTest: true,
  depthWrite: false,
  linewidth: 2,
});


const silLine = new LineSegments(silhouetteGeometry, silMaterial);
silLine.renderOrder = 30;
const boundLineHidden = new LineSegments(boundaryGeometry, boundMaterialHidden);
boundLineHidden.renderOrder = 10;
const boundLineVisible = new LineSegments(boundaryGeometry, boundMaterialVisible);
boundLineVisible.renderOrder = 20;
scene.add(silLine);
scene.add(boundLineHidden);
scene.add(boundLineVisible);

const frontFaces = new Set<Face>();
const silhouetteHalfedges = new Array<Halfedge>();
const boundaryHalfedges = new Array<Halfedge>();

// Init HalfEdge Structure

function updateContours() {

  extractHalfEdges();
  updateGeometryFromHalfedges(silhouetteGeometry, silhouetteHalfedges);
  updateGeometryFromHalfedges(boundaryGeometry, boundaryHalfedges);
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
  boundLineHidden.visible = params.showHidden;
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
    target: BufferGeometry,
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

  target.setAttribute("position", new Float32BufferAttribute(vertices, 3));

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

  boundLineHidden.computeLineDistances();
  boundLineVisible.computeLineDistances();

  gui.updateDisplay();

  updateInfo();

  renderer.render(scene, camera);

}

shapeChanged();