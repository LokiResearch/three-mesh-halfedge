import { Vector3 } from 'three';
import { Face } from './Face';
import { Vertex } from './Vertex';
export declare class Halfedge {
    vertex: Vertex;
    face: Face | null;
    twin: Halfedge;
    prev: Halfedge;
    next: Halfedge;
    constructor(vertex: Vertex);
    get id(): string;
    containsPoint(point: Vector3, tolerance?: number): boolean;
    /**
     * Indicates whether the halfedge is free (i.e. no connected face)
     *
     * @type       {boolean}
     */
    isFree(): boolean;
    /**
     * Indicated wetcher the halfedge is a boundary (i.e. no connected face but
     * twin has a face)
     */
    isBoundary(): boolean;
    /**
     * Returns true if the halfedge is concave, false if convexe.
     * IMPORTANT: Returns false if halfedge has no twin.
     *
     * @type       {boolean}
     */
    get isConcave(): boolean;
    /**
     * Returns a generator looping over all the next halfedges
     */
    nextLoop(): Generator<Halfedge, null, unknown>;
    /**
     * Returns a generator looping over all the previous halfedges
     */
    prevLoop(): Generator<Halfedge, null, unknown>;
}
//# sourceMappingURL=Halfedge.d.ts.map