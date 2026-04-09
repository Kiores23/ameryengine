import * as THREE from "three";
import {
  EDITOR_FOG_FAR,
  EDITOR_FOG_NEAR,
  FOG_COLOR,
  VIEWER_FOG_FAR,
  VIEWER_FOG_NEAR,
} from "../constants/fog";
import { getObjectViewScale } from "../constants/objectView";

const _viewerFogBox = new THREE.Box3();
const _viewerFogSize = new THREE.Vector3();

export function createFogController({ scene, objectsByName, getSelectedObjectName }) {
  const viewerFog = new THREE.Fog(FOG_COLOR, VIEWER_FOG_NEAR, VIEWER_FOG_FAR);
  const editorFog = new THREE.Fog(FOG_COLOR, EDITOR_FOG_NEAR, EDITOR_FOG_FAR);

  scene.fog = viewerFog;

  function updateViewerFogForSelection() {
    const selectedObjectName = getSelectedObjectName?.() ?? null;
    const selectedObj = selectedObjectName
      ? objectsByName.get(selectedObjectName)
      : null;

    if (!selectedObj) {
      viewerFog.near = VIEWER_FOG_NEAR;
      viewerFog.far = VIEWER_FOG_FAR;
      return;
    }

    _viewerFogBox.setFromObject(selectedObj);
    _viewerFogBox.getSize(_viewerFogSize);
    const maxDim = Math.max(_viewerFogSize.x, _viewerFogSize.y, _viewerFogSize.z, 0.5);
    const scale = getObjectViewScale(maxDim);

    viewerFog.near = VIEWER_FOG_NEAR * scale;
    viewerFog.far = VIEWER_FOG_FAR * scale;
  }

  function applyFogMode(isEditorOrRuntime) {
    if (!isEditorOrRuntime) {
      updateViewerFogForSelection();
    }

    scene.fog = isEditorOrRuntime ? editorFog : viewerFog;
  }

  return {
    applyFogMode,
    updateViewerFogForSelection,
  };
}
