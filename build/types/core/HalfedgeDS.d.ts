import { BufferGeometry, Vector3 } from 'three';
import { Face } from './Face';
import { Vertex } from './Vertex';
import { Halfedge } from './Halfedge';
/**
 * Class representing an Halfedge Data Structure
 */
export declare class HalfedgeDS {
    /** @readonly Faces */
    readonly faces: Face[];
    /** @readonly Vertices */
    readonly vertices: Vertex[];
    /** @readonly Halfedges */
    readonly halfedges: Halfedge[];
    /**
     * Sets the halfedge structure from a BufferGeometry.
     * @param geometry BufferGeometry to read
     * @param tolerance Tolerance distance from which positions are considered equal
     */
    setFromGeometry(geometry: BufferGeometry, tolerance?: number): void;
    /**
     * Returns an array of all the halfedge loops in the structure.
     *
     * *Note: Actually returns an array of halfedges from which loop generator
     * can be called*
     *
     * @returns
     */
    loops(): Halfedge[];
    /**
     * Clear the structure data
     */
    clear(): void;
    /**
     * Adds a new vertex to the structure at the given position and returns it.
     * If checkDuplicates is true, returns any existing vertex that matches the
     * given position.
     *
     * @param position New vertex position
     * @param checkDuplicates Enable/disable existing vertex matching, default false
     * @param tolerance Tolerance used for vertices position comparison
     * @returns
     */
    addVertex(position: Vector3, checkDuplicates?: boolean, tolerance?: number): Vertex;
    /**
     * Adds an edge (i.e. a pair of halfedges) between the given vertices.
     * Requires vertices to be free, i.e., there is at least one free halfedge
     * (i.e. without face) in their neighborhood.
     *
     * @param v1 First vertex to link
     * @param v2 Second vertex to link
     * @param allowParallels Allows multiple pair of halfedges between vertices, default false
     * @returns Existing or new halfedge
     */
    addEdge(v1: Vertex, v2: Vertex, allowParallels?: boolean): Halfedge;
    /**
     * Adds a face to an existing halfedge loop
     * @param halfedge
     * @returns
     */
    addFace(halfedges: Halfedge[]): Face;
    /**
     * Removes a vertex from the structure
     * @param vertex Vertex to remove
     * @param mergeFaces If true, merges connected faces if any, otherwise removes them. Default true
     */
    removeVertex(vertex: Vertex, mergeFaces?: boolean): void;
    /**
     * Removes an edge from the structrure
     * @param halfedge Halfedge to remove
     * @param mergeFaces If true, merges connected faces if any, otherwise removes them. Default true
     */
    removeEdge(halfedge: Halfedge, mergeFaces?: boolean): void;
    /**
     * Removes a face from the structure.
     * @param face Face to remove
     */
    removeFace(face: Face): void;
    /**ts
     * Cuts the `face` between the vertices `v1` and `v2`.
     * v1 and v2 must either be vertices of the face or isolated vertices.
     *
     * To test if a new face is created, simply do
     * ```
     *    const halfedge = struct.cutFace(face, v1, v2, true);
     *    if (halfedge.face !== halfedge.twin.face) {
     *      // Halfedge are on different faces / loops
     *      const existingFace = halfedge.face;
     *      const newFace = halfedge.twin.face;
     *    }
     * ```
     *
     *
     * @param face Face to cut
     * @param v1 1st vertex
     * @param v2 2nd vertex
     * @param createNewFace wether to create a new face or not when cutting
     * @returns the cutting halfedge
     */
    cutFace(face: Face, v1: Vertex, v2: Vertex, createNewFace?: boolean): Halfedge;
    /**
     * Splits the halfedge at position and returns the new vertex
     * @param halfEdge The HalfEdge to be splitted
     * @param position Position of the split vertex
     * @returns the new created vertex
     */
    splitEdge(halfedge: Halfedge, position: Vector3, tolerance?: number): Vertex;
}
//# sourceMappingURL=HalfedgeDS.d.ts.map