import { BufferAttribute, BufferGeometry, InterleavedBufferAttribute } from "three";
import { HalfedgeDS } from "../core/HalfedgeDS";
export declare function setFromGeometry(struct: HalfedgeDS, geometry: BufferGeometry, tolerance?: number): void;
/**
 * Returns an array where each index points to its new index in the buffer
 * attribute
 *
 * @param positions Vertices positions buffer
 * @param tolerance Distance tolerance of the vertices to merge
 * @returns
 */
export declare function computeVerticesIndexArray(positions: BufferAttribute | InterleavedBufferAttribute, tolerance?: number): number[];
//# sourceMappingURL=setFromGeometry.d.ts.map