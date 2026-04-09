import { useEffect } from "react";
import { useKeybindings } from "../context/KeybindingsContext";
import { KEYBINDING_ACTIONS } from "../constants/keybindings";
import { matchesBinding, normalizeEventKey, isTypingInField } from "../utils/keyboardHelpers";

export function useViewportShortcuts({
  active,
  editorMode,
  runtimeMode,
  selectedTargetName,
  viewportApi,
  onClearSelection,
}) {
  const keybindings = useKeybindings();

  useEffect(() => {
    if (!active || runtimeMode) return;

    const isMac = navigator.platform.toUpperCase().includes("MAC");

    const onKeyDown = (e) => {
      if (isTypingInField()) return;

      const detachTransformKey = keybindings.getKeybinding(
        KEYBINDING_ACTIONS.DETACH_TRANSFORM
      );
      const focusKey = keybindings.getKeybinding(
        KEYBINDING_ACTIONS.FOCUS
      );

      const key = normalizeEventKey(e.key);
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      const shiftKey = e.shiftKey;

      // Check for Detach Transform key (Escape)
      if (matchesBinding(detachTransformKey, key, ctrlOrCmd, shiftKey)) {
        e.preventDefault();
        onClearSelection?.();
        return;
      }

      // Check for Focus key
      if (editorMode && matchesBinding(focusKey, key, ctrlOrCmd, shiftKey)) {
        if (selectedTargetName && viewportApi) {
          e.preventDefault();
          viewportApi.focusOnName(selectedTargetName);
        }
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [active, editorMode, runtimeMode, selectedTargetName, viewportApi, onClearSelection, JSON.stringify(keybindings.customKeybindings)]);
}
