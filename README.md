# three-mesh-halfedge

[![build](https://github.com/minitoine/three-mesh-halfedge/workflows/build/badge.svg)](https://github.com/minitoine/three-mesh-halfedge/actions?query=workflow:"build")
[![examples](https://github.com/minitoine/three-mesh-halfedge/workflows/build-examples/badge.svg)](https://github.com/minitoine/three-mesh-halfedge/actions?query=workflow:"build-examples")
[![GitHub release](https://img.shields.io/github/release/minitoine/three-mesh-halfedge?include_prereleases=&sort=semver&color=blue)](https://github.com/minitoine/three-mesh-halfedge/releases/)
[![License](https://img.shields.io/badge/License-MIT-green)](#license)

A typescript implementation of the HalfEdge structure for three.js geometries.

## Examples

- Realtime silhouette and boundary edges extraction [![sssss](https://img.shields.io/badge/open-green)](https://minitoine.github.io/three-mesh-halfedge/build-examples/ExtractSilhouette.html)

## Documentation

[![Open - Documentation](https://img.shields.io/badge/view-Documentation-blue?style=for-the-badge)](https://minitoine.github.io/three-mesh-halfedge/docs/index.html)

*Documentation is in progress.*

## Use

##### Build the structure
```javascript
import * as THREE from 'three';
import {HalfEdgeStructure} from 'three-mesh-halfedge';

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



