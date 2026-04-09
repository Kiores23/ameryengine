import * as THREE from "three";
import {
  NAVMESH_MODEL,
  SKILL_AI_CORPS_MODEL,
  SKILL_AI_MODEL,
} from "../../../runtime/ai/constants.js";

const NAVMESH_EDITOR_COLOR = 0x58d68d;
const NAVMESH_EDITOR_OPACITY = 0.12;

export function createAiHelperModel(model, materialOptions = {}) {
  if (model !== NAVMESH_MODEL) {
    return null;
  }

  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshBasicMaterial({
      color: materialOptions.color ?? NAVMESH_EDITOR_COLOR,
      transparent: true,
      opacity: materialOptions.opacity ?? NAVMESH_EDITOR_OPACITY,
      depthWrite: false,
    }),
  );

  mesh.userData.isNavMesh = true;
  mesh.userData.hideOutsideEditor = true;
  mesh.userData.excludeFromRuntimeCollisions = true;
  mesh.userData.skipSceneShadows = true;
  mesh.renderOrder = 10;

  return mesh;
}

export function configureAiModel(object, model) {
  if (!object) return object;

  if (model === NAVMESH_MODEL) {
    object.userData.isNavMesh = true;
    object.userData.hideOutsideEditor = true;
    object.userData.excludeFromRuntimeCollisions = true;
    object.userData.skipSceneShadows = true;

    object.traverse?.((child) => {
      if (!child.isMesh) return;
      child.userData.isNavMesh = true;
      child.userData.excludeFromRuntimeCollisions = true;
      child.userData.skipSceneShadows = true;
      child.castShadow = false;
      child.receiveShadow = false;
    });
  }

  if (model === SKILL_AI_MODEL) {
    object.userData.isSkillAi = true;
    object.userData.excludeFromRuntimeCollisions = true;
    if (object.userData.collisionProxy) {
      object.userData.collisionProxy.userData.excludeFromRuntimeCollisions = true;
    }
  }

  if (model === SKILL_AI_CORPS_MODEL) {
    object.userData.isSkillAiCorps = true;
  }

  return object;
}
