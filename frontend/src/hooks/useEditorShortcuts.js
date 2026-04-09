import { useEffect } from "react";
import { useKeybindings } from "../context/KeybindingsContext";
import { KEYBINDING_ACTIONS } from "../constants/keybindings";
import { matchesBinding, normalizeEventKey, isTypingInField } from "../utils/keyboardHelpers";

export function useEditorShortcuts({
  editorMode,
  runtimeMode,
  activeTab,
  onDelete,
  onCopy,
  onPaste,
  onUndo,
}) {
  const keybindings = useKeybindings();

  useEffect(() => {
    const onKeyDown = async (e) => {
      if (e.repeat) return;
      if (isTypingInField()) return;
      if (!editorMode || runtimeMode) return;
      if (activeTab !== "viewport") return;

      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      const key = normalizeEventKey(e.key);
      const shiftKey = e.shiftKey;

      // Get keybinding configurations
      const deleteBinding = keybindings.getKeybinding(
        KEYBINDING_ACTIONS.DELETE
      );
      const undoBinding = keybindings.getKeybinding(KEYBINDING_ACTIONS.UNDO);
      const copyBinding = keybindings.getKeybinding(KEYBINDING_ACTIONS.COPY);
      const pasteBinding = keybindings.getKeybinding(
        KEYBINDING_ACTIONS.PASTE
      );

      // Check delete key (strict matching - only if configured)
      if (matchesBinding(deleteBinding, key, ctrlOrCmd, shiftKey)) {
        e.preventDefault();
        onDelete?.();
        return;
      }

      // Check undo key (strict matching)
      if (matchesBinding(undoBinding, key, ctrlOrCmd, shiftKey)) {
        e.preventDefault();
        await onUndo?.();
        return;
      }

      // Check copy key (strict matching)
      if (matchesBinding(copyBinding, key, ctrlOrCmd, shiftKey)) {
        e.preventDefault();
        onCopy?.();
        return;
      }

      // Check paste key (strict matching)
      if (matchesBinding(pasteBinding, key, ctrlOrCmd, shiftKey)) {
        e.preventDefault();
        await onPaste?.();
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [editorMode, runtimeMode, activeTab, onDelete, onCopy, onPaste, onUndo, keybindings]);
}
