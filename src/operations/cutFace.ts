/*
 * Author: Axel Antoine
 * mail: ax.antoine@gmail.com
 * website: http://axantoine.com
 * Created on Thu Nov 03 2022
 *
 * Loki, Inria project-team with Université de Lille
 * within the Joint Research Unit UMR 9189 
 * CNRS - Centrale Lille - Université de Lille, CRIStAL
 * https://loki.lille.inria.fr
 *
 * Licence: Licence.md
 */

import { Face } from "../core/Face";
import { Halfedge } from "../core/Halfedge";
import { HalfedgeDS } from "../core/HalfedgeDS";
import { Vertex } from "../core/Vertex";

/**
 * Cuts the given `face` between the vertices `v1` and `v2`. 
 * 
 * @param struct The {@link HalfedgeDS} the `face` belongs to
 * @param face Face to cut
 * @param v1 1st vertex
 * @param v2 2nd vertex
 * @returns the new face
 */
export function cutFace(
    struct: HalfedgeDS,
    face: Face,
    v1: Vertex,
    v2: Vertex){
  
  if (!struct.faces.has(face)) {
    throw new Error('Face does not belong to struct');
  }

  if (!struct.vertices.has(v1)) {
    throw new Error('Vertex v1 does not belong to struct');
  }
  
  if (!struct.vertices.has(v2)) {
    throw new Error('Vertex v2 does not belong to struct');
  }

  if (v1 === v2) {
    throw new Error('Vertices v1 and v2 should be different');
  }

  const he1 = face.halfedgeFromVertex(v1);
  if (!he1) {
    throw new Error('Vertices v1 does not belong to face');
  }

  const he2 = face.halfedgeFromVertex(v2);
  if (!he2) {
    throw new Error('Vertices v2 does not belong to face');
  }

  // Check if v1 is already connected to v2 in the face
  if (he1.next.vertex === v1 || he1.prev.vertex === v2) {
    throw new Error("Vertices v1 and v2 are already connected");
  }

  /**
   *          From                    To
   *
   *    o → → → v1 → → → o       o → → → v1 → → → o              
   *      ↖            ↙           ↖  f  ↓↑  f' ↙       
   *        ↖    f   ↙               ↖   ↓↑   ↙    
   *          ↖    ↙                   ↖ ↓↑ ↙  
   *            v2                       v2
   */  

  // Create new halfedges
  const v1v2 = new Halfedge(v1);
  const v2v1 = new Halfedge(v2);
  v1v2.twin = v2v1;
  v2v1.twin = v1v2;

  // Update refs for new halfedges
  v1v2.prev = he1.prev;
  v1v2.next = he2;
  v2v1.prev = he2.prev;
  v2v1.next = he1;

  // Link new halfedges to existing halfedges
  he1.prev = v2v1;
  he2.prev = v1v2;

  // Add the new halfEdges to the corresponding starting vertex
  v1.halfedge = v1v2;
  v2.halfedge = v2v1;

  // Update face refs
  face.halfedge = v1v2;
  v1v2.face = face;
  
  const newFace = new Face(v2v1);
  // Update the halfedge loop
  for (const he of v2v1.nextLoop()) {
    he.face = newFace;
  }

  struct.faces.add(newFace);
  struct.halfedges.add(v1v2);
  struct.halfedges.add(v2v1);

  return newFace;
}