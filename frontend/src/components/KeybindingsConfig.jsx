import { useState, useRef, useEffect } from "react";
import { useKeybindings } from "../context/KeybindingsContext";
import {
  KEYBINDING_LAYOUTS,
  KEYBINDING_CATEGORIES,
  ACTION_LABELS,
} from "../constants/keybindings";

export default function KeybindingsConfig() {
  const keybindings = useKeybindings();
  const [recordingAction, setRecordingAction] = useState(null);
  const recordingRef = useRef(null);

  const handleLayoutSwitch = (layoutName) => {
    keybindings.switchLayout(layoutName);
  };

  const handleResetToDefault = () => {
    if (
      window.confirm(
        "Reset all keybindings to QWERTY default? This cannot be undone."
      )
    ) {
      keybindings.resetToDefault();
    }
  };

  const startRecording = (action) => {
    setRecordingAction(action);
  };

  const stopRecording = () => {
    setRecordingAction(null);
    recordingRef.current = null;
  };

  useEffect(() => {
    if (!recordingAction) return;

    const handleKeyDown = (e) => {
      e.preventDefault();
      e.stopPropagation();

      // Allow recording modifier keys alone for modifier-type bindings (e.g. precision)
      const isModifierOnly = ["Control", "Shift", "Alt", "Meta"].includes(e.key);

      // Normalize Space key
      let key = e.key === " " ? "Space" : isModifierOnly ? e.key.toUpperCase() : e.key.toUpperCase();
      
      if (!isModifierOnly) {
        // If Ctrl/Cmd is pressed, prepend it to the key
        const isMac = navigator.platform.toUpperCase().includes("MAC");
        const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
        
        if (ctrlOrCmd) {
          key = "CTRL+" + key;
        }
      }

      recordingRef.current = key;
      keybindings.updateKeybinding(recordingAction, key);
      stopRecording();
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [recordingAction, keybindings]);

  return (
    <div className="keybindingsConfig">
      <div className="keybindingsHeader">
        <h3>Keyboard Shortcuts Configuration</h3>
        <div className="layoutSwitcher">
          <label>Layout:</label>
          <select
            value={keybindings.currentLayout}
            onChange={(e) => handleLayoutSwitch(e.target.value)}
          >
            {Object.keys(KEYBINDING_LAYOUTS).map((layout) => (
              <option key={layout} value={layout}>
                {layout}
              </option>
            ))}
          </select>
          <button
            className="btn btn--small"
            onClick={handleResetToDefault}
            title="Reset to default QWERTY layout"
          >
            Reset
          </button>
        </div>
      </div>

      {Object.entries(KEYBINDING_CATEGORIES).map(([categoryKey, category]) => (
        <div key={categoryKey} className="keybindingsCategory">
          <div className="categorySeparator" />
          <h4>{category.label}</h4>
          <div className="keybindingsList">
            {category.actions.map((action) => (
              <div
                key={action}
                className={`keybindingItem ${
                  recordingAction === action ? "recording" : ""
                }`}
              >
                <label className="keybindingLabel">
                  {ACTION_LABELS[action]}
                </label>
                <button
                  className="keybindingButton"
                  onClick={() => startRecording(action)}
                  disabled={recordingAction !== null && recordingAction !== action}
                  title="Click to rebind"
                >
                  {recordingAction === action
                    ? "Press a key..."
                    : keybindings.getKeybinding(action) || "—"}
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
