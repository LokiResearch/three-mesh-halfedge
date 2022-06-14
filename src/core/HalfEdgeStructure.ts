// Author: Axel Antoine
// mail: ax.antoine@gmail.com
// website: https://axantoine.com
// 23/02/2021

// Loki, Inria project-team with Université de Lille
// within the Joint Research Unit UMR 9189 CNRS-Centrale
// Lille-Université de Lille, CRIStAL.
// https://loki.lille.inria.fr

// LICENCE: Licence.md 

import {BufferGeometry, Vector3} from 'three';
import {Face} from './Face';
import {Vertex} from './Vertex';
import {HalfEdge} from './HalfEdge';

export interface HalfEdgeStructureOptions {
  tolerance?: number;
  hashNormals?: boolean;
}

export class HalfEdgeStructure {

  readonly geometry: BufferGeometry;
  readonly options: Required<HalfEdgeStructureOptions>;
  readonly faces = new Array<Face>();
  readonly vertices = new Array<Vertex>();
  readonly halfEdges = new Array<HalfEdge>();

  constructor(geometry: BufferGeometry, options: HalfEdgeStructureOptions = {}) {
    this.geometry = geometry;
    this.options = {
      hashNormals: false,
      tolerance: 1e-4,
      ...options
    }
  }

  build() {

    this.faces.clear();
    this.vertices.clear();
    this.halfEdges.clear();

    const geometry = this.geometry;
    const options = this.options;

    // Check position and normal attributes
    if (!geometry.hasAttribute("position")) {
      throw "BufferGeometry doesn't have a position BufferAttribute.";
    }

    if (!geometry.hasAttribute("normal")) {
      geometry.computeVertexNormals();
    }

    const positionBuffer = geometry.getAttribute('position');
    const normalBuffer = geometry.getAttribute('normal');

    // Get the merged vertices Array
    const indexVertexArray = mergeVertexIndices(geometry, options.tolerance, options.hashNormals);

    // If the geometry is not indexed, we get the indexes of faces vertices from
    // the position buffer attribute directly in group of 3
    let nbOfFaces = positionBuffer.count/3;
    let getVertexIndex = function(bufferIndex: number) {
      return indexVertexArray[bufferIndex];
    }
    // Otherwise, if the geometry is indexed, we get the index of faces vertices
    // from the index buffer in group of 3
    const indexBuffer = geometry.getIndex();
    if (indexBuffer) {
      nbOfFaces = indexBuffer.count/3;
      getVertexIndex = function(bufferIndex: number) {
        return indexVertexArray[indexBuffer.array[bufferIndex]];
      }
    }

    // To link halfedge twins, we store them as we create them in a map where
    // their hash is <source_vertex_idx>-<destination-vertex-idx>, so that it is
    // easier to find the twin
    const halfEdgeMap = new Map<string, HalfEdge>();
    const vertexMap = new Map<number, Vertex>();

    for (let faceIndex = 0; faceIndex < nbOfFaces; faceIndex++) {

      // Vertices
      const vertices = new Array<Vertex>();
      for (let i=0; i<3; i++) {
        const vertexIndex = getVertexIndex(faceIndex*3 + i);

        let vertex = vertexMap.get(vertexIndex);
        if (!vertex) {
          const position = new Vector3().fromBufferAttribute(positionBuffer, vertexIndex);
          const normal = new Vector3().fromBufferAttribute(normalBuffer, vertexIndex);
          vertex = new Vertex(vertexIndex, position, normal);
          vertexMap.set(vertexIndex, vertex);
          this.vertices.push(vertex);
        }

        vertices.push(vertex);
      }

      // Face
      const face = new Face(faceIndex, vertices[0], vertices[1], vertices[2]);
      this.faces.push(face);

      // Halfedges
      const halfEdges = new Array<HalfEdge>();
      for (let i=0; i<3; i++) {

        // Create new halfEdge starting from the vertex
        const vertex = vertices[i];
        const halfEdge = new HalfEdge(face, vertex);
        vertex.halfEdges.push(halfEdge);

        // Check if the halfEdge twin is already created, if so, link them
        const nextVertex = vertices[(i+1)%3];
        const twinHalfEdgeHash = nextVertex.index+'-'+vertex.index;
        const twin = halfEdgeMap.get(twinHalfEdgeHash);
        if (twin) {
          halfEdge.twin = twin;
          twin.twin = halfEdge;
        }

        // Save the HalfEdge
        const halfEdgeHash = vertex.index+'-'+nextVertex.index;
        halfEdgeMap.set(halfEdgeHash, halfEdge);
        halfEdges.push(halfEdge);
        this.halfEdges.push(halfEdge);
      }

      // Link the halfEdges between them inside the face loop
      for (let i=0; i<3; i++) {
        halfEdges[i].next = halfEdges[(i+2)%3].prev = halfEdges[(i+1)%3];
      }

      // Link one halfEdge to the face
      face.halfEdge = halfEdges[0];
    }
  }
}



/**
 * Returns an array where each index points to its new index in the buffer
 * attribute
 *
 * @param      {BufferGeometry}  geometry             The geometry
 * @param      {number}          [tolerance=1e-4]     The tolerance
 * @param      {boolean}         [hashNormals=false]  The hash normals
 * @return     {Map}             { description_of_the_return_value }
 */

export function mergeVertexIndices(
    geometry: BufferGeometry,
    tolerance = 1e-4,
    hashNormals = false,
){

  // Get position and normal buffer attributes
  if (!geometry.hasAttribute('position')) {
    throw "BufferGeometry doesn't have a 'position' buffer attribute.";
  }

  if (!geometry.hasAttribute('normal')) {
    geometry.computeVertexNormals();
  }

  const positionBuffer = geometry.getAttribute('position');

  const decimalShift = Math.log10(1 / tolerance);
  const shiftMultiplier = Math.pow(10, decimalShift);

  const hashVertexMap = new Map<string, number>();
  const indexVertexArray = new Array<number>();

  const hashBuffers = [positionBuffer];
  if (hashNormals) {
    const normalBuffer = geometry.getAttribute('normal');
    hashBuffers.push(normalBuffer);
  }

  for (let i=0; i < positionBuffer.count; i++) {
    // Compute a hash based on the vertex position (and normal) rounded to a
    // given precision
    let hash = "";
    for (const hashBuffer of hashBuffers) {
      for (let j=0; j<3; j++) {
        hash += `${Math.round(hashBuffer.array[i*3+j] * shiftMultiplier)}`;
      }
    }

    // If hash already exist, then set the buffer index to the existing vertex,
    // otherwise, create it
    let vertexIndex = hashVertexMap.get(hash);
    if (vertexIndex == undefined) {
      vertexIndex = i;
      hashVertexMap.set(hash, i);
    }
    indexVertexArray.push(vertexIndex);
  }
  return indexVertexArray;
}









