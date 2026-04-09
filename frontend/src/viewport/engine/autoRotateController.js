import * as THREE from "three";
import {
  AUTO_ROTATE_MAX_DISTANCE,
  AUTO_ROTATE_MODEL_AXES,
  AUTO_ROTATE_SIZE_DISTANCE_FACTOR,
  AUTO_ROTATE_SPEED,
} from "../constants/autoRotate";

const _autoRotateWorldPos = new THREE.Vector3();
const _autoRotateBox = new THREE.Box3();
const _autoRotateSize = new THREE.Vector3();

export function createAutoRotateController({ camera, objectsByName }) {
  function ensureVisualRoot(obj) {
    const proxy = obj.userData.collisionProxy;
    if (!proxy) return null;

    if (obj.userData.autoRotateVisualRoot) {
      return obj.userData.autoRotateVisualRoot;
    }

    const existingRoot = obj.children.find((child) => child.userData?.isAutoRotateVisualRoot);
    if (existingRoot) {
      obj.userData.autoRotateVisualRoot = existingRoot;
      return existingRoot;
    }

    const visualRoot = new THREE.Group();
    visualRoot.name = `${obj.name || "object"}_autoRotateVisualRoot`;
    visualRoot.userData.isAutoRotateVisualRoot = true;

    const visualChildren = obj.children.filter((child) => (
      child !== proxy && !child.userData?.isCollisionProxy
    ));
    obj.add(visualRoot);
    for (const child of visualChildren) {
      visualRoot.add(child);
    }

    obj.userData.autoRotateVisualRoot = visualRoot;
    return visualRoot;
  }

  function clearObjectRoot(obj) {
    delete obj?.userData?.autoRotateVisualRoot;
  }

  function clearAllRoots() {
    for (const obj of objectsByName.values()) {
      clearObjectRoot(obj);
    }
  }

  function shouldRotate(obj) {
    obj.getWorldPosition(_autoRotateWorldPos);
    _autoRotateBox.setFromObject(obj);
    _autoRotateBox.getSize(_autoRotateSize);

    const maxDim = Math.max(_autoRotateSize.x, _autoRotateSize.y, _autoRotateSize.z, 0.5);
    const maxDistance = Math.max(
      AUTO_ROTATE_MAX_DISTANCE,
      maxDim * AUTO_ROTATE_SIZE_DISTANCE_FACTOR,
    );

    return camera.position.distanceToSquared(_autoRotateWorldPos) <= maxDistance * maxDistance;
  }

  function update(delta) {
    let rotated = false;

    for (const obj of objectsByName.values()) {
      if (!AUTO_ROTATE_MODEL_AXES[obj.userData.sceneModel]) continue;
      if (!shouldRotate(obj)) continue;

      const visualRoot = ensureVisualRoot(obj);
      const target = visualRoot || obj;
      const axis = AUTO_ROTATE_MODEL_AXES[obj.userData.sceneModel] ?? "z";
      target.rotation[axis] += AUTO_ROTATE_SPEED * delta;
      rotated = true;
    }

    return rotated;
  }

  return {
    clearObjectRoot,
    clearAllRoots,
    update,
  };
}
