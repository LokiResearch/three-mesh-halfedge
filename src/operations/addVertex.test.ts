/*
 * Author: Axel Antoine
 * mail: ax.antoine@gmail.com
 * website: http://axantoine.com
 * Created on Wed Nov 09 2022
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
import { addVertex } from "./addVertex";

const v1 = new Vertex();
v1.position.set(2, 3, 4);
const position = new Vector3();
const struct = new HalfedgeDS();

beforeEach(() => {
  struct.clear();
  struct.vertices.add(v1);
});

test("Add vertex new position", () => {

  position.set(1,2,3);
  const v = addVertex(struct, position);

  expect(struct.vertices.size).toBe(2);
  expect(struct.vertices.has(v)).toBeTruthy();

});

describe ("Add vertex existing position", () => {

  test("duplicates not allowed", () => {
    position.set(2, 3, 4);
    const v = addVertex(struct, position);

    expect(struct.vertices.size).toBe(1);
    expect(v).toBe(v1);
  });

  test("duplicates allowed", () => {
    position.set(2, 3, 4);
    const v = addVertex(struct, position, true);

    expect(struct.vertices.size).toBe(2);
    expect(struct.vertices.has(v)).toBeTruthy();
    expect(v).not.toBe(v1);
  });


});

