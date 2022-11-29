/// <reference types="jest" />
import { Halfedge } from "../core/Halfedge";
import { Vertex } from "../core/Vertex";
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeHalfedge(expected: Halfedge): CustomMatcherResult;
            toBeVertex(expected: Vertex): CustomMatcherResult;
            toBeOneOfHalfedges(expected: Halfedge[]): CustomMatcherResult;
        }
    }
}
export declare function generatorSize(g: Generator): number;
export declare function generatorToArray<T>(g: Generator<T>): T[];
//# sourceMappingURL=testutils.d.ts.map