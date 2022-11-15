# three-mesh-halfedge

[![build](https://img.shields.io/github/workflow/status/LokiResearch/three-svg-renderer/build)](https://img.shields.io/github/workflow/status/LokiResearch/three-svg-renderer/build)
[![npm release](https://img.shields.io/npm/v/three-mesh-halfedge)](https://img.shields.io/npm/v/three-mesh-halfedge)
[![GitHub release](https://img.shields.io/github/release/LokiResearch/three-mesh-halfedge?include_prereleases=&sort=semver&color=blue)](https://github.com/LokiResearch/three-mesh-halfedge/releases/)
[![License](https://img.shields.io/badge/License-MIT-green)](#license)

A typescript implementation of the Halfedge structure for three.js geometries.

## Examples

- HalfedgeDS Visualisation [[link]](https://LokiResearch.github.io/three-mesh-halfedge/build-examples/HalfedgeDSVisualisation.html)
- Realtime contours extraction [[link]](https://LokiResearch.github.io/three-mesh-halfedge/build-examples/ExtractContours.html)

## Documentation

[![Open - Documentation](https://img.shields.io/badge/view-Documentation-blue?style=for-the-badge)](https://LokiResearch.github.io/three-mesh-halfedge/docs/index.html)

*Documentation is in progress.*

## Use

##### Build the structure
```javascript
import * as THREE from 'three';
import { HalfEdge } from 'three-mesh-halfedge';

const geometry = new THREE.BoxGeometry();
const HEStructure = new HalfEdgeStructure(geometry, {
    hashNormals: true,
    tolerance: 1e-4,
});
HEStructure.build();
```

##### Example 1: Get the boundary HalfEdges of a mesh
```javascript
// Let's admit we have a mesh

// Build the HalfEdge structure
const HEStructure = new HalfEdgeStructure(mesh.geometry);
HEStructure.build();

// Get the boundary halfEdges
const boundaryHalfEdgesArray = [];
for (const halfEdge of HEStructure.halfEdges) {
	if (!halfEdge.twin) {
		boundaryHalfEdgesArray.push(halfEdge);
	}
}
```


##### Example 2: Get the front faces of a mesh
```javascript
// Let's admit we have a scene camera and a mesh

// Build the HalfEdge structure
const HEStructure = new HalfEdgeStructure(mesh.geometry);
HEStructure.build();

// Get the camera position in mesh's space
const localCameraPos = mesh.worldToLocal(camera.position.clone());

//  Get the front faces
const frontFacesArray = [];
for (const faces of HEStructure.faces) {
	// /!\ Attention: position is considered in geometry local system
	if (face.isFront(localCameraPos) { 
		frontFacesArray.push(face);
	}
}
```



