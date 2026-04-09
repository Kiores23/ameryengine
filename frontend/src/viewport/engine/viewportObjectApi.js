import * as THREE from "three";
import { addObjectToScene } from "../scene/sceneRuntime";
import { exportSceneFromState, loadSceneFromFileIntoState, loadSceneFromUrlIntoState, replaceSceneFromData, resetSceneToDefault, saveSceneFromState } from "./sceneLoading";
import { playAnimation } from "./animation";
import { setFocusOnObject } from "./cameraFocus";
import { getDropPositionAtClient } from "./dropPlacement";
import { clearHighlight, highlightObject } from "./highlight";
import { ensureObjectHasUniqueMaterials } from "./materialInstances";
import { clearObjectEmissiveCache, disposeObject3D } from "./objectDisposal";
import { getTransformSnapshot, setObjectPosition, setObjectRotation, setObjectScale } from "./objectTransforms";
import { resetEditorState, resetTransformAttachment } from "./sceneState";

export function createViewportObjectApi({
  state,
  scene,
  camera,
  controls,
  dom,
  pickNameAtClient,
  getObjectByName,
  isEditorMode,
  prepareSceneReplacement,
  syncEditorOnlyObjectsVisibility,
  generateUniqueObjectName,
  skillAiEditorState,
  runtimeController,
  autoRotateController,
}) {
  const moveCameraForward = new THREE.Vector3();
  const moveCameraRight = new THREE.Vector3();
  const moveCameraDelta = new THREE.Vector3();

  return {
    focusOnName(name) {
      const obj = getObjectByName(name);
      if (!obj) return;
      setFocusOnObject(state, obj);
    },

    highlightName(name) {
      if (!name || !isEditorMode()) {
        clearHighlight(state);
        return;
      }

      const obj = getObjectByName(name);
      if (!obj) return;
      highlightObject(state, obj);
    },

    attachTransformToName(name) {
      const obj = getObjectByName(name);
      if (!obj) return;

      if (state.transformTargetName === name && state.tControls?.object === obj) {
        return;
      }

      state.transformTargetName = name;
      state.tControls?.attach(obj);
    },

    detachTransform() {
      resetTransformAttachment(state);
    },

    clearEditorSelection() {
      resetEditorState(state);
    },

    setTransformEnabled(value) {
      if (!state.tControls) return;

      const enabled = !!value;
      state.tControls.enabled = enabled;
      state.tControls.visible = enabled;

      if (!enabled) {
        state.tControls.detach();
      }
    },

    setTransformMode(mode) {
      state.tControls?.setMode(mode || "translate");
    },

    getTransformOfName(name) {
      return getTransformSnapshot(getObjectByName(name));
    },

    setPositionOfName(name, pos) {
      const obj = getObjectByName(name);
      setObjectPosition(state, obj, name, pos);
    },

    setRotationOfName(name, rotDeg) {
      const obj = getObjectByName(name);
      setObjectRotation(state, obj, name, rotDeg);
    },

    setScaleOfName(name, scl) {
      const obj = getObjectByName(name);
      setObjectScale(state, obj, name, scl);
    },

    setTranslationSnap(value) {
      const snap = Math.max(0, Number(value) || 0);
      state.translationSnap = snap;
      state.tControls?.setTranslationSnap(snap);
    },

    setRotationSnap(degrees) {
      const snap = Math.max(0, Number(degrees) || 0);
      state.rotationSnap = snap;
      state.tControls?.setRotationSnap(THREE.MathUtils.degToRad(snap));
    },

    setScaleSnap(value) {
      const snap = Math.max(0, Number(value) || 0);
      state.scaleSnap = snap;
      state.tControls?.setScaleSnap(snap);
    },

    getSnapValues() {
      return {
        translation: state.translationSnap,
        rotation: state.rotationSnap,
        scale: state.scaleSnap,
      };
    },

    setPrecisionMode(on) {
      const enabled = !!on;
      if (state.precisionMode === enabled) return;

      state.precisionMode = enabled;
      const divisor = enabled ? state.precisionDivisor : 1;
      state.tControls?.setTranslationSnap(state.translationSnap / divisor);
      state.tControls?.setRotationSnap(THREE.MathUtils.degToRad(state.rotationSnap / divisor));
      state.tControls?.setScaleSnap(state.scaleSnap / divisor);
    },

    isPrecisionMode() {
      return state.precisionMode;
    },

    getMaterialOfName(name) {
      const obj = getObjectByName(name);
      if (!obj) return null;

      if (obj.isLight) {
        return {
          isLight: true,
          color: `#${obj.color.getHexString()}`,
          intensity: obj.intensity,
          distance: obj.distance ?? null,
        };
      }

      const mat = obj.material;
      if (mat) {
        return {
          isLight: false,
          color: mat.color ? `#${mat.color.getHexString()}` : "#ffffff",
          roughness: mat.roughness ?? 0.4,
          metalness: mat.metalness ?? 0.1,
        };
      }

      let found = null;
      obj.traverse?.((child) => {
        if (!found && child.isMesh && child.material?.color) {
          const material = child.material;
          found = {
            isLight: false,
            color: `#${material.color.getHexString()}`,
            roughness: material.roughness ?? 0.4,
            metalness: material.metalness ?? 0.1,
          };
        }
      });

      return found;
    },

    setColorOfName(name, hexColor) {
      const obj = getObjectByName(name);
      if (!obj) return;

      const color = new THREE.Color(hexColor);

      if (obj.isLight) {
        obj.color.copy(color);
        return;
      }

      ensureObjectHasUniqueMaterials(obj);

      if (obj.material?.color) {
        obj.material.color.copy(color);
        return;
      }

      obj.traverse?.((child) => {
        if (child.isMesh && child.material?.color) {
          child.material.color.copy(color);
        }
      });
    },

    setIntensityOfName(name, intensity) {
      const obj = getObjectByName(name);
      if (!obj?.isLight) return;
      obj.intensity = Math.max(0, Number(intensity) || 0);
    },

    setDistanceOfName(name, distance) {
      const obj = getObjectByName(name);
      if (!obj?.isLight || obj.distance === undefined) return;
      obj.distance = Math.max(0, Number(distance) || 0);
    },

    pickNameAtClient,

    getDropPositionAtClient(clientX, clientY) {
      return getDropPositionAtClient(dom, camera, clientX, clientY);
    },

    saveScene() {
      return saveSceneFromState(state);
    },

    async loadScene(sceneData, onProgress) {
      prepareSceneReplacement();
      await replaceSceneFromData(state, sceneData, onProgress);
      skillAiEditorState.cacheAll();
      syncEditorOnlyObjectsVisibility();
    },

    async resetScene() {
      prepareSceneReplacement();
      await resetSceneToDefault(state);
      skillAiEditorState.cacheAll();
      syncEditorOnlyObjectsVisibility();
    },

    async loadSceneFromUrl(url, onProgress) {
      prepareSceneReplacement();
      await loadSceneFromUrlIntoState(state, url, onProgress);
      skillAiEditorState.cacheAll();
      syncEditorOnlyObjectsVisibility();
    },

    async loadSceneFromFile(file, onProgress) {
      prepareSceneReplacement();
      await loadSceneFromFileIntoState(state, file, onProgress);
      skillAiEditorState.cacheAll();
      syncEditorOnlyObjectsVisibility();
    },

    exportSceneToFile(filename = "scene.json") {
      exportSceneFromState(state, filename);
    },

    async addObject(desc) {
      const obj = await addObjectToScene(scene, state.objectsByName, desc);
      skillAiEditorState.cacheObject(obj);

      if (obj?.userData?.hideOutsideEditor) {
        obj.visible = isEditorMode() && !runtimeController.isActive();
      }

      return obj;
    },

    generateUniqueObjectName,

    playAnimationOfName(name, animationName = "idle") {
      const obj = getObjectByName(name);
      if (!obj) return false;
      return playAnimation(obj.userData?.animationActions, animationName);
    },

    getObjectDescriptorByName(name) {
      const obj = getObjectByName(name);
      if (!obj) return null;

      return {
        name: obj.name,
        model: obj.userData.sceneModel ?? "box",
        material: {
          ...(obj.userData.sceneMaterial ?? {}),
        },
        transform: getTransformSnapshot(obj),
      };
    },

    removeObjectByName(name) {
      const obj = getObjectByName(name);
      if (!obj) return false;

      autoRotateController.clearObjectRoot(obj);

      if (state.tControls?.object === obj) {
        resetTransformAttachment(state);
      }

      scene.remove(obj);
      clearObjectEmissiveCache(state, obj);
      disposeObject3D(obj);
      state.objectsByName.delete(name);

      if (state.highlighted === obj) {
        state.highlighted = null;
      }

      return true;
    },

    moveCameraFree(x, z) {
      if (!camera || !controls) return;

      const moveSpeed = 0.25;

      camera.getWorldDirection(moveCameraForward);
      moveCameraForward.normalize();

      moveCameraRight.crossVectors(camera.up, moveCameraForward).normalize();

      moveCameraDelta.set(0, 0, 0);
      moveCameraDelta.addScaledVector(moveCameraForward, z * moveSpeed);
      moveCameraDelta.addScaledVector(moveCameraRight, x * moveSpeed);

      camera.position.add(moveCameraDelta);
      controls.target.add(moveCameraDelta);
    },
  };
}
