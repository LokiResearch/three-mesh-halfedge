import { Vector3 } from 'three';
import type { Face } from './Face';
import { Halfedge } from './Halfedge';
export declare class Vertex {
    /** Vertex position */
    readonly position: Vector3;
    /** Reference to one halfedge starting from the vertex */
    halfedge: Halfedge | null;
    id: number;
    constructor();
    /**
     * Returns a generator of free halfedges starting from this vertex.
     * @param start The halfedge to start, default is vertex halfedge
     */
    freeHalfedgesOutLoop(start?: Halfedge | null): Generator<Halfedge, null, unknown>;
    /**
     * Returns a generator of free halfedges arriving to this vertex.
     * @param start The halfedge to start, default is vertex halfedge
    */
    freeHalfedgesInLoop(start?: Halfedge | null): Generator<Halfedge, null, unknown>;
    /**
     * Returns a generator of boundary halfedges starting from this vertex.
     * @param start The halfedge to start, default is vertex halfedge
     */
    boundaryHalfedgesOutLoop(start?: Halfedge | null): Generator<Halfedge, null, unknown>;
    /**
     * Returns a generator of boundary halfedges arriving to this vertex.
     * @param start The halfedge to start, default is vertex halfedge
    */
    boundaryHalfedgesInLoop(start?: Halfedge | null): Generator<Halfedge, null, unknown>;
    /**
     * Returns whether the vertex is free, i.e. on of its ongoing halfedge has no
     * face.
     *
     * @ref https://kaba.hilvi.org/homepage/blog/halfedge/halfedge.htm
     *
     * @returns `true` if free, `false` otherwise
     */
    isFree(): boolean;
    isIsolated(): boolean;
    commonFacesWithVertex(other: Vertex): Face[];
    /**
     * Checkes whether the vertex matches the given position
     *
     * @param      {Vector3}  position           The position
     * @param      {number}   [tolerance=1e-10]  The tolerance
     * @return     {boolean}
     */
    matchesPosition(position: Vector3, tolerance?: number): boolean;
    /**
     * Returns the halfedge going from *this* vertex to *other* vertex if any.
     * @param other The other vertex
     * @returns `HalfEdge` if found, `null` otherwise.
     */
    getHalfedgeToVertex(other: Vertex): Halfedge | null;
    isConnectedToVertex(other: Vertex): boolean;
    /**
     * Returns a generator of halfedges starting from this vertex in CW order.
     * @param start The halfedge to start looping, default is vertex halfedge
     */
    loopCW(start?: Halfedge | null): Generator<Halfedge, null, unknown>;
    /**
     * Returns a generator of halfedges starting from this vertex in CCW order.
     * @param start The halfedge to start, default is vertex halfedge
     */
    loopCCW(start?: Halfedge | null): Generator<Halfedge, null, unknown>;
}
//# sourceMappingURL=Vertex.d.ts.map