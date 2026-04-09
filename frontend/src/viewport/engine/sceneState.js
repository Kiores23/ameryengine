import { clearHighlight } from "./highlight";
import { clearFocus } from "./cameraFocus";

export function resetTransformAttachment(state) {
  state.transformTargetName = null;
  state.tControls?.detach();
}

export function resetEditorState(state) {
  clearHighlight(state);
  resetTransformAttachment(state);
  clearFocus(state);
}
