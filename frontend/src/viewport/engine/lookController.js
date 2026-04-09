import * as THREE from "three";
import { skipFocus, syncFocusWithCamera } from "./cameraFocus";

const LOOK_SENSITIVITY = 0.005;

export function createLookController({
  dom,
  camera,
  controls,
  state,
  getSelectedObject,
  isEditorMode,
  isRuntimeActive,
}) {
  const lookOffset = new THREE.Vector3();
  const lookSpherical = new THREE.Spherical();

  let lookActive = false;
  let rightDragActive = false;

  function hideCursor(hidden) {
    dom.style.cursor = hidden ? "none" : "";
  }

  function cancel() {
    lookActive = false;
    rightDragActive = false;
    hideCursor(false);
  }

  function onLookDown(e) {
    if (state.transformDragging) return;
    if (isRuntimeActive()) return;

    if (e.button === 0) {
      lookActive = true;
      hideCursor(true);
      e.preventDefault();
      return;
    }

    if (e.button === 2) {
      rightDragActive = true;
      if (!isEditorMode()) {
        lookActive = true;
      }
      hideCursor(true);
    }
  }

  function onLookMove(e) {
    if (!lookActive) return;

    const dx = e.movementX || 0;
    const dy = e.movementY || 0;
    if (dx === 0 && dy === 0) return;

    if (!isEditorMode()) {
      const selectedObj = getSelectedObject();
      if (!selectedObj) return;

      syncFocusWithCamera(state, camera, controls);

      let orbitCenter = selectedObj.userData._focusCenter;
      if (!orbitCenter) {
        const box = new THREE.Box3().setFromObject(selectedObj);
        orbitCenter = box.getCenter(new THREE.Vector3());
        selectedObj.userData._focusCenter = orbitCenter;
      }

      lookOffset.subVectors(camera.position, orbitCenter);
      lookSpherical.setFromVector3(lookOffset);

      lookSpherical.theta -= dx * LOOK_SENSITIVITY;
      lookSpherical.phi -= dy * LOOK_SENSITIVITY;
      lookSpherical.phi = THREE.MathUtils.clamp(lookSpherical.phi, 0.05, Math.PI - 0.05);

      lookOffset.setFromSpherical(lookSpherical);
      camera.position.copy(orbitCenter).add(lookOffset);
      controls.target.copy(orbitCenter);
      syncFocusWithCamera(state, camera, controls);
      return;
    }

    if (state.focusPos) {
      skipFocus(state, camera, controls);
    }

    lookOffset.subVectors(controls.target, camera.position);
    lookSpherical.setFromVector3(lookOffset);

    lookSpherical.theta -= dx * LOOK_SENSITIVITY;
    lookSpherical.phi += dy * LOOK_SENSITIVITY;
    lookSpherical.phi = THREE.MathUtils.clamp(lookSpherical.phi, 0.05, Math.PI - 0.05);

    lookOffset.setFromSpherical(lookSpherical);
    controls.target.copy(camera.position).add(lookOffset);
  }

  function onLookUp(e) {
    if (e.button === 0) {
      lookActive = false;
    } else if (e.button === 2) {
      rightDragActive = false;
      if (!isEditorMode()) {
        lookActive = false;
      }
    }

    if (!lookActive && !rightDragActive) {
      hideCursor(false);
    }
  }

  function onContextMenu(e) {
    e.preventDefault();
  }

  dom.addEventListener("mousedown", onLookDown);
  dom.addEventListener("contextmenu", onContextMenu);
  window.addEventListener("mousemove", onLookMove);
  window.addEventListener("mouseup", onLookUp);

  function dispose() {
    cancel();
    dom.removeEventListener("mousedown", onLookDown);
    dom.removeEventListener("contextmenu", onContextMenu);
    window.removeEventListener("mousemove", onLookMove);
    window.removeEventListener("mouseup", onLookUp);
  }

  return {
    cancel,
    dispose,
  };
}
