import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { setupScene } from "./scene/setupScene";
import { clearModelRegistryCache, initModelRegistryLoader } from "./scene/modelRegistry";
import {
  clearRuntimeObjects,
  generateUniqueObjectNameFromModel,
  shouldObjectRenderInLite,
} from "./scene/sceneRuntime";

import { resizeRendererToCanvas } from "./utils/resizeRendererToCanvas";

import { createEngineState } from "./engine/engineState";
import { updateAnimationMixers } from "./engine/animation";
import { syncFocusWithCamera, updateCameraFocus } from "./engine/cameraFocus";
import { clearHighlight } from "./engine/highlight";
import {
  disposeSceneChildren,
} from "./engine/objectDisposal";
import { createRaycastPicker } from "./engine/picking";
import { resetEditorState, resetTransformAttachment } from "./engine/sceneState";
import { createAutoRotateController } from "./engine/autoRotateController";
import { createFogController } from "./engine/fogController";
import { createLookController } from "./engine/lookController";
import { createPointLightCullingController } from "./engine/pointLightCullingController";
import { createSkillAiEditorState } from "./engine/skillAiEditorState";
import { createTransformControlsController } from "./engine/transformControlsController";
import { createViewportObjectApi } from "./engine/viewportObjectApi";

import { createRuntimeController } from "./runtime/runtimeMode";
import { createSkillAiSystem } from "./runtime/ai/skillAiSystem";
import {
  DEFAULT_SHADOW_DIRTY_DEBOUNCE,
  DEFAULT_SHADOW_MAP_SIZE,
  DEFAULT_SHADOW_REFRESH_INTERVAL,
  LITE_SHADOW_MAP_SCALE,
  LITE_SHADOW_DIRTY_DEBOUNCE,
  LITE_SHADOW_REFRESH_INTERVAL,
} from "./constants/lights.js";

export async function createViewportEngine(canvas) {
  const state = createEngineState();

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: window.devicePixelRatio < 2,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  state.renderer = renderer;
  initModelRegistryLoader(renderer);

  const dom = renderer.domElement;

  const scene = new THREE.Scene();
  state.scene = scene;

  const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(5, 3, 8);
  state.camera = camera;

  const controls = new OrbitControls(camera, dom);
  controls.enableDamping = true;
  controls.enableZoom = true;
  controls.mouseButtons = {
    LEFT: null,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN,
  };
  controls.target.set(0, 1, 0);
  state.controls = controls;

  function syncViewerFocusFromWheel() {
    if (isEditorMode || runtimeController.isActive()) return;
    syncFocusWithCamera(state, camera, controls);
  }

  await setupScene({
    scene,
    objectsByName: state.objectsByName,
  });

  const gridHelper = scene.getObjectByName("GridHelper") ?? null;
  if (gridHelper) {
    gridHelper.visible = false;
  }

  let shadowDirty = true;
  let shadowFrameCounter = 0;

  function markShadowsDirty() {
    shadowDirty = true;
  }

  function getShadowRefreshInterval() {
    return isLiteMode
      ? LITE_SHADOW_REFRESH_INTERVAL
      : DEFAULT_SHADOW_REFRESH_INTERVAL;
  }

  function getShadowDirtyDebounce() {
    return isLiteMode
      ? LITE_SHADOW_DIRTY_DEBOUNCE
      : DEFAULT_SHADOW_DIRTY_DEBOUNCE;
  }

  const timer = new THREE.Timer();
  const pickNameAtClient = createRaycastPicker(state, dom, camera);
  const runtimeController = createRuntimeController();
  const skillAiSystem = createSkillAiSystem();
  const runtimeRaycaster = new THREE.Raycaster();
  let isEditorMode = false;
  let isLiteMode = false;
  let editorModeBeforeRuntime = false;
  let selectedObjectName = null;
  let pointLightCullingController = null;

  dom.addEventListener("wheel", syncViewerFocusFromWheel, { passive: true });

  const autoRotateController = createAutoRotateController({
    camera,
    objectsByName: state.objectsByName,
  });
  pointLightCullingController = createPointLightCullingController({
    camera,
    objectsByName: state.objectsByName,
    isEditorMode: () => isEditorMode,
    isRuntimeActive: () => runtimeController.isActive(),
    getRuntimePlayer: () => runtimeController.getCharacter(),
    getSelectedObjectName: () => selectedObjectName,
  });
  const fogController = createFogController({
    scene,
    objectsByName: state.objectsByName,
    getSelectedObjectName: () => selectedObjectName,
  });
  const skillAiEditorState = createSkillAiEditorState({
    objectsByName: state.objectsByName,
    onRestore: markShadowsDirty,
  });
  const transformControlsController = createTransformControlsController({
    scene,
    camera,
    dom,
    state,
    onShadowDirty: markShadowsDirty,
  });
  const lookController = createLookController({
    dom,
    camera,
    controls,
    state,
    getSelectedObject: () => (
      selectedObjectName
        ? state.objectsByName.get(selectedObjectName) ?? null
        : null
    ),
    isEditorMode: () => isEditorMode,
    isRuntimeActive: () => runtimeController.isActive(),
  });

  function getObjectByName(name) {
    return state.objectsByName.get(name) || null;
  }

  function generateUniqueObjectName(modelName = "object") {
    return generateUniqueObjectNameFromModel(modelName, state.objectsByName);
  }

  function getBaseShadowMapSize(light) {
    const saved = light.userData?.baseShadowMapSize;
    if (saved?.width > 0 && saved?.height > 0) {
      return saved;
    }

    const width = Math.max(1, Number(light.shadow?.mapSize?.width) || DEFAULT_SHADOW_MAP_SIZE);
    const height = Math.max(1, Number(light.shadow?.mapSize?.height) || DEFAULT_SHADOW_MAP_SIZE);
    light.userData.baseShadowMapSize = { width, height };
    return light.userData.baseShadowMapSize;
  }

  function applyShadowQualityForLight(light, liteMode = isLiteMode) {
    if (!light?.isLight || !light.shadow) return false;

    const baseSize = getBaseShadowMapSize(light);
    const scale = liteMode ? LITE_SHADOW_MAP_SCALE : 1;
    const targetWidth = Math.max(128, Math.round(baseSize.width * scale));
    const targetHeight = Math.max(128, Math.round(baseSize.height * scale));

    if (
      light.shadow.mapSize.width === targetWidth &&
      light.shadow.mapSize.height === targetHeight
    ) {
      return false;
    }

    light.shadow.mapSize.set(targetWidth, targetHeight);
    light.shadow.map?.dispose?.();
    light.shadow.map = null;
    return true;
  }

  function getObjectBaseVisibility(
    obj,
    {
      showEditorOnly = isEditorMode && !runtimeController.isActive(),
      liteMode = isLiteMode,
    } = {},
  ) {
    if (!obj) return false;
    if (obj.userData?.sceneOptions?.visible === false) return false;
    if (obj.userData?.hideOutsideEditor && !showEditorOnly) return false;
    if (liteMode && obj.name !== selectedObjectName && !shouldObjectRenderInLite(obj)) {
      return false;
    }
    return true;
  }

  function syncSceneObjectVisibility(
    options = {},
  ) {
    let changed = false;

    for (const obj of state.objectsByName.values()) {
      if (applyShadowQualityForLight(obj, options.liteMode)) {
        changed = true;
      }

      const baseVisible = getObjectBaseVisibility(obj, options);
      if (obj.userData?.baseVisible !== baseVisible) {
        obj.userData.baseVisible = baseVisible;
      }

      if (obj.isPointLight) {
        if (!baseVisible && obj.visible !== false) {
          obj.visible = false;
          changed = true;
        }
        continue;
      }

      if (obj.visible !== baseVisible) {
        obj.visible = baseVisible;
        changed = true;
      }
    }

    if (pointLightCullingController?.update()) {
      changed = true;
    }

    return changed;
  }

  function applyLiteMode(nextLiteMode) {
    isLiteMode = !!nextLiteMode;

    if (syncSceneObjectVisibility()) {
      markShadowsDirty();
    }
  }

  function applyEditorMode(nextEditorMode) {
    const wasEditorMode = isEditorMode;
    isEditorMode = !!nextEditorMode;

    if (wasEditorMode && !isEditorMode) {
      skillAiEditorState.cacheAll();
    } else if (!wasEditorMode && isEditorMode) {
      skillAiEditorState.restoreAll();
    }

    if (gridHelper) {
      gridHelper.visible = isEditorMode;
    }

    if (!isEditorMode) {
      clearHighlight(state);
    }

    controls.mouseButtons = {
      LEFT: null,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: isEditorMode ? THREE.MOUSE.PAN : null,
    };

    if (syncSceneObjectVisibility()) {
      markShadowsDirty();
    }
    fogController.applyFogMode(isEditorMode || runtimeController.isActive());
  }

  function prepareSceneReplacement() {
    lookController.cancel();
    runtimeController.stop(camera, controls);
    resetEditorState(state);
    autoRotateController.clearAllRoots();
  }

  function tick() {
    resizeRendererToCanvas(renderer, camera, dom);

    timer.update();
    const delta = timer.getDelta();

    updateAnimationMixers(state.objectsByName, delta);

    const nonEditorSimulationActive = !isEditorMode || runtimeController.isActive();

    if (nonEditorSimulationActive && autoRotateController.update(delta)) {
      markShadowsDirty();
    }

    if (runtimeController.isActive()) {
      runtimeController.update(delta, camera, controls, runtimeRaycaster);
      markShadowsDirty();
    } else if (state.running) {
      updateCameraFocus(state, camera, controls);
      controls.update();
    }

    if (nonEditorSimulationActive && (state.running || runtimeController.isActive())) {
      const aiResult = skillAiSystem.update({
        objectsByName: state.objectsByName,
        dt: delta,
        runtimeActive: runtimeController.isActive(),
        player: runtimeController.getCharacter(),
        pushPlayer: (dx, dz) => runtimeController.pushCharacter(dx, dz),
      });

      if (aiResult.aiMoved) {
        markShadowsDirty();
      }

      if (aiResult.playerPushed) {
        runtimeController.syncAfterExternalMovement(camera);
      }
    }

    if (pointLightCullingController.update()) {
      markShadowsDirty();
    }

    shadowFrameCounter += 1;
    const shouldRefreshForDirty =
      shadowDirty && shadowFrameCounter >= getShadowDirtyDebounce();
    const shouldRefreshForInterval =
      shadowFrameCounter >= getShadowRefreshInterval();

    if (shouldRefreshForDirty || shouldRefreshForInterval) {
      renderer.shadowMap.needsUpdate = true;
      shadowDirty = false;
      shadowFrameCounter = 0;
    }

    renderer.render(scene, camera);
    state.raf = requestAnimationFrame(tick);
  }

  tick();

  const objectApi = createViewportObjectApi({
    state,
    scene,
    camera,
    controls,
    dom,
    pickNameAtClient,
    getObjectByName,
    isEditorMode: () => isEditorMode,
    prepareSceneReplacement,
    syncSceneObjectVisibility,
    generateUniqueObjectName,
    skillAiEditorState,
    autoRotateController,
  });

  const api = {
    onTransformStart(cb) {
      state.onTransformStart = typeof cb === "function" ? cb : null;
    },

    onTransformEnd(cb) {
      state.onTransformEnd = typeof cb === "function" ? cb : null;
    },

    onTransformChange(cb) {
      if (typeof cb !== "function") {
        state.transformChangeListeners.clear();
        return () => {};
      }

      state.transformChangeListeners.add(cb);
      return () => {
        state.transformChangeListeners.delete(cb);
      };
    },

    setRunning(value) {
      state.running = !!value;
    },

    startRuntime(targetName, onStop, { onLayoutChange, onCursorLockChange } = {}) {
      editorModeBeforeRuntime = isEditorMode;
      applyEditorMode(false);
      lookController.cancel();

      if (state.tControls) {
        state.tControls.enabled = false;
        state.tControls.visible = false;
        state.tControls.detach();
      }

      fogController.applyFogMode(true);

      const started = runtimeController.start(
        state,
        camera,
        controls,
        targetName,
        canvas,
        () => {
          api.stopRuntime();
          onStop?.();
        },
        { onLayoutChange, onCursorLockChange },
      );

      if (!started) {
        applyEditorMode(editorModeBeforeRuntime);
      }

      return started;
    },

    stopRuntime() {
      const restoreEditorMode = editorModeBeforeRuntime;
      runtimeController.stop(camera, controls);
      applyEditorMode(restoreEditorMode);
    },

    isRuntimeActive() {
      return runtimeController.isActive();
    },

    setEditorMode(value) {
      applyEditorMode(value);
    },

    setLiteMode(value) {
      applyLiteMode(value);
    },

    setSelectedObjectName(name) {
      selectedObjectName = name || null;
      if (isLiteMode && syncSceneObjectVisibility()) {
        markShadowsDirty();
      }
      if (!isEditorMode && !runtimeController.isActive()) {
        fogController.updateViewerFogForSelection();
      }
    },

    dispose() {
      cancelAnimationFrame(state.raf);
      lookController.dispose();
      runtimeController.stop(camera, controls);
      resetTransformAttachment(state);

      state.onTransformStart = null;
      state.onTransformEnd = null;
      state.onTransformChange = null;
      state.transformChangeListeners.clear();

      transformControlsController.dispose();
      dom.removeEventListener("wheel", syncViewerFocusFromWheel);
      controls.dispose();

      clearRuntimeObjects(scene, state.objectsByName);
      clearModelRegistryCache();
      disposeSceneChildren(scene);
      renderer.renderLists?.dispose?.();
      renderer.dispose();
    },
    ...objectApi,
  };

  return { api, state };
}
