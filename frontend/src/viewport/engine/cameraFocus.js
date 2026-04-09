import * as THREE from "three";
import {
  OBJECT_VIEW_CAMERA_DISTANCE,
  OBJECT_VIEW_CAMERA_HEIGHT_OFFSET,
  getObjectViewScale,
} from "../constants/objectView";

const _box = new THREE.Box3();
const _size = new THREE.Vector3();
const _center = new THREE.Vector3();
const _front = new THREE.Vector3();
const _trackedWorldPos = new THREE.Vector3();
const _movementDelta = new THREE.Vector3();

function clearFocusTargetState(state) {
  state.focusTarget = null;
  state.focusTrackedWorldPos = null;
}

function computeFocusTarget(state) {
  const obj = state.focusTarget;
  if (!obj?.parent) {
    clearFocusTargetState(state);
    state.focusPos = null;
    state.focusLook = null;
    return false;
  }

  // Compute object bounding box size for distance & offset scaling
  _box.setFromObject(obj);
  _box.getSize(_size);
  const maxDim = Math.max(_size.x, _size.y, _size.z, 0.5);
  const scale = getObjectViewScale(maxDim);

  _box.getCenter(_center);

  // "Front" of the object = its local +Z in world space
  _front.set(0, 0, 1);
  _front.applyQuaternion(obj.quaternion).normalize();

  const dist = OBJECT_VIEW_CAMERA_DISTANCE * scale;
  const heightOffset = OBJECT_VIEW_CAMERA_HEIGHT_OFFSET * scale;

  state.focusPos = new THREE.Vector3(
    _center.x + _front.x * dist,
    _center.y + heightOffset,
    _center.z + _front.z * dist,
  );
  state.focusLook = _center.clone();
  state.focusTrackedWorldPos = obj.getWorldPosition(new THREE.Vector3());

  // Store the bounding box center on the object for orbit to use
  obj.userData._focusCenter = _center.clone();
  return true;
}

function updateFocusTargetTranslation(state) {
  const obj = state.focusTarget;
  if (!obj?.parent) {
    clearFocusTargetState(state);
    return false;
  }

  if (!state.focusPos || !state.focusLook) {
    return computeFocusTarget(state);
  }

  obj.getWorldPosition(_trackedWorldPos);

  if (!state.focusTrackedWorldPos) {
    state.focusTrackedWorldPos = _trackedWorldPos.clone();
    return true;
  }

  _movementDelta.subVectors(_trackedWorldPos, state.focusTrackedWorldPos);
  if (_movementDelta.lengthSq() <= 1e-8) {
    return true;
  }

  state.focusPos.add(_movementDelta);
  state.focusLook.add(_movementDelta);
  if (obj.userData._focusCenter?.isVector3) {
    obj.userData._focusCenter.add(_movementDelta);
  }
  state.focusTrackedWorldPos.copy(_trackedWorldPos);
  return true;
}

export function clearFocus(state) {
  clearFocusTargetState(state);
  state.focusPos = null;
  state.focusLook = null;
}

export function syncFocusWithCamera(state, camera, controls) {
  if (!camera || !controls) return false;

  if (state.focusTarget) {
    updateFocusTargetTranslation(state);
  }

  if (!state.focusTarget && !state.focusPos && !state.focusLook) {
    return false;
  }

  state.focusPos = camera.position.clone();
  state.focusLook = controls.target.clone();

  const obj = state.focusTarget;
  if (obj?.parent) {
    state.focusTrackedWorldPos = obj.getWorldPosition(new THREE.Vector3());
    obj.userData._focusCenter = controls.target.clone();
  }

  return true;
}

export function setFocusOnObject(state, obj) {
  if (!obj) return;
  state.focusTarget = obj;
  computeFocusTarget(state);
}

export function skipFocus(state, camera, controls) {
  if (!state.focusPos && !state.focusTarget) return;
  updateFocusTargetTranslation(state);
  if (state.focusPos && state.focusLook) {
    camera.position.copy(state.focusPos);
    controls.target.copy(state.focusLook);
  }
  clearFocus(state);
}

export function updateCameraFocus(state, camera, controls) {
  if (state.focusTarget) {
    updateFocusTargetTranslation(state);
  }

  if (!state.focusPos || !state.focusLook) return;

  camera.position.lerp(state.focusPos, 0.08);
  controls.target.lerp(state.focusLook, 0.08);

  if (!state.focusTarget && camera.position.distanceTo(state.focusPos) < 0.02) {
    clearFocus(state);
  }
}
