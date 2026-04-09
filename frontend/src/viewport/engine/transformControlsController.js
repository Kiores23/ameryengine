import * as THREE from "three";
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";
import { emitTransform } from "./objectTransforms";
import { disposeObject3D } from "./objectDisposal";

export function createTransformControlsController({
  scene,
  camera,
  dom,
  state,
  onShadowDirty,
}) {
  const tControls = new TransformControls(camera, dom);
  tControls.setMode("translate");
  tControls.enabled = false;
  tControls.visible = false;

  tControls.setTranslationSnap(state.translationSnap);
  tControls.setRotationSnap(THREE.MathUtils.degToRad(state.rotationSnap));
  tControls.setScaleSnap(state.scaleSnap);

  const helper = tControls.getHelper();
  scene.add(helper);

  function onDraggingChanged(e) {
    const isDragging = !!e.value;
    state.transformDragging = isDragging;
    state.controls.enabled = !isDragging;

    if (isDragging) {
      state.onTransformStart?.(state.transformTargetName);
    } else {
      state.onTransformEnd?.(state.transformTargetName);
    }
  }

  function onChange() {
    const obj = tControls.object;
    if (!obj) return;

    emitTransform(state, state.transformTargetName, obj);
    onShadowDirty?.();
  }

  tControls.addEventListener("dragging-changed", onDraggingChanged);
  tControls.addEventListener("change", onChange);
  state.tControls = tControls;

  function dispose() {
    tControls.removeEventListener("dragging-changed", onDraggingChanged);
    tControls.removeEventListener("change", onChange);
    tControls.dispose?.();

    if (helper) {
      scene.remove(helper);
      disposeObject3D(helper);
    }
  }

  return {
    tControls,
    dispose,
  };
}
