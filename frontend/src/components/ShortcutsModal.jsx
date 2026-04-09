import KeybindingsConfig from "./KeybindingsConfig.jsx";

export default function ShortcutsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="shortcutsModalBackdrop" onClick={onClose}>
      <div className="shortcutsModal" onClick={(e) => e.stopPropagation()}>
        <div className="shortcutsModal__header">
          <h3>Shortcuts</h3>
          <button
            className="btn btn--icon"
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>
        <div className="shortcutsModal__content">
          <KeybindingsConfig />
        </div>
      </div>
    </div>
  );
}
