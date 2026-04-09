import { useEffect, useRef } from "react";
import { useKeybindings } from "../context/KeybindingsContext";
import { KEYBINDING_ACTIONS } from "../constants/keybindings";
import { normalizeEventKey, isTypingInField } from "../utils/keyboardHelpers";

export function useCameraMovement({
  enabled = true,
  viewportApiRef,
  editorMode,
  runtimeMode,
}) {
  const keybindings = useKeybindings();
  const keysPressed = useRef({});

  // Handle keydown
  useEffect(() => {
    if (!enabled || !editorMode || runtimeMode) return;

    const onKeyDown = (e) => {
      if (isTypingInField()) return;

      // Ignore keys when Ctrl/Cmd/Alt is pressed (those are for other shortcuts)
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const key = normalizeEventKey(e.key);
      keysPressed.current[key] = true;
    };

    const onKeyUp = (e) => {
      const key = normalizeEventKey(e.key);
      keysPressed.current[key] = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [enabled, editorMode, runtimeMode]);

  // Handle camera movement
  useEffect(() => {
    if (!enabled || !editorMode || runtimeMode) return;

    const interval = setInterval(() => {
      const api = viewportApiRef.current;
      if (!api?.moveCameraFree) return;

      const moveForwardKeyFull = keybindings
        .getKeybinding(KEYBINDING_ACTIONS.MOVE_FORWARD)
        ?.toUpperCase();
      const moveBackKeyFull = keybindings
        .getKeybinding(KEYBINDING_ACTIONS.MOVE_BACK)
        ?.toUpperCase();
      const moveLeftKeyFull = keybindings
        .getKeybinding(KEYBINDING_ACTIONS.MOVE_LEFT)
        ?.toUpperCase();
      const moveRightKeyFull = keybindings
        .getKeybinding(KEYBINDING_ACTIONS.MOVE_RIGHT)
        ?.toUpperCase();

      // Extract just the key part (without CTRL+ prefix)
      const getKeyPart = (fullKey) => {
        if (!fullKey) return null;
        return fullKey.includes("+") ? fullKey.split("+")[1] : fullKey;
      };

      const moveForwardKey = getKeyPart(moveForwardKeyFull);
      const moveBackKey = getKeyPart(moveBackKeyFull);
      const moveLeftKey = getKeyPart(moveLeftKeyFull);
      const moveRightKey = getKeyPart(moveRightKeyFull);

      const moveVector = {
        x: 0, // Left/Right (strafe)
        z: 0, // Forward/Backward (relative to camera direction)
      };

      // Forward/Backward - already handled by moveCameraFree relative to camera direction
      if (keysPressed.current[moveForwardKey]) {
        moveVector.z += 1;
      }
      if (keysPressed.current[moveBackKey]) {
        moveVector.z -= 1;
      }
      // Left/Right strafe
      if (keysPressed.current[moveLeftKey]) {
        moveVector.x += 1;
      }
      if (keysPressed.current[moveRightKey]) {
        moveVector.x -= 1;
      }

      if (moveVector.x !== 0 || moveVector.z !== 0) {
        api.moveCameraFree(moveVector.x, moveVector.z);
      }
    }, 1000 / 60); // 60 FPS

    return () => clearInterval(interval);
  }, [enabled, editorMode, runtimeMode, keybindings]);
}
