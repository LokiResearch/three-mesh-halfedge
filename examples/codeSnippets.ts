/*
 * Author: Axel Antoine
 * mail: ax.antoine@gmail.com
 * website: http://axantoine.com
 * Created on Tue Nov 15 2022
 *
 * Loki, Inria project-team with Université de Lille
 * within the Joint Research Unit UMR 9189 
 * CNRS - Centrale Lille - Université de Lille, CRIStAL
 * https://loki.lille.inria.fr
 *
 * Licence: Licence.md
 */

import * as THREE from 'three';
import { Mesh, PerspectiveCamera } from 'three';
import { Halfedge, HalfedgeDS } from '../src';

const camera = new PerspectiveCamera();
const mesh = new Mesh();

export function tutorial () {

  /**
   * Code snippet 1 -- Build the structure
   */
  {
    const geometry = new THREE.BoxGeometry();
    const struct = new HalfedgeDS();
    struct.setFromGeometry(geometry, 1e-10);
  }

  /**
   * Code snippet 2 -- Extract the boundary halfedges
   */
  {
    const struct = new HalfedgeDS();
    struct.setFromGeometry(mesh.geometry);
    
    // Get the boundary edges (keep only one halfedge for each pair)
    const boundaries = new Set<Halfedge>();
    for (const halfedge of struct.halfedges) {
      if (!boundaries.has(halfedge.twin) && !halfedge.face) {
        boundaries.add(halfedge);
      }
    }
    console.log("Boundary halfedges", boundaries);
  }

  /**
   * Code snippet 3 -- Get the front faces of a mesh
   */
  {
    const struct = new HalfedgeDS();
    struct.setFromGeometry(mesh.geometry);

    // Get the camera position in mesh's space
    const localCameraPos = mesh.worldToLocal(camera.position.clone());

    //  Get the front faces
    const array = [];
    for (const face of struct.faces) {
      // /!\ Attention: position is considered in geometry local system
      if (face.isFront(localCameraPos)) { 
        array.push(face);
      }
    }
    console.log("Front faces", array);
  }
}