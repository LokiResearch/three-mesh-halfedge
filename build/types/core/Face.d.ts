import { Vector3 } from 'three';
import { Vertex } from './Vertex';
import { Halfedge } from './Halfedge';
export declare class Face {
    halfedge: Halfedge;
    constructor(halfEdge: Halfedge);
    getNormal(target: Vector3): void;
    getMidpoint(target: Vector3): void;
    /**
     * Returns wether the face facing the given position
     *
     * @param position  The position
     * @return `true` if face is front facing, `false` otherwise.
     */
    isFront(position: Vector3): boolean;
    /**
     * Returns the face halfedge containing the given position.
     * @param position Target position
     * @param tolerance Tolerance
     * @returns `HalfEdge` if found, `null` otherwise
     */
    halfedgeFromPosition(position: Vector3, tolerance?: number): Halfedge | null;
    /**
     * Returns the face vertex that matches the given position within the tolerance
     * @param position
     * @param tolerance
     * @returns
     */
    vertexFromPosition(position: Vector3, tolerance?: number): Vertex | null;
    /**
     * Returns the face halfedge starting from the given vertex
  
     * @param vertex
     * @returns
     */
    halfedgeFromVertex(vertex: Vertex): Halfedge | null;
    hasVertex(vertex: Vertex): boolean;
}
//# sourceMappingURL=Face.d.ts.map