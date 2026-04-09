import * as THREE from "three";

/** Returns true if `child` is inside the subtree of `ancestor`. */
export function isDescendantOf(child, ancestor) {
  let node = child.parent;
  while (node) {
    if (node === ancestor) return true;
    node = node.parent;
  }
  return false;
}

/**
 * Closest point on a line segment [A, B] to point P.
 * All args are THREE.Vector3, result written into `out`.
 */
const _ab = new THREE.Vector3();
const _ap = new THREE.Vector3();
export function closestPointOnSegment(A, B, P, out) {
  _ab.subVectors(B, A);
  _ap.subVectors(P, A);
  const t = THREE.MathUtils.clamp(_ap.dot(_ab) / _ab.dot(_ab), 0, 1);
  out.copy(A).addScaledVector(_ab, t);
  return out;
}

/**
 * Collect collidable meshes from scene objects registered in objectsByName,
 * excluding the character and its subtree.
 * If an object has a collision proxy (simple box), use that instead of
 * traversing its raw mesh geometry.
 */
export function getCollidables(character, objectsByName) {
  const list = [];
  for (const [, obj] of objectsByName) {
    if (obj === character || isDescendantOf(obj, character)) continue;
    if (obj.userData?.excludeFromRuntimeCollisions) continue;
    // Prefer collision proxy over raw geometry
    if (obj.userData.collisionProxy) {
      list.push(obj.userData.collisionProxy);
      continue;
    }
    obj.traverse(child => {
      if (
        child.isMesh &&
        !child.isSkinnedMesh &&
        !child.userData.isDebug &&
        !child.userData.isCollisionProxy &&
        !child.userData.excludeFromRuntimeCollisions
      ) {
        list.push(child);
      }
    });
  }
  return list;
}
