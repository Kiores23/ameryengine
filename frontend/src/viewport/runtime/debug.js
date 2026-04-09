import * as THREE from "three";
import { CAP_RADIUS, CAP_BOT_Y, CAP_TOP_Y, DEBUG } from "./constants.js";

/**
 * Build and manage debug collision visuals:
 *   - a wireframe capsule that follows the character (scaled per-axis)
 *   - BoxHelpers for every collidable mesh
 */
export function createDebugManager() {
  let _debugGroup  = null;
  let _capsuleMesh = null;
  let _bboxHelpers = [];

  function init(character, collidables) {
    // Always clean up previous debug visuals first
    destroy();
    if (!DEBUG) return;
    const scene = character.parent;
    if (!scene) return;

    _debugGroup = new THREE.Group();
    _debugGroup.name = "__debugCollision";
    scene.add(_debugGroup);

    const capMat = new THREE.MeshBasicMaterial({
      color: 0x00ff88,
      wireframe: true,
      depthTest: false,
    });

    // Build capsule once with BASE (unscaled) dimensions.
    // Character scale is applied to the group in update().
    const bodyH = CAP_TOP_Y - CAP_BOT_Y;

    const cylGeo  = new THREE.CylinderGeometry(CAP_RADIUS, CAP_RADIUS, bodyH, 16, 1, true);
    const cylMesh = new THREE.Mesh(cylGeo, capMat);
    cylMesh.userData.isDebug = true;
    cylMesh.position.y = CAP_BOT_Y + bodyH * 0.5;

    const botGeo  = new THREE.SphereGeometry(CAP_RADIUS, 16, 8, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5);
    const botMesh = new THREE.Mesh(botGeo, capMat);
    botMesh.userData.isDebug = true;
    botMesh.position.y = CAP_BOT_Y;

    const topGeo  = new THREE.SphereGeometry(CAP_RADIUS, 16, 8, 0, Math.PI * 2, 0, Math.PI * 0.5);
    const topMesh = new THREE.Mesh(topGeo, capMat);
    topMesh.userData.isDebug = true;
    topMesh.position.y = CAP_TOP_Y;

    _capsuleMesh = new THREE.Group();
    _capsuleMesh.add(cylMesh, botMesh, topMesh);
    _debugGroup.add(_capsuleMesh);

    // ── OBB Helpers for every collidable ────────────────────────
    for (const mesh of collidables) {
      mesh.traverse(child => {
        if (!child.isMesh) return;
        if (!child.geometry.boundingBox) child.geometry.computeBoundingBox();
        const gBox = child.geometry.boundingBox;
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        gBox.getSize(size);
        gBox.getCenter(center);
        const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
        geo.translate(center.x, center.y, center.z);
        const edges = new THREE.EdgesGeometry(geo);
        const helper = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: 0xff4400, depthTest: false }),
        );
        helper.userData._sourceMesh = child;
        helper.matrixAutoUpdate = false;
        _debugGroup.add(helper);
        _bboxHelpers.push(helper);
      });
    }
  }

  /** Move capsule to character feet, apply per-axis scale and rotation, refresh bounding boxes. */
  function update(character) {
    if (!DEBUG || !_capsuleMesh) return;

    _capsuleMesh.position.copy(character.position);
    _capsuleMesh.scale.copy(character.scale);
    _capsuleMesh.rotation.y = character.rotation.y;
    for (const h of _bboxHelpers) {
      const src = h.userData._sourceMesh;
      if (src) {
        h.matrix.copy(src.matrixWorld);
        h.matrixWorldNeedsUpdate = true;
      }
    }
  }

  /** Remove all debug objects from the scene. */
  function destroy() {
    if (_debugGroup) {
      _debugGroup.parent?.remove(_debugGroup);
      _debugGroup.traverse(child => {
        child.geometry?.dispose();
        child.material?.dispose();
      });
    }
    _debugGroup  = null;
    _capsuleMesh = null;
    _bboxHelpers = [];
  }

  return { init, update, destroy };
}
