// Default keybindings layouts
export const KEYBINDING_LAYOUTS = {
  QWERTY: {
    name: "QWERTY",
    select: "Q",
    move: "W",
    rotate: "E",
    scale: "R",
    cycleTransform: "Space",
    focus: "F",
    detachTransform: "ESCAPE",
    moveForward: "W",
    moveBack: "S",
    moveLeft: "A",
    moveRight: "D",
    undo: "CTRL+Z",
    copy: "CTRL+C",
    paste: "CTRL+V",
    delete: "DELETE",
    toggleAssetLibrary: "CTRL+Space",
    precisionModifier: "ALT",
  },
  AZERTY: {
    name: "AZERTY",
    select: "A",
    move: "Z",
    rotate: "E",
    scale: "R",
    cycleTransform: "Space",
    focus: "F",
    detachTransform: "ESCAPE",
    moveForward: "Z",
    moveBack: "S",
    moveLeft: "Q",
    moveRight: "D",
    undo: "CTRL+Z",
    copy: "CTRL+C",
    paste: "CTRL+V",
    delete: "DELETE",
    toggleAssetLibrary: "CTRL+Space",
    precisionModifier: "ALT",
  },
};

// Actions that can be mapped to keys
export const KEYBINDING_ACTIONS = {
  SELECT: "select",
  MOVE: "move",
  ROTATE: "rotate",
  SCALE: "scale",
  CYCLE_TRANSFORM: "cycleTransform",
  FOCUS: "focus",
  DETACH_TRANSFORM: "detachTransform",
  MOVE_FORWARD: "moveForward",
  MOVE_BACK: "moveBack",
  MOVE_LEFT: "moveLeft",
  MOVE_RIGHT: "moveRight",
  UNDO: "undo", // Ctrl/Cmd + Z
  COPY: "copy", // Ctrl/Cmd + C
  PASTE: "paste", // Ctrl/Cmd + V
  DELETE: "delete", // Delete/Backspace
  TOGGLE_ASSET_LIBRARY: "toggleAssetLibrary", // Ctrl + Space
  PRECISION_MODIFIER: "precisionModifier", // Hold for fine-grained transforms
};

export const KEYBINDING_CATEGORIES = {
  TRANSFORM: {
    label: "Transform",
    actions: [
      KEYBINDING_ACTIONS.SELECT,
      KEYBINDING_ACTIONS.MOVE,
      KEYBINDING_ACTIONS.ROTATE,
      KEYBINDING_ACTIONS.SCALE,
      KEYBINDING_ACTIONS.CYCLE_TRANSFORM,
      KEYBINDING_ACTIONS.PRECISION_MODIFIER,
    ],
  },
  CAMERA: {
    label: "Camera",
    actions: [
      KEYBINDING_ACTIONS.FOCUS,
      KEYBINDING_ACTIONS.MOVE_FORWARD,
      KEYBINDING_ACTIONS.MOVE_BACK,
      KEYBINDING_ACTIONS.MOVE_LEFT,
      KEYBINDING_ACTIONS.MOVE_RIGHT,
    ],
  },
  EDITING: {
    label: "Editing",
    actions: [
      KEYBINDING_ACTIONS.UNDO,
      KEYBINDING_ACTIONS.COPY,
      KEYBINDING_ACTIONS.PASTE,
      KEYBINDING_ACTIONS.DELETE,
    ],
  },
  UI: {
    label: "UI",
    actions: [
      KEYBINDING_ACTIONS.DETACH_TRANSFORM,
      KEYBINDING_ACTIONS.TOGGLE_ASSET_LIBRARY,
    ],
  },
};

export const ACTION_LABELS = {
  [KEYBINDING_ACTIONS.SELECT]: "Select (Transform mode)",
  [KEYBINDING_ACTIONS.MOVE]: "Move (Transform mode)",
  [KEYBINDING_ACTIONS.ROTATE]: "Rotate (Transform mode)",
  [KEYBINDING_ACTIONS.SCALE]: "Scale (Transform mode)",
  [KEYBINDING_ACTIONS.CYCLE_TRANSFORM]: "Cycle transform mode",
  [KEYBINDING_ACTIONS.FOCUS]: "Focus on object",
  [KEYBINDING_ACTIONS.DETACH_TRANSFORM]: "Detach transform",
  [KEYBINDING_ACTIONS.MOVE_FORWARD]: "Move camera forward",
  [KEYBINDING_ACTIONS.MOVE_BACK]: "Move camera backward",
  [KEYBINDING_ACTIONS.MOVE_LEFT]: "Move camera left",
  [KEYBINDING_ACTIONS.MOVE_RIGHT]: "Move camera right",
  [KEYBINDING_ACTIONS.UNDO]: "Undo",
  [KEYBINDING_ACTIONS.COPY]: "Copy",
  [KEYBINDING_ACTIONS.PASTE]: "Paste",
  [KEYBINDING_ACTIONS.DELETE]: "Delete",
  [KEYBINDING_ACTIONS.TOGGLE_ASSET_LIBRARY]: "Toggle Asset Library",
  [KEYBINDING_ACTIONS.PRECISION_MODIFIER]: "Precision modifier (hold)",
};

// Actions that cannot be reconfigured
export const IMMUTABLE_ACTIONS = new Set([]);
