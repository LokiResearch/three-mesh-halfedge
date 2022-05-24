// Author: Axel Antoine
// mail: ax.antoine@gmail.com
// website: https://axantoine.com
// 17/03/2021

// Loki, Inria project-team with Université de Lille
// within the Joint Research Unit UMR 9189 CNRS-Centrale
// Lille-Université de Lille, CRIStAL.
// https://loki.lille.inria.fr

// LICENCE: Licence.md 

import {Vector3, Triangle} from 'three';
import {HalfEdge} from './HalfEdge';
import {Vertex} from './Vertex';

const _viewVector = new Vector3();
const _u = new Vector3();

export class Face {

  declare halfEdge: HalfEdge;
  readonly index: number;
  readonly triangle = new Triangle();
  readonly normal = new Vector3();
  readonly midpoint = new Vector3();

  constructor(index: number, a: Vertex, b: Vertex, c: Vertex) {
    this.index = index;

    this.triangle.set(
      a.position,
      b.position,
      c.position
    );
    this.triangle.getNormal(this.normal);
    this.triangle.getMidpoint(this.midpoint);
  }

  /**
   * Returns wether the face is a front regarding the given position
   *
   * @param      {Vector3}  position  The position
   * @return     {boolean}  True if the specified position is front, False otherwise.
   */
  isFront(position: Vector3) {
    return _viewVector
      .subVectors(position, this.midpoint)
      .normalize()
      .dot(this.normal) >= 0;
  }

  /**
  * Return the face halfEdge containing the given position within the tolerance
  *
  * @param      {Vector3}          position           The position
  * @param      {number}           [tolerance=1e-10]  The tolerance
  * @return     {(HalfEdge|null)}  { description_of_the_return_value }
  */
  halfEdgeFromPosition(position: Vector3, tolerance = 1e-10): HalfEdge | null {

    const startHalfEdge = this.halfEdge;
    let halfEdge = startHalfEdge;
    do {
      if (halfEdge.containsPoint(position, tolerance)) {
        return halfEdge;
      }
      halfEdge = halfEdge.next;
    } while(halfEdge != startHalfEdge);

    return null;
  }

  /**
  * Returns the face vertex that matches the given position within the tolerance
  *
  * @param      {Vector3}        position           The position
  * @param      {number}         [tolerance=1e-10]  The tolerance
  * @return     {(Vertex|null)}  { description_of_the_return_value }
  */
  vertexFromPosition(position: Vector3, tolerance = 1e-10): Vertex | null {

    const startHalfEdge = this.halfEdge;
    let halfEdge = startHalfEdge;
    do {
      // Check if position is close enough to the vertex position within the
      // provided tolerance
      _u.subVectors(halfEdge.vertex.position, position);

      if (_u.length() < tolerance) {
        return halfEdge.vertex;
      }

      halfEdge = halfEdge.next;
    } while(halfEdge != startHalfEdge);

    return null;
  }

  /**
   * Returns the face halfEdge starting from the given vertex
   *
   * @param      {Vertex}  vertex  The vertex
   * @return     {<type>}  { description_of_the_return_value }
   */
  halfEdgeFromVertex(vertex: Vertex) {
    const startHalfEdge = this.halfEdge;
    let halfEdge = startHalfEdge;
    do {
      if (halfEdge.vertex === vertex) {
        return halfEdge;
      }

      halfEdge = halfEdge.next;
    } while(halfEdge != startHalfEdge);

    return null;

  }

}



