import { useEffect } from "react";
import { useKeybindings } from "../context/KeybindingsContext";
import { KEYBINDING_ACTIONS } from "../constants/keybindings";
import { matchesBinding, normalizeEventKey, isTypingInField } from "../utils/keyboardHelpers";

export function useKeyboardShortcuts({
  enabled = true,
  runtimeMode,
  selectedNode,
  onToggleAssetLibrary,
  onFocus,
}) {
  const keybindings = useKeybindings();

  useEffect(() => {
    if (!enabled || runtimeMode) return;

    const isMac = navigator.platform.toUpperCase().includes("MAC");

    // Helper to check if key matches binding
    const matchesBindingLocal = (binding, currentKey, hasCtrl, hasShift) => {
      return matchesBinding(binding, currentKey, hasCtrl, hasShift);
    };

    const onKey = (e) => {
      if (e.repeat) return;
      if (isTypingInField()) return;

      const focusKey = keybindings.getKeybinding(
        KEYBINDING_ACTIONS.FOCUS
      );
      const assetLibraryKey = keybindings.getKeybinding(
        KEYBINDING_ACTIONS.TOGGLE_ASSET_LIBRARY
      );

      const key = normalizeEventKey(e.key);
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      const shiftKey = e.shiftKey;

      // Check for Focus key
      if (matchesBindingLocal(focusKey, key, ctrlOrCmd, shiftKey)) {
        if (selectedNode) {
          e.preventDefault();
          onFocus?.();
        }
        return;
      }

      // Check for Asset Library key
      if (matchesBindingLocal(assetLibraryKey, key, ctrlOrCmd, shiftKey)) {
        e.preventDefault();
        onToggleAssetLibrary?.();
        return;
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled, runtimeMode, selectedNode, onToggleAssetLibrary, onFocus, JSON.stringify(keybindings.customKeybindings)]);
}