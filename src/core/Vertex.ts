// Author: Axel Antoine
// mail: ax.antoine@gmail.com
// website: https://axantoine.com
// 17/03/2021

// Loki, Inria project-team with Université de Lille
// within the Joint Research Unit UMR 9189 CNRS-Centrale
// Lille-Université de Lille, CRIStAL.
// https://loki.lille.inria.fr

// LICENCE: Licence.md 

import {Vector3} from 'three';
import {HalfEdge} from './HalfEdge';

const _u = new Vector3();

export class Vertex {
  /**
   * Vertex index in the buffer attribute
   */
  readonly index: number;

  /**
   * Vertex position
   */
  readonly position: Vector3;
  /**
   * Vertex normal
   */
  readonly normal: Vector3;

  /**
   * List of halfEdges starting from this Vertex
   */
  readonly halfEdges = new Array<HalfEdge>();

  constructor(index: number, position: Vector3, normal: Vector3) {
    this.index = index;
    this.position = position;
    this.normal = normal;
  }

  /**
   * List of boundary halfedges starting from or arriving to this vertex.
   */
  connectedBoundaryHalfEdges() {
    const array = new Array<HalfEdge>();
    for (const halfEdge of this.halfEdges) {
      if (!halfEdge.twin) {
        array.push(halfEdge);
      }

      if (!halfEdge.prev.twin) {
        array.push(halfEdge.prev);
      }
    }
    return array;
  }

  /**
   * Checkes whether the vertex matches the given position
   *
   * @param      {Vector3}  position           The position
   * @param      {number}   [tolerance=1e-10]  The tolerance
   * @return     {boolean}
   */
  matchesPosition(position: Vector3, tolerance = 1e-10): boolean {
    _u.subVectors(position, this.position);
    return _u.length() < tolerance;
  }

}


