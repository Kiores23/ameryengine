import {
  SKILL_AI_CORPS_MODEL,
  SKILL_AI_MODEL,
} from "../runtime/ai/constants";

function isManagedSkillAiObject(obj) {
  return !!obj && (
    obj.userData?.isSkillAi ||
    obj.userData?.isSkillAiCorps ||
    obj.userData?.sceneModel === SKILL_AI_MODEL ||
    obj.userData?.sceneModel === SKILL_AI_CORPS_MODEL
  );
}

export function createSkillAiEditorState({ objectsByName, onRestore }) {
  function cacheObject(obj) {
    if (!isManagedSkillAiObject(obj)) return;

    obj.userData.editorDefaultTransform = {
      position: obj.position.clone(),
      rotation: obj.rotation.clone(),
      scale: obj.scale.clone(),
    };
  }

  function cacheAll() {
    for (const obj of objectsByName.values()) {
      cacheObject(obj);
    }
  }

  function restoreAll() {
    let restored = false;

    for (const obj of objectsByName.values()) {
      if (!isManagedSkillAiObject(obj)) continue;

      const saved = obj.userData?.editorDefaultTransform;
      if (!saved) continue;

      obj.position.copy(saved.position);
      obj.rotation.copy(saved.rotation);
      obj.scale.copy(saved.scale);
      delete obj.userData._focusCenter;
      restored = true;
    }

    if (restored) {
      onRestore?.();
    }
  }

  return {
    cacheObject,
    cacheAll,
    restoreAll,
  };
}
