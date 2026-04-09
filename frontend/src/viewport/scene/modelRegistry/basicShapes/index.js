import * as THREE from "three";

/**
 * Creates basic geometric shapes (primitives), all fitting within a 1×1×1 cube.
 * @param {string} model - The model type
 * @param {THREE.Material} mat - The material to apply
 * @returns {THREE.Mesh|null}
 */
export function createBasicShape(model, mat) {
  switch (model) {

    // ─── Standard ───────────────────────────────────────────────

    case "box":
      return new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), mat);

    case "sphere":
      return new THREE.Mesh(new THREE.SphereGeometry(0.5, 32, 16), mat);

    case "cylinder":
      return new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 32), mat);

    case "cone":
      return new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 32), mat);

    case "plane":
      return new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);

    case "disc":
      return new THREE.Mesh(new THREE.CircleGeometry(0.5, 32), mat);

    // ─── Polyhedra ───────────────────────────────────────────────

    case "tetrahedron":
      // r=0.5 → reste dans le cube
      return new THREE.Mesh(new THREE.TetrahedronGeometry(0.5, 0), mat);

    case "octahedron":
      return new THREE.Mesh(new THREE.OctahedronGeometry(0.5, 0), mat);

    case "icosahedron":
      return new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 0), mat);

    case "dodecahedron":
      return new THREE.Mesh(new THREE.DodecahedronGeometry(0.5, 0), mat);

    // ─── Prisms ──────────────────────────────────────────────────

    case "pyramid":
      // ConeGeometry 4 faces = pyramide carrée
      return new THREE.Mesh(new THREE.ConeGeometry(0.5, 1, 4), mat);

    case "tri_prism":
      // CylinderGeometry 3 faces = prisme triangulaire
      return new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1, 3), mat);

    case "hex_prism":
      return new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 1, 6), mat);

    case "pillar":
      return new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 1, 16), mat);

    case "spike":
      return new THREE.Mesh(new THREE.ConeGeometry(0.2, 1, 12), mat);

    case "truncated_cone":
      // Plus large en bas qu'en haut (ex-"barrel" renommé)
      return new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 1, 32), mat);

    // ─── Torus / Arcs ────────────────────────────────────────────

    case "torus":
      // Extérieur : (0.3+0.15)*2 = 0.9 → dans le cube
      return new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.15, 16, 64), mat);

    case "torus_thick":
      // Extérieur : (0.25+0.2)*2 = 0.9 → dans le cube
      return new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.2, 16, 64), mat);

    case "ring":
      return new THREE.Mesh(new THREE.RingGeometry(0.2, 0.5, 32), mat);

    case "arc_half":
      // Demi-torus (arc 180°)
      return new THREE.Mesh(
        new THREE.TorusGeometry(0.4, 0.1, 16, 32, Math.PI),
        mat
      );

    case "arc_quarter":
      // Quart de torus (arc 90°)
      return new THREE.Mesh(
        new THREE.TorusGeometry(0.4, 0.1, 16, 32, Math.PI * 0.5),
        mat
      );

    // ─── Custom ──────────────────────────────────────────────────

    case "crystal":
      // Icosaèdre facetté → look cristal
      return new THREE.Mesh(new THREE.IcosahedronGeometry(0.5, 1), mat);

    case "ramp": {
      // Prisme triangulaire rectangle : monte de y=0 à y=1 côté droit
      const geo = new THREE.BufferGeometry();

      const v = new Float32Array([
        // face avant
        -0.5, 0.0,  0.5,
         0.5, 0.0,  0.5,
         0.5, 1.0,  0.5,
        // face arrière
        -0.5, 0.0, -0.5,
         0.5, 0.0, -0.5,
         0.5, 1.0, -0.5,
      ]);

      const indices = new Uint16Array([
        0, 1, 2,            // face avant
        5, 4, 3,            // face arrière
        0, 2, 5,  0, 5, 3, // flanc gauche
        1, 4, 5,  1, 5, 2, // flanc droit
        0, 3, 4,  0, 4, 1, // sol
      ]);

      geo.setAttribute("position", new THREE.BufferAttribute(v, 3));
      geo.setIndex(new THREE.BufferAttribute(indices, 1));
      geo.computeVertexNormals();
      return new THREE.Mesh(geo, mat);
    }

    default:
      return null;
  }
}