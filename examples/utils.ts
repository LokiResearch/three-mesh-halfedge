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

import { BoxGeometry, BufferGeometry, CylinderGeometry, Float32BufferAttribute, IcosahedronGeometry, Mesh, Vector3 } from "three";

const vec_ = new Vector3();

/**
 * Removes random triangles from the given buffergeometry
 * @param geometry 
 * @param n 
 * @returns 
 */
export function removeTrianglesFromGeometry(
    geometry: BufferGeometry,
    n: number) {

  if (!geometry.hasAttribute('position')) {
    throw Error("Geometry has no position buffer attribute");
  }

  const index = geometry.getIndex();
  const position = geometry.getAttribute('position');
  
  const nTriangles = index ? index.count/3 : position.count/3;
  n = Math.min(n, nTriangles/3);

  if (n === 0) {
    return;
  }

  const trianglesOmitted = new Set<number>();

  // 
  while (trianglesOmitted.size < n) {
    const idx = Math.round(Math.random()*nTriangles);
    if (!trianglesOmitted.has(idx)) {
      trianglesOmitted.add(idx);
    }
  }

  const array = [];

  if (index) {
    for (let i=0; i<nTriangles; i++) {
      if (!trianglesOmitted.has(i)) {
        for (let j=0; j<3; j++) {
          array.push(index.array[i*3+j]);
        }
      }
    }
    geometry.deleteAttribute('index');
    geometry.setIndex(array);
  } else {
    for (let i=0; i<nTriangles; i++) {
      if (!trianglesOmitted.has(i)) {
        for (let j=0; j<3; j++) {
          vec_.fromBufferAttribute(position, i*3+j);
          array.push(vec_.x, vec_.y, vec_.z);
        }
      }
    }
    geometry.deleteAttribute('position');
    geometry.setAttribute('position', new Float32BufferAttribute(array, 3));
  }
}

export enum Shape {
  Cube = "cube",
  Sphere = "sphere",
  Cylinder = "cylinder"
}
export function setupMeshGeometry(mesh: Mesh, shape: Shape) {

  mesh.geometry.dispose();

  switch (shape) {
  case Shape.Cylinder:
    mesh.geometry = new CylinderGeometry(1, 1, 4, 12, 5, true);
    break;
  case Shape.Sphere:
    mesh.geometry = new IcosahedronGeometry(2, 4);
    break;
  case "cube":
  default:
    mesh.geometry = new BoxGeometry();
  }

}