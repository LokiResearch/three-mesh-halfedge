(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three')) :
    typeof define === 'function' && define.amd ? define(['exports', 'three'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.MeshHalfEdgeLib = {}, global.three));
})(this, (function (exports, three) { 'use strict';

    // Author: Axel Antoine
    const EPSILON = 1e-10;
    // See https://hal.inria.fr/hal-02189483 appendix C.2 Orientation test
    const _matrix = new three.Matrix4();
    function orient3D(a, b, c, d) {
        _matrix.set(a.x, a.y, a.z, 1, b.x, b.y, b.z, 1, c.x, c.y, c.z, 1, d.x, d.y, d.z, 1);
        const det = _matrix.determinant();
        if (det > EPSILON) {
            return 1;
        }
        else if (det < -EPSILON) {
            return -1;
        }
        return 0;
    }
    // See https://hal.inria.fr/hal-02189483 appendix C.2 Orientation test
    function frontSide(a, b, c, d) {
        return orient3D(d, b, c, a);
    }

    // Author: Axel Antoine
    const _u$1 = new three.Vector3();
    const _v = new three.Vector3();
    const _line = new three.Line3();
    class Halfedge {
        vertex;
        // Set during the stucture build phase
        face = null;
        constructor(vertex) {
            this.vertex = vertex;
        }
        get id() {
            return this.vertex.id + '-' + this.twin.vertex.id;
        }
        containsPoint(point, tolerance = 1e-10) {
            _u$1.subVectors(this.vertex.position, point);
            _v.subVectors(this.next.vertex.position, point);
            _line.set(this.vertex.position, this.next.vertex.position);
            _line.closestPointToPoint(point, true, _u$1);
            return _u$1.distanceTo(point) < tolerance;
        }
        /**
         * Indicates whether the halfedge is free (i.e. no connected face)
         *
         * @type       {boolean}
         */
        isFree() {
            return this.face === null;
        }
        /**
         * Indicated wetcher the halfedge is a boundary (i.e. no connected face but
         * twin has a face)
         */
        isBoundary() {
            return this.face === null && this.twin.face !== null;
        }
        /**
         * Returns true if the halfedge is concave, false if convexe.
         * IMPORTANT: Returns false if halfedge has no twin.
         *
         * @type       {boolean}
         */
        get isConcave() {
            if (this.twin) {
                return frontSide(this.vertex.position, this.next.vertex.position, this.prev.vertex.position, this.twin.prev.vertex.position) > 0;
            }
            return false;
        }
        /**
         * Returns a generator looping over all the next halfedges
         */
        *nextLoop() {
            const start = this;
            let curr = start;
            do {
                yield curr;
                curr = curr.next;
            } while (curr !== start);
            return null;
        }
        /**
         * Returns a generator looping over all the previous halfedges
         */
        *prevLoop() {
            const start = this;
            let curr = start;
            do {
                yield curr;
                curr = curr.next;
            } while (curr !== start);
            return null;
        }
    }

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
    function addEdge(struct, v1, v2, allowParallels = false) {
        if (v1 === v2) {
            throw new Error('Vertices v1 and v2 should be different');
        }
        if (!allowParallels) {
            // Check if v1 and v2 are already connected
            const currentHalfEdge = v1.getHalfedgeToVertex(v2);
            if (currentHalfEdge) {
                return currentHalfEdge;
            }
        }
        if (!v1.isFree() || !v2.isFree()) {
            throw new Error('Vertices v1 and v2 are not free');
        }
        // Create new halfedges, by default twin halfedges are connected together
        // as prev/next in case vertices are isolated
        const h1 = new Halfedge(v1);
        const h2 = new Halfedge(v2);
        h1.twin = h2;
        h1.next = h2;
        h1.prev = h2;
        h2.twin = h1;
        h2.next = h1;
        h2.prev = h1;
        /*
         *        ↖       ↙
         *   out2   ↖   ↙   in2
         *            v2
         *            ⇅
         *            ⇅
         *        h1  ⇅  h2
         *            ⇅
         *            ⇅
         *            v1
         *    in1  ↗     ↘  out1
         *       ↗         ↘
         *
         */
        // Update refs around v1 if not isolated
        const in1 = v1.freeHalfedgesInLoop().next().value;
        if (in1) {
            const out1 = in1.next;
            h1.prev = in1;
            in1.next = h1;
            h2.next = out1;
            out1.prev = h2;
        }
        else {
            v1.halfedge = h1;
        }
        // Update refs around v2 if not isolated
        const in2 = v2.freeHalfedgesInLoop().next().value;
        if (in2) {
            const out2 = in2.next;
            h2.prev = in2;
            in2.next = h2;
            h1.next = out2;
            out2.prev = h1;
        }
        else {
            v2.halfedge = h2;
        }
        struct.halfedges.push(h1);
        struct.halfedges.push(h2);
        return h1;
    }

    // Author: Axel Antoine
    const _viewVector = new three.Vector3();
    const _normal = new three.Vector3();
    const _triangle = new three.Triangle();
    const _vec = new three.Vector3();
    class Face {
        halfedge;
        constructor(halfEdge) {
            this.halfedge = halfEdge;
        }
        getNormal(target) {
            _triangle.set(this.halfedge.prev.vertex.position, this.halfedge.vertex.position, this.halfedge.next.vertex.position);
            _triangle.getNormal(target);
        }
        getMidpoint(target) {
            _triangle.set(this.halfedge.prev.vertex.position, this.halfedge.vertex.position, this.halfedge.next.vertex.position);
            _triangle.getNormal(target);
        }
        /**
         * Returns wether the face facing the given position
         *
         * @param position  The position
         * @return `true` if face is front facing, `false` otherwise.
         */
        isFront(position) {
            this.getNormal(_normal);
            return _viewVector
                .subVectors(position, this.halfedge.vertex.position)
                .normalize()
                .dot(_normal) >= 0;
        }
        /**
         * Returns the face halfedge containing the given position.
         * @param position Target position
         * @param tolerance Tolerance
         * @returns `HalfEdge` if found, `null` otherwise
         */
        halfedgeFromPosition(position, tolerance = 1e-10) {
            for (const he of this.halfedge.nextLoop()) {
                if (he.containsPoint(position, tolerance)) {
                    return he;
                }
            }
            return null;
        }
        /**
         * Returns the face vertex that matches the given position within the tolerance
         * @param position
         * @param tolerance
         * @returns
         */
        vertexFromPosition(position, tolerance = 1e-10) {
            for (const he of this.halfedge.nextLoop()) {
                // Check if position is close enough to the vertex position within the
                // provided tolerance
                _vec.subVectors(he.vertex.position, position);
                if (_vec.length() < tolerance) {
                    return he.vertex;
                }
            }
            return null;
        }
        /**
         * Returns the face halfedge starting from the given vertex
      
         * @param vertex
         * @returns
         */
        halfedgeFromVertex(vertex) {
            for (const he of this.halfedge.nextLoop()) {
                if (he.vertex === vertex) {
                    return he;
                }
            }
            return null;
        }
        hasVertex(vertex) {
            for (const he of this.halfedge.nextLoop()) {
                if (he.vertex === vertex) {
                    return true;
                }
            }
            return false;
        }
    }

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
    function addFace(struct, halfedges) {
        const size = halfedges.length;
        if (size < 2) {
            throw new Error("At least 3 halfedges required to build a face.");
        }
        // Make some checks before changing topology
        for (let i = 0; i < size; i++) {
            const curr = halfedges[i];
            const next = halfedges[(i + 1) % size];
            if (curr.face) {
                throw new Error("Halfedge already has a face");
            }
            if (curr.twin.vertex !== next.vertex) {
                throw new Error("Halfedges do not form a chain");
            }
        }
        // Add the face  
        for (let i = 0; i < size; i++) {
            const curr = halfedges[i];
            const next = halfedges[(i + 1) % size];
            if (!makeHalfedgesAdjacent(curr, next)) {
                throw new Error('Face cannot be created: mesh would be non manifold.');
            }
        }
        const face = new Face(halfedges[0]);
        for (const halfedge of halfedges) {
            halfedge.face = face;
        }
        struct.faces.push(face);
        return face;
    }
    /**
     *
     *
     * @see https://kaba.hilvi.org/homepage/blog/halfedge/halfedge.htm
     *
     * @param
     * @param out
     * @returns
     */
    function makeHalfedgesAdjacent(halfIn, halfOut) {
        if (halfIn.next === halfOut) {
            // Adjacency is alrady correct
            return true;
        }
        // Find a boundary halfedge different from out.twin and in 
        let g = null;
        const loop = halfOut.vertex.freeHalfedgesInLoop(halfOut);
        let he = loop.next();
        while (!g && !he.done) {
            if (he.value !== halfIn) {
                g = he.value;
            }
            he = loop.next();
        }
        if (!g) {
            return false;
        }
        const b = halfIn.next;
        const d = halfOut.prev;
        const h = g.next;
        halfIn.next = halfOut;
        halfOut.prev = halfIn;
        g.next = b;
        b.prev = g;
        d.next = h;
        h.prev = d;
        return true;
    }

    // Author: Axel Antoine
    const _u = new three.Vector3();
    let _idCount = 0;
    class Vertex {
        /** Vertex position */
        position = new three.Vector3();
        /** Reference to one halfedge starting from the vertex */
        halfedge = null;
        id;
        constructor() {
            this.id = _idCount;
            _idCount++;
        }
        /**
         * Returns a generator of free halfedges starting from this vertex.
         * @param start The halfedge to start, default is vertex halfedge
         */
        *freeHalfedgesOutLoop(start = this.halfedge) {
            for (const halfedge of this.loopCW(start)) {
                if (halfedge.isFree()) {
                    yield halfedge;
                }
            }
            return null;
        }
        /**
         * Returns a generator of free halfedges arriving to this vertex.
         * @param start The halfedge to start, default is vertex halfedge
        */
        *freeHalfedgesInLoop(start = this.halfedge) {
            for (const halfedge of this.loopCW(start)) {
                if (halfedge.twin.isFree()) {
                    yield halfedge.twin;
                }
            }
            return null;
        }
        /**
         * Returns a generator of boundary halfedges starting from this vertex.
         * @param start The halfedge to start, default is vertex halfedge
         */
        *boundaryHalfedgesOutLoop(start = this.halfedge) {
            for (const halfedge of this.loopCW(start)) {
                if (halfedge.isBoundary()) {
                    yield halfedge;
                }
            }
            return null;
        }
        /**
         * Returns a generator of boundary halfedges arriving to this vertex.
         * @param start The halfedge to start, default is vertex halfedge
        */
        *boundaryHalfedgesInLoop(start = this.halfedge) {
            for (const halfedge of this.loopCW(start)) {
                if (halfedge.twin.isBoundary()) {
                    yield halfedge.twin;
                }
            }
            return null;
        }
        /**
         * Returns whether the vertex is free, i.e. on of its ongoing halfedge has no
         * face.
         *
         * @ref https://kaba.hilvi.org/homepage/blog/halfedge/halfedge.htm
         *
         * @returns `true` if free, `false` otherwise
         */
        isFree() {
            if (this.isIsolated()) {
                return true;
            }
            for (const halfEdge of this.loopCW()) {
                if (halfEdge.isFree()) {
                    return true;
                }
            }
            return false;
        }
        isIsolated() {
            return this.halfedge === null;
        }
        commonFacesWithVertex(other) {
            const faces = new Array();
            for (const halfedge of this.loopCW()) {
                if (halfedge.face && halfedge.face.hasVertex(other)) {
                    faces.push(halfedge.face);
                }
            }
            return faces;
        }
        /**
         * Checkes whether the vertex matches the given position
         *
         * @param      {Vector3}  position           The position
         * @param      {number}   [tolerance=1e-10]  The tolerance
         * @return     {boolean}
         */
        matchesPosition(position, tolerance = 1e-10) {
            _u.subVectors(position, this.position);
            return _u.length() < tolerance;
        }
        /**
         * Returns the halfedge going from *this* vertex to *other* vertex if any.
         * @param other The other vertex
         * @returns `HalfEdge` if found, `null` otherwise.
         */
        getHalfedgeToVertex(other) {
            for (const halfEdge of this.loopCW()) {
                if (halfEdge.twin.vertex === other) {
                    return halfEdge;
                }
            }
            return null;
        }
        isConnectedToVertex(other) {
            return this.getHalfedgeToVertex(other) !== null;
        }
        /**
         * Returns a generator of halfedges starting from this vertex in CW order.
         * @param start The halfedge to start looping, default is vertex halfedge
         */
        *loopCW(start = this.halfedge) {
            if (start && start.vertex === this) {
                let curr = start;
                do {
                    yield curr;
                    curr = curr.twin.next;
                } while (curr != start);
            }
            return null;
        }
        /**
         * Returns a generator of halfedges starting from this vertex in CCW order.
         * @param start The halfedge to start, default is vertex halfedge
         */
        *loopCCW(start = this.halfedge) {
            if (start && start.vertex === this) {
                let curr = start;
                do {
                    yield curr;
                    curr = curr.prev.twin;
                } while (curr != start);
            }
            return null;
        }
    }

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
    function addVertex(struct, position, checkDuplicates = false, tolerance = 1e-10) {
        // Check if position matches one face vertex and returns it
        if (checkDuplicates) {
            for (const vertex of struct.vertices) {
                if (vertex.matchesPosition(position, tolerance)) {
                    return vertex;
                }
            }
        }
        const v = new Vertex();
        v.position.copy(position);
        struct.vertices.push(v);
        return v;
    }

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
    function removeFace(struct, face) {
        if (!struct.faces.remove(face)) {
            return;
        }
        // Remove face ref from halfedges loop
        for (const halfedge of face.halfedge.nextLoop()) {
            halfedge.face = null;
        }
    }

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
    function removeEdge(struct, halfedge, mergeFaces = true) {
        /*
         *      ↖           ↙
         *        ↖       ↙
         *          ↖   ↙
         *            v2
         *            ⇅
         *            ⇅
         *        he  ⇅  twin
         *            ⇅
         *            v1
         *         ↗     ↘
         *       ↗         ↘
         *     ↗             ↘
         *
         */
        const twin = halfedge.twin;
        if (mergeFaces && halfedge.face && twin.face) {
            // Keep only one face in both faces for halfedge and twin exist, and update
            // ref
            removeFace(struct, twin.face);
            halfedge.face.halfedge = halfedge.prev;
        }
        else {
            // Remove both faces
            if (halfedge.face) {
                removeFace(struct, halfedge.face);
            }
            if (twin.face) {
                removeFace(struct, twin.face);
            }
        }
        // Update topology around v1
        const v1 = halfedge.vertex;
        if (twin.next === halfedge) {
            // v1 is now isolated
            v1.halfedge = null;
        }
        else {
            v1.halfedge = twin.next;
            halfedge.prev.next = twin.next;
            twin.next.prev = halfedge.prev;
        }
        // Update topology around v2
        const v2 = twin.vertex;
        if (halfedge.next === twin) {
            // v2 is now isolated
            v2.halfedge = null;
        }
        else {
            v2.halfedge = halfedge.next;
            halfedge.next.prev = twin.prev;
            twin.prev.next = halfedge.next;
        }
        // Remove halfedges from struct
        struct.halfedges.remove(halfedge);
        struct.halfedges.remove(twin);
    }

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
    /*
     *         From                            To
     *
     *
     *            o                              o
     *          ↙ ⇅ ↖                          ↙   ↖
     *        ↙   ⇅   ↖                      ↙       ↖
     *      ↙ f1  ⇅  f4 ↖                  ↙           ↖
     *    ↙       ⇅       ↖              ↙               ↖
     *  o ⇄ ⇄ ⇄ ⇄ v ⇄ ⇄ ⇄ ⇄ o          o         f         o
     *    ↘       ⇅       ↗              ↘               ↗
     *      ↘ f2  ⇅  f3 ↗                  ↘           ↗
     *        ↘   ⇅   ↗                      ↘       ↗
     *          ↘ ⇅ ↗                          ↘   ↗
     *            o                              o
     *
     * If all halfedges starting from vertex v to delete are connected to a face,
     * then we create a new face v.
     * If some of the halfedges starting from v are boundaries (i.e. no face),
     * then we can't create a new face.
     *
     */
    function removeVertex(struct, vertex, mergeFaces = true) {
        for (const halfedge of vertex.loopCW()) {
            removeEdge(struct, halfedge, mergeFaces);
        }
        struct.vertices.remove(vertex);
    }

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
    function cutFace(struct, face, v1, v2, createNewFace = true) {
        if (v1 === v2) {
            throw new Error('Vertices v1 and v2 should be different');
        }
        let out1 = face.halfedgeFromVertex(v1);
        if (!out1 && !v1.isFree()) {
            throw new Error('Vertices v1 does not belong to face nor is free');
        }
        let out2 = face.halfedgeFromVertex(v2);
        if (!out2 && !v2.isFree()) {
            throw new Error('Vertices v2 does not belong to face nor is free');
        }
        // Check if v1 is already connected to v2 in the face
        if ((out1 && out1.next.vertex === v2) || (out2 && out2.next.vertex === v1)) {
            throw new Error("Vertices v1 and v2 are already connected");
        }
        /*
         *          From                    To
         *
         *    o → → → v1 → → → o       o → → → v1 → → → o
         *      ↖            ↙           ↖  f  ↓↑  f' ↙
         *        ↖    f   ↙               ↖   ↓↑   ↙
         *          ↖    ↙                   ↖ ↓↑ ↙
         *            v2                       v2
         *
         *                        or
         *
         *    o → → → o → → → o        o → → → v1 → → → o
         *      ↖   f ↓↑     ↙           ↖  f  ↓↑  f' ↙
         *        ↖   v1   ↙               ↖   ↓↑   ↙
         *          ↖    ↙                   ↖ ↓↑ ↙
         *            v2                       v2
         *
         *  --------------------------------------
         *
         *        ↖       ↙
         *   out2   ↖   ↙   in2
         *            v2
         *            ⇅
         *            ⇅
         *        h1  ⇅  h2
         *            ⇅
         *            ⇅
         *            v1
         *    in1  ↗     ↘  out1
         *       ↗         ↘
         *
         */
        // Create new halfedges
        const h1 = new Halfedge(v1);
        const h2 = new Halfedge(v2);
        h1.face = face;
        h2.face = face;
        h1.twin = h2;
        h1.next = h2;
        h1.prev = h2;
        h2.twin = h1;
        h2.next = h1;
        h2.prev = h1;
        // If v1 is not part of face, get any outgoing halfedge
        out1 = out1 ?? v1.freeHalfedgesOutLoop().next().value;
        // Update refs around v1 if not isolated
        if (out1) {
            const in1 = out1.prev;
            h1.prev = in1;
            in1.next = h1;
            h2.next = out1;
            out1.prev = h2;
        }
        else {
            v1.halfedge = h1;
        }
        // If v2 is not part of face, get any outgoing halfedge
        out2 = out2 ?? v2.freeHalfedgesOutLoop().next().value;
        // Update refs around v2 if not isolated
        if (out2) {
            const in2 = out2.prev;
            h2.prev = in2;
            in2.next = h2;
            h1.next = out2;
            out2.prev = h1;
        }
        else {
            v2.halfedge = h2;
        }
        struct.halfedges.push(h1);
        struct.halfedges.push(h2);
        // In the case where we connect isolated halfedge (without face) to this face, 
        // We update face ref loop
        for (const he of face.halfedge.nextLoop()) {
            he.face = face;
        }
        // Check if h1 and h2 (twin halfedges) are on the same loop, if there aren't,
        // it means we created a new halfedges loop, i.e. new face
        let found = false;
        const loop = h1.nextLoop();
        let h = loop.next();
        while (!found && !h.done) {
            found = h.value === h2;
            h = loop.next();
        }
        if (!found) {
            // h2 is on a different loop than h1
            // Update initial face halfedge reference in case it changed loop 
            face.halfedge = h1;
            let newFace = null;
            if (createNewFace) {
                newFace = new Face(h2);
                struct.faces.push(newFace);
            }
            // Update the face ref for each halfedge of the new loop either a new face
            // or null
            for (const h of h2.nextLoop()) {
                h.face = newFace;
            }
        }
        return h1;
    }

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
    function splitEdge(struct, halfedge, position, tolerance = 1e-10) {
        /**
         * From
         *            A -------------- he -------------> B
         *            A <------------ twin ------------- B
         * To
         *            A ---- he ----> v ---- newhe ----> B
         *            A <--- twin --- v <--- newtwin --- B
         */
        const twin = halfedge.twin;
        const A = halfedge.vertex;
        const B = twin.vertex;
        // No need to split if position matches A or B
        if (A.matchesPosition(position, tolerance)) {
            return A;
        }
        if (B.matchesPosition(position, tolerance)) {
            return B;
        }
        const newVertex = new Vertex();
        newVertex.position.copy(position);
        // Create the new halfegdes
        const newHalfedge = new Halfedge(newVertex);
        const newTwin = new Halfedge(B);
        newHalfedge.twin = newTwin;
        newTwin.twin = newHalfedge;
        // Update vertices halfedge refs
        A.halfedge = halfedge;
        newVertex.halfedge = newHalfedge;
        B.halfedge = newTwin;
        // Copy the face refs
        newHalfedge.face = halfedge.face;
        newTwin.face = twin.face;
        // Update next and prev refs
        newHalfedge.next = halfedge.next;
        newHalfedge.prev = halfedge;
        halfedge.next = newHalfedge;
        newTwin.next = twin;
        newTwin.prev = twin.prev;
        twin.prev = newTwin;
        // Update structure
        struct.vertices.push(newVertex);
        struct.halfedges.push(newHalfedge);
        struct.halfedges.push(newTwin);
        return newVertex;
    }

    /*
     * Author: Axel Antoine
     * mail: ax.antoine@gmail.com
     * website: http://axantoine.com
     * Created on Fri Nov 18 2022
     *
     * Loki, Inria project-team with Université de Lille
     * within the Joint Research Unit UMR 9189
     * CNRS - Centrale Lille - Université de Lille, CRIStAL
     * https://loki.lille.inria.fr
     *
     * Licence: Licence.md
     */
    const pos_ = new three.Vector3();
    function setFromGeometry(struct, geometry, tolerance = 1e-10) {
        struct.clear();
        // Check position and normal attributes
        if (!geometry.hasAttribute("position")) {
            throw new Error("BufferGeometry does not have a position BufferAttribute.");
        }
        const positions = geometry.getAttribute('position');
        // Get the merged vertices Array
        const indexVertexArray = computeVerticesIndexArray(positions, tolerance);
        // If the geometry is not indexed, we get the indexes of faces vertices from
        // the position buffer attribute directly in group of 3
        let nbOfFaces = positions.count / 3;
        let getVertexIndex = function (bufferIndex) {
            return indexVertexArray[bufferIndex];
        };
        // Otherwise, if the geometry is indexed, we get the index of faces vertices
        // from the index buffer in group of 3
        const indexBuffer = geometry.getIndex();
        if (indexBuffer) {
            nbOfFaces = indexBuffer.count / 3;
            getVertexIndex = function (bufferIndex) {
                return indexVertexArray[indexBuffer.array[bufferIndex]];
            };
        }
        // Save halfedges in a map where with a hash <src-vertex-id>
        // their hash is index1-index2, so that it is easier to find the twin
        const halfedgeMap = new Map();
        const vertexMap = new Map();
        const loopHalfedges = new Array(3).fill({});
        for (let faceIndex = 0; faceIndex < nbOfFaces; faceIndex++) {
            for (let i = 0; i < 3; i++) {
                // Get the source vertex v1
                const i1 = getVertexIndex(faceIndex * 3 + i);
                let v1 = vertexMap.get(i1);
                if (!v1) {
                    pos_.fromBufferAttribute(positions, i1);
                    v1 = struct.addVertex(pos_);
                    vertexMap.set(i1, v1);
                }
                // Get the destitation vertex
                const i2 = getVertexIndex(faceIndex * 3 + (i + 1) % 3);
                let v2 = vertexMap.get(i2);
                if (!v2) {
                    pos_.fromBufferAttribute(positions, i2);
                    v2 = struct.addVertex(pos_);
                    vertexMap.set(i2, v2);
                }
                // Get the halfedge from v1 to v2
                const hash1 = i1 + '-' + i2;
                let h1 = halfedgeMap.get(hash1);
                if (!h1) {
                    h1 = struct.addEdge(v1, v2);
                    const h2 = h1.twin;
                    const hash2 = i2 + '-' + i1;
                    halfedgeMap.set(hash1, h1);
                    halfedgeMap.set(hash2, h2);
                }
                loopHalfedges[i] = h1;
            }
            struct.addFace(loopHalfedges);
        }
    }
    /**
     * Returns an array where each index points to its new index in the buffer
     * attribute
     *
     * @param positions Vertices positions buffer
     * @param tolerance Distance tolerance of the vertices to merge
     * @returns
     */
    function computeVerticesIndexArray(positions, tolerance = 1e-10) {
        const decimalShift = Math.log10(1 / tolerance);
        const shiftMultiplier = Math.pow(10, decimalShift);
        const hashMap = new Map();
        const indexArray = new Array();
        for (let i = 0; i < positions.count; i++) {
            // Compute a hash based on the vertex position rounded to a given precision
            let hash = "";
            for (let j = 0; j < 3; j++) {
                hash += `${Math.round(positions.array[i * 3 + j] * shiftMultiplier)}`;
            }
            // If hash already exist, then set the buffer index to the existing vertex,
            // otherwise, create it
            let vertexIndex = hashMap.get(hash);
            if (vertexIndex === undefined) {
                vertexIndex = i;
                hashMap.set(hash, i);
            }
            indexArray.push(vertexIndex);
        }
        return indexArray;
    }

    // Author: Axel Antoine
    /**
     * Class representing an Halfedge Data Structure
     */
    class HalfedgeDS {
        /** @readonly Faces */
        faces = new Array();
        /** @readonly Vertices */
        vertices = new Array();
        /** @readonly Halfedges */
        halfedges = new Array();
        /**
         * Sets the halfedge structure from a BufferGeometry.
         * @param geometry BufferGeometry to read
         * @param tolerance Tolerance distance from which positions are considered equal
         */
        setFromGeometry(geometry, tolerance = 1e-10) {
            return setFromGeometry(this, geometry, tolerance);
        }
        /**
         * Returns an array of all the halfedge loops in the structure.
         *
         * *Note: Actually returns an array of halfedges from which loop generator
         * can be called*
         *
         * @returns
         */
        loops() {
            const loops = new Array();
            const handled = new Set();
            for (const halfedge of this.halfedges) {
                if (!handled.has(halfedge)) {
                    for (const he of halfedge.nextLoop()) {
                        handled.add(he);
                    }
                    loops.push(halfedge);
                }
            }
            return loops;
        }
        /**
         * Clear the structure data
         */
        clear() {
            this.faces.clear();
            this.vertices.clear();
            this.halfedges.clear();
        }
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
        addVertex(position, checkDuplicates = false, tolerance = 1e-10) {
            return addVertex(this, position, checkDuplicates, tolerance);
        }
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
        addEdge(v1, v2, allowParallels = false) {
            return addEdge(this, v1, v2, allowParallels);
        }
        /**
         * Adds a face to an existing halfedge loop
         * @param halfedge
         * @returns
         */
        addFace(halfedges) {
            return addFace(this, halfedges);
        }
        /**
         * Removes a vertex from the structure
         * @param vertex Vertex to remove
         * @param mergeFaces If true, merges connected faces if any, otherwise removes them. Default true
         */
        removeVertex(vertex, mergeFaces = true) {
            return removeVertex(this, vertex, mergeFaces);
        }
        /**
         * Removes an edge from the structrure
         * @param halfedge Halfedge to remove
         * @param mergeFaces If true, merges connected faces if any, otherwise removes them. Default true
         */
        removeEdge(halfedge, mergeFaces = true) {
            return removeEdge(this, halfedge, mergeFaces);
        }
        /**
         * Removes a face from the structure.
         * @param face Face to remove
         */
        removeFace(face) {
            return removeFace(this, face);
        }
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
        cutFace(face, v1, v2, createNewFace = true) {
            return cutFace(this, face, v1, v2, createNewFace);
        }
        /**
         * Splits the halfedge at position and returns the new vertex
         * @param halfEdge The HalfEdge to be splitted
         * @param position Position of the split vertex
         * @returns the new created vertex
         */
        splitEdge(halfedge, position, tolerance = 1e-10) {
            return splitEdge(this, halfedge, position, tolerance);
        }
    }

    // Author: Axel Antoine
    // mail: ax.antoine@gmail.com
    // website: https://axantoine.com
    // 24/05/2022
    Array.prototype.clear = function () {
        this.splice(0, this.length);
        return this;
    };
    Array.prototype.remove = function (t) {
        const idx = this.indexOf(t);
        if (idx === -1) {
            return false;
        }
        this.splice(idx, 1);
        return true;
    };

    exports.Face = Face;
    exports.Halfedge = Halfedge;
    exports.HalfedgeDS = HalfedgeDS;
    exports.Vertex = Vertex;

    Object.defineProperty(exports, '__esModule', { value: true });

}));
//# sourceMappingURL=index.umd.js.map
