// Author: Axel Antoine
// mail: ax.antoine@gmail.com
// website: https://axantoine.com
// 23/02/2021

// Loki, Inria project-team with Université de Lille
// within the Joint Research Unit UMR 9189 CNRS-Centrale
// Lille-Université de Lille, CRIStAL.
// https://loki.lille.inria.fr

// LICENCE: Licence.md 

import {Line3, Vector3} from 'three';
import {Face} from './Face';
import {Vertex} from './Vertex';
import {frontSide} from '../utils/geometry';

const _u = new Vector3();
const _v = new Vector3();
const _line = new Line3();

export class HalfEdge {

  readonly face: Face; // Set during HalfEdgeStructure build
  readonly vertex: Vertex;
  twin?: HalfEdge;
  declare prev: HalfEdge; // Set during HalfEdgeStructure build
  declare next: HalfEdge; // Set during HalfEdgeStructure build

  constructor(face: Face, vertex: Vertex) {
    this.face = face;
    this.vertex = vertex;
  }

  containsPoint(point: Vector3, tolerance = 1e-10): boolean {
    _u.subVectors(this.vertex.position, point)
    _v.subVectors(this.next.vertex.position, point)
    _line.set(this.vertex.position, this.next.vertex.position);
    _line.closestPointToPoint(point, true, _u)
    console.log(_u.distanceTo(point));
    return _u.distanceTo(point) < tolerance;
  }

  normalAtPosition(point: Vector3, target: Vector3) {
    _u.subVectors(this.vertex.position, point);
    _v.subVectors(this.vertex.position, this.next.vertex.position);
    const ratio = _u.length() / _v.length();
    return target.lerpVectors(this.vertex.normal, this.next.vertex.normal, 1-ratio);
  }

  /**
   * Indicates whether the halfedge is a boundary (i.e. it has no twin)
   *
   * @type       {boolean}
   */
  get isBoundary() {
    return this.twin === undefined;
  }

  /**
   * Returns true if the halfedge is concave, false if convexe.
   * IMPORTANT: Returns false if halfedge has no twin.
   *
   * @type       {boolean}
   */
  get isConcave() {
    if (this.twin) {
      return frontSide(
        this.vertex.position,
        this.next.vertex.position,
        this.prev.vertex.position,
        this.twin.prev.vertex.position) > 0;
    }
    return false;
  }

}
