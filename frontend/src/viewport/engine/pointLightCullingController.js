import * as THREE from "three";
import {
  POINT_LIGHT_EDITOR_CULL_DISTANCE,
  POINT_LIGHT_CULL_HYSTERESIS,
  POINT_LIGHT_CULLING_ENABLED,
  POINT_LIGHT_RUNTIME_CULL_DISTANCE,
  POINT_LIGHT_VIEWER_CULL_DISTANCE,
} from "../constants/lights";

const _pointLightWorldPos = new THREE.Vector3();
const _referenceObjectBox = new THREE.Box3();
const _referenceObjectCenter = new THREE.Vector3();

function getPointLightBaseVisibility(light) {
  return light.userData?.baseVisible !== false;
}

function getModeCullDistance({ isRuntimeActive, isEditorMode }) {
  if (isRuntimeActive) {
    return Number(POINT_LIGHT_RUNTIME_CULL_DISTANCE) || 0;
  }

  if (isEditorMode) {
    return Number(POINT_LIGHT_EDITOR_CULL_DISTANCE) || 0;
  }

  return Number(POINT_LIGHT_VIEWER_CULL_DISTANCE) || 0;
}

function getPointLightCullDistance(light, configuredDistance) {
  const lightDistance = light.distance > 0 ? light.distance : Infinity;
  return Math.min(configuredDistance, lightDistance);
}

function resolveObjectReferencePosition(object) {
  if (!object?.parent) {
    return null;
  }

  _referenceObjectBox.setFromObject(object);

  if (_referenceObjectBox.isEmpty()) {
    return object.getWorldPosition(_referenceObjectCenter);
  }

  return _referenceObjectBox.getCenter(_referenceObjectCenter);
}

function resolveReferencePosition({
  camera,
  objectsByName,
  isRuntimeActive,
  isEditorMode,
  getRuntimePlayer,
  getSelectedObjectName,
}) {
  if (isRuntimeActive) {
    const player = getRuntimePlayer?.() ?? null;
    return resolveObjectReferencePosition(player) ?? camera.position;
  }

  if (isEditorMode) {
    return camera.position;
  }

  const selectedObjectName = getSelectedObjectName?.() ?? null;
  const selectedObject = selectedObjectName
    ? objectsByName.get(selectedObjectName) ?? null
    : null;

  return resolveObjectReferencePosition(selectedObject) ?? camera.position;
}

export function createPointLightCullingController({
  camera,
  objectsByName,
  isEditorMode,
  isRuntimeActive,
  getRuntimePlayer,
  getSelectedObjectName,
}) {
  function update() {
    const runtimeActive = !!isRuntimeActive?.();
    const editorMode = !!isEditorMode?.();
    const configuredDistance = getModeCullDistance({
      isRuntimeActive: runtimeActive,
      isEditorMode: editorMode,
    });
    const cullingEnabled = POINT_LIGHT_CULLING_ENABLED && configuredDistance > 0;
    const hysteresis = Math.max(0, Number(POINT_LIGHT_CULL_HYSTERESIS) || 0);
    const referencePosition = resolveReferencePosition({
      camera,
      objectsByName,
      isRuntimeActive: runtimeActive,
      isEditorMode: editorMode,
      getRuntimePlayer,
      getSelectedObjectName,
    });
    let changed = false;

    for (const obj of objectsByName.values()) {
      if (!obj?.isPointLight) continue;

      const baseVisible = getPointLightBaseVisibility(obj);
      const wasCulled = !!obj.userData.pointLightCulled;

      let nextVisible = baseVisible;
      let nextCulled = false;

      if (baseVisible && cullingEnabled) {
        const cullDistance = getPointLightCullDistance(obj, configuredDistance);

        if (cullDistance > 0 && Number.isFinite(cullDistance)) {
          const showDistance = Math.max(0, cullDistance - hysteresis);
          const hideDistance = cullDistance + hysteresis;
          const threshold = wasCulled ? showDistance : hideDistance;

          obj.getWorldPosition(_pointLightWorldPos);
          nextVisible = referencePosition.distanceToSquared(_pointLightWorldPos) <= threshold * threshold;
          nextCulled = !nextVisible;
        }
      }

      if (obj.visible !== nextVisible) {
        obj.visible = nextVisible;
        changed = true;
      }

      if (wasCulled !== nextCulled) {
        obj.userData.pointLightCulled = nextCulled;
        changed = true;
      }
    }

    return changed;
  }

  return {
    update,
  };
}
