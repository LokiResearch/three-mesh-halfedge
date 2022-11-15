/*
 * Author: Axel Antoine
 * mail: ax.antoine@gmail.com
 * website: http://axantoine.com
 * Created on Fri Nov 04 2022
 *
 * Loki, Inria project-team with Université de Lille
 * within the Joint Research Unit UMR 9189 
 * CNRS - Centrale Lille - Université de Lille, CRIStAL
 * https://loki.lille.inria.fr
 *
 * Licence: Licence.md
 */

import { Face } from "../core/Face";
import { HalfedgeDS } from "../core/HalfedgeDS";

/**
 * Removes the given face from the HalfedgeStructure.
 * @param struct 
 * @param face 
 */
export function removeFace(
    struct: HalfedgeDS,
    face: Face) {
  
  if (!struct.faces.has(face)) {
    throw new Error('Face does not belong to struct');
  }

  // Remove face ref from halfedges loop
  for (const halfedge of face.halfedge.nextLoop()) {
    halfedge.face = null;
  }

  // Remove face from struct
  struct.faces.delete(face);
}
