import { useEffect } from "react";
import { useKeybindings } from "../context/KeybindingsContext";
import { KEYBINDING_ACTIONS } from "../constants/keybindings";
import { matchesBinding, normalizeEventKey, isTypingInField } from "../utils/keyboardHelpers";

const TAB_VIEWPORT = "viewport";

// Map configurable key names to the corresponding KeyboardEvent.key values
const MODIFIER_KEY_MAP = {
  ALT: "Alt",
  SHIFT: "Shift",
  CONTROL: "Control",
  CTRL: "Control",
  META: "Meta",
};

function eventMatchesPrecisionKey(e, precisionKey) {
  if (!precisionKey) return false;
  const upper = precisionKey.toUpperCase();
  // If configured as a modifier name, match against e.key
  if (MODIFIER_KEY_MAP[upper]) {
    return e.key === MODIFIER_KEY_MAP[upper];
  }
  // Otherwise match normalised key
  return normalizeEventKey(e.key) === upper;
}

export function useTransformShortcuts({
  enabled = true,
  editorMode,
  runtimeMode,
  activeTab,
  transformMode,
  setTransformMode,
  viewportApiRef,
}) {
  const keybindings = useKeybindings();

  useEffect(() => {
    if (!enabled || !editorMode || runtimeMode || activeTab !== TAB_VIEWPORT) return;

    const onKeyDown = (e) => {
      if (isTypingInField()) return;
      if (e.repeat) return;

      const key = normalizeEventKey(e.key);
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      const shiftKey = e.shiftKey;

      // Get all transform keys
      const selectKey = keybindings.getKeybinding(KEYBINDING_ACTIONS.SELECT);
      const moveKey = keybindings.getKeybinding(KEYBINDING_ACTIONS.MOVE);
      const rotateKey = keybindings.getKeybinding(KEYBINDING_ACTIONS.ROTATE);
      const scaleKey = keybindings.getKeybinding(KEYBINDING_ACTIONS.SCALE);
      const cycleKey = keybindings.getKeybinding(KEYBINDING_ACTIONS.CYCLE_TRANSFORM);

      // Use strict matching - don't trigger if modifiers don't match the binding
      if (matchesBinding(selectKey, key, ctrlOrCmd, shiftKey)) {
        e.preventDefault();
        setTransformMode("select");
        return;
      }

      if (matchesBinding(moveKey, key, ctrlOrCmd, shiftKey)) {
        e.preventDefault();
        setTransformMode("translate");
        return;
      }

      if (matchesBinding(rotateKey, key, ctrlOrCmd, shiftKey)) {
        e.preventDefault();
        setTransformMode("rotate");
        return;
      }

      if (matchesBinding(scaleKey, key, ctrlOrCmd, shiftKey)) {
        e.preventDefault();
        setTransformMode("scale");
        return;
      }

      if (matchesBinding(cycleKey, key, ctrlOrCmd, shiftKey)) {
        e.preventDefault();
        // Cycle through modes
        const modes = ["translate", "rotate", "scale"];
        const currentIndex = modes.indexOf(transformMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        setTransformMode(modes[nextIndex]);
        return;
      }

      // Precision modifier — activate on key down
      const precisionKey = keybindings.getKeybinding(KEYBINDING_ACTIONS.PRECISION_MODIFIER);
      if (eventMatchesPrecisionKey(e, precisionKey)) {
        viewportApiRef?.current?.setPrecisionMode(true);
        return;
      }
    };

    const onKeyUp = (e) => {
      const precisionKey = keybindings.getKeybinding(KEYBINDING_ACTIONS.PRECISION_MODIFIER);
      if (eventMatchesPrecisionKey(e, precisionKey)) {
        viewportApiRef?.current?.setPrecisionMode(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      // Ensure precision is off when the effect cleans up
      viewportApiRef?.current?.setPrecisionMode(false);
    };
  }, [
    enabled,
    editorMode,
    runtimeMode,
    activeTab,
    transformMode,
    setTransformMode,
    viewportApiRef,
    keybindings,
  ]);
}
