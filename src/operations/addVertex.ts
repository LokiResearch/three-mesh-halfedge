/*
 * Author: Axel Antoine
 * mail: ax.antoine@gmail.com
 * website: http://axantoine.com
 * Created on Tue Oct 25 2022
 *
 * Loki, Inria project-team with Université de Lille
 * within the Joint Research Unit UMR 9189 
 * CNRS - Centrale Lille - Université de Lille, CRIStAL
 * https://loki.lille.inria.fr
 *
 * Licence: Licence.md
 */

import { Vector3 } from "three";
import { HalfedgeDS } from "../core/HalfedgeDS";
import { Vertex } from "../core/Vertex";

/**
 * Adds a new {@link Vertex} to the {@link HalfedgeDS} at the given 
 * position and returns it.
 * 
 * @param struct HalfedgeDS to add the new vertex
 * @param position New vertex position
 * @param allowDuplicates Allow multiple vertices at the same position, default false
 * @param tolerance Tolerance used for vertices position comparison
 * @returns 
 */
export function addVertex(
    struct: HalfedgeDS,
    position: Vector3,
    allowDuplicates = false,
    tolerance = 1e-10) {

  // Check if position matches one face vertex and returns it
  if (!allowDuplicates) {
    for (const vertex of struct.vertices) {
      if (vertex.matchesPosition(position, tolerance)) {
        return vertex;
      }
    }
  }
  
  const v = new Vertex();
  v.position.copy(position);
  struct.vertices.add(v);
  return v;
}