// Author: Axel Antoine
// mail: ax.antoine@gmail.com
// website: https://axantoine.com
// 09/12/2021

// Loki, Inria project-team with Université de Lille
// within the Joint Research Unit UMR 9189 CNRS-Centrale
// Lille-Université de Lille, CRIStAL.
// https://loki.lille.inria.fr

// LICENCE: Licence.md

import {HalfEdgeStructure, mergeVertexIndices} from './HalfEdgeStructure';
import {CylinderGeometry, BoxGeometry, BufferAttribute, BufferGeometry} from 'three';

let geometry: BufferGeometry;
let structure: HalfEdgeStructure;

describe("Cylinder: structure data integrity", () => {

  beforeAll(() => {
  // https://threejs.org/docs/scenes/geometry-browser.html#CylinderGeometry
    geometry = new CylinderGeometry(2, 2, 5, 3, 1, true);
    structure = new HalfEdgeStructure(geometry);
    structure.build();
  })

  test('Expect the structure lists to have a specific length', () => {
    expect(structure.vertices).toHaveLength(6);
    expect(structure.faces).toHaveLength(6);
    expect(structure.halfEdges).toHaveLength(18);
  });

  test("Expect halfedges to have a next halfedge", () => {
    for (const halfEdge of structure.halfEdges) {
      expect(halfEdge.next.next.next).toBe(halfEdge);
    }
  });

  test("Expect halfedges to have a previous halfedge", () => {
    for (const halfEdge of structure.halfEdges) {
      expect(halfEdge.prev.prev.prev).toBe(halfEdge);
    }
  });

  test("Expect halfedges twins to link each other", () => {
    // The cylinder is open ended, so 6 halfedges don't have a twin
    let cpt_twin = 0;
    let cpt_no_twin = 0;

    for (const halfEdge of structure.halfEdges) {
      if (halfEdge.twin) {
        expect(halfEdge.twin.twin).toBe(halfEdge);
        cpt_twin += 1;
      } else {
        cpt_no_twin += 1;
      }
    }

    expect(cpt_twin).toBe(12);
    expect(cpt_no_twin).toBe(6);
  });

  test("Expect vertices to be connected to halfEdges", () => {
    for (const vertex of structure.vertices) {
      expect(vertex.halfEdges).toHaveLength(3);
    }
  });

});

describe("Cube: structure data integrity ", () => {

  describe("Without hash Normals", () => {

    beforeAll(() => {
      geometry = new BoxGeometry(1, 1, 1);
      structure = new HalfEdgeStructure(geometry);
      structure.build();
    })

    test('Expect the structure lists to have a specific length', () => {
      expect(structure.vertices).toHaveLength(8);
      expect(structure.faces).toHaveLength(12);
      expect(structure.halfEdges).toHaveLength(36);
    });

    test('Expect all halfEdges to be have a twin', () => {
      for (const halfEdge of structure.halfEdges) {
        expect(halfEdge.twin).not.toBeNull();
      }
    });

  });

  describe("With hash Normals", () => {

    beforeAll(() => {
      geometry = new BoxGeometry(1, 1, 1);
      structure = new HalfEdgeStructure(geometry, {hashNormals: true});
      structure.build();
    })

    test('Expect the structure lists to have a specific length', () => {
      expect(structure.vertices).toHaveLength(24);
      expect(structure.faces).toHaveLength(12);
      expect(structure.halfEdges).toHaveLength(36);
    });

    test('Expect 2/3 faces\' edges to be connected to one face', () => {
      for (const face of structure.faces) {
        let cpt = 0;
        const startHalfEdge = face.halfEdge;
        let halfEdge = startHalfEdge;
        do {
          if (halfEdge.twin) {
            cpt += 1;
          }
          halfEdge = halfEdge.next;
        } while(halfEdge !== startHalfEdge);

        expect(cpt).toBe(1);
      }
    });

  });

});

describe("<function> getMergedIndices", () => {

  test("Expect position indices to be merged", () => {
    const array = new Int8Array([1,2,3,4,5,6,7,8,9,1,2,3,4,5,6]);
    const buffer = new BufferAttribute(array, 3);
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", buffer);
    const idxArray = mergeVertexIndices(geometry, 1);
    expect(idxArray).toHaveLength(5);
    expect(idxArray[0]).toBe(0);
    expect(idxArray[1]).toBe(1);
    expect(idxArray[2]).toBe(2);
    expect(idxArray[3]).toBe(0);
    expect(idxArray[4]).toBe(1);
  });

  test("Expect decimals to be trunked when precision changes", () => {
    const array = new Float32Array([1.110,2.220,3.330,1.111,2.222,3.333]);
    const buffer = new BufferAttribute(array, 3);
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", buffer);
    let idxArray = mergeVertexIndices(geometry, 1E-1);
    expect(idxArray).toHaveLength(2);
    expect(idxArray[0]).toBe(0);
    expect(idxArray[1]).toBe(0);

    idxArray = mergeVertexIndices(geometry, 1E-2);
    expect(idxArray).toHaveLength(2);
    expect(idxArray[0]).toBe(0);
    expect(idxArray[1]).toBe(0);

    idxArray = mergeVertexIndices(geometry, 1E-3);
    expect(idxArray).toHaveLength(2);
    expect(idxArray[0]).toBe(0);
    expect(idxArray[1]).toBe(1);
  });

});


