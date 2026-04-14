import { useEffect, useRef, useState } from "react";
import {
  RENDER_MODE_LITE,
  RENDER_MODE_NATIVE,
  RENDER_MODE_NO_VIEWPORT,
  RENDER_MODE_ULTRA_LITE,
} from "../constants/appConstants";

const MODE_OPTIONS = [
  { value: RENDER_MODE_NATIVE, label: "Native Mode" },
  { value: RENDER_MODE_LITE, label: "Lite Mode" },
  { value: RENDER_MODE_ULTRA_LITE, label: "Ultra Lite Mode" },
  { value: RENDER_MODE_NO_VIEWPORT, label: "No Viewport Mode" },
];

function getButtonLabel(value) {
  switch (value) {
    case RENDER_MODE_LITE:
      return "Lite Mode ✓";
    case RENDER_MODE_ULTRA_LITE:
      return "Ultra Lite Mode ✓";
    case RENDER_MODE_NO_VIEWPORT:
      return "No Viewport Mode ✓";
    case RENDER_MODE_NATIVE:
    default:
      return "Lite Mode";
  }
}

export default function RenderModeMenu({
  value = RENDER_MODE_NATIVE,
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);
  const hasActiveLiteMode = value !== RENDER_MODE_NATIVE;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event) => {
      const menuEl = menuRef.current;
      if (!menuEl) return;
      if (menuEl.contains(event.target)) return;
      setOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [open]);

  return (
    <div className="fileMenuWrap" ref={menuRef}>
      <button
        className={
          "btn btn--ghost" + (open || hasActiveLiteMode ? " active" : "")
        }
        aria-pressed={open}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {getButtonLabel(value)}
      </button>

      {open && (
        <div
          className="fileMenuDropdown"
          onPointerDown={(event) => event.stopPropagation()}
          onClick={(event) => event.stopPropagation()}
        >
          {MODE_OPTIONS.map((option) => (
            <button
              key={option.value}
              className={
                "fileMenuItem" + (value === option.value ? " fileMenuItem--active" : "")
              }
              type="button"
              onClick={() => {
                onChange?.(option.value);
                setOpen(false);
              }}
            >
              {value === option.value ? `${option.label} ✓` : option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
