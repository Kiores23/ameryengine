import { useKeybindings } from "../context/KeybindingsContext";
import { KEYBINDING_ACTIONS } from "../constants/keybindings";

export default function AssetLibraryHint({ onToggle }) {
  const keybindings = useKeybindings();
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || (e.key === " " && !e.ctrlKey)) {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div
      className="demoNote"
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
    >
      {keybindings.getKeybinding(KEYBINDING_ACTIONS.TOGGLE_ASSET_LIBRARY)} to toggle the Asset Library.
    </div>
  );
}