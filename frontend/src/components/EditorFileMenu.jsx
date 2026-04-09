import { useEffect, useRef, useState } from "react";

export default function EditorFileMenu({
  editorMode,
  onImportClick,
  onSaveClick,
  onFilePicked,
}) {
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef(null);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!editorMode) {
      setOpen(false);
    }
  }, [editorMode]);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (e) => {
      const menuEl = menuRef.current;
      if (!menuEl) return;
      if (menuEl.contains(e.target)) return;

      setOpen(false);
    };

    window.addEventListener("pointerdown", onPointerDown, true);
    return () => window.removeEventListener("pointerdown", onPointerDown, true);
  }, [open]);

  const handleImport = () => {
    fileInputRef.current?.click();
    setOpen(false);
    onImportClick?.();
  };

  const handleFileChange = (e) => {
    onFilePicked?.(e);
    e.target.value = "";
  };

  if (!editorMode) return null;

  return (
    <div className="fileMenuWrap" ref={menuRef}>
      <button
        className={"btn btn--ghost" + (open ? " active" : "")}
        aria-pressed={open}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        type="button"
      >
        File
      </button>

      {open && (
        <div
          className="fileMenuDropdown"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="fileMenuItem" type="button" onClick={handleImport}>
            Import map
          </button>

          <button
            className="fileMenuItem"
            type="button"
            onClick={() => {
              onSaveClick?.();
              setOpen(false);
            }}
          >
            Save map
          </button>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.scene.json,application/json"
        style={{ display: "none" }}
        onChange={handleFileChange}
      />
    </div>
  );
}