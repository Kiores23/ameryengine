import { useEffect, useRef, useState, useCallback } from "react";
import { supportsLiteAlwaysRender } from "../utils/sceneModels";

/* ── helpers ─────────────────────────────────────────── */
function vec3ToInputs(v) {
  return { x: v?.x ?? 0, y: v?.y ?? 0, z: v?.z ?? 0 };
}
function fmt(n) {
  return Number.isFinite(n) ? +n.toFixed(3) : 0;
}
function fmtColor(hex) {
  if (!hex) return "#ffffff";
  return hex.startsWith("#") ? hex : `#${hex}`;
}

/* ── DragInput ───────────────────────────────────────── */
function DragInput({ axis, value, onChange, onEditStart, step = 0.1 }) {
  const [editing, setEditing] = useState(false);
  const [raw, setRaw] = useState(String(fmt(value)));
  const inputRef = useRef(null);
  const dragging = useRef(false);
  const startX = useRef(0);
  const startVal = useRef(value);
  const didDrag = useRef(false);
  const undoStarted = useRef(false);
  const committed = useRef(false);

  const beginUndo = useCallback(() => {
    if (undoStarted.current) return;
    undoStarted.current = true;
    onEditStart?.();
  }, [onEditStart]);

  const onMouseDown = useCallback(
    (e) => {
      if (editing) return;
      if (e.button !== 0) return;

      dragging.current = true;
      didDrag.current = false;
      undoStarted.current = false;
      committed.current = false;
      startX.current = e.clientX;
      startVal.current = value;

      const onMove = (mv) => {
        const delta = (mv.clientX - startX.current) * step;
        if (Math.abs(delta) > 0.5) didDrag.current = true;
        if (Math.abs(delta) > 1e-6) beginUndo();
        const next = startVal.current + delta;
        setRaw(String(fmt(next)));
        onChange(next);
      };

      const onUp = () => {
        dragging.current = false;
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      e.preventDefault();
    },
    [beginUndo, editing, value, step, onChange]
  );

  const onClick = useCallback(() => {
    if (didDrag.current) return;
    undoStarted.current = false;
    committed.current = false;
    setEditing(true);
    setRaw(String(fmt(value)));
    setTimeout(() => inputRef.current?.select(), 0);
  }, [value]);

  const commitRaw = useCallback(() => {
    if (committed.current) return;
    committed.current = true;

    const n = parseFloat(raw);
    if (Number.isFinite(n)) {
      if (Math.abs(n - value) > 1e-6) {
        beginUndo();
        onChange(n);
      }
    } else {
      setRaw(String(fmt(value)));
    }

    setEditing(false);
  }, [beginUndo, raw, value, onChange]);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === "Tab") {
        commitRaw();
      }

      if (e.key === "Escape") {
        committed.current = true;
        setRaw(String(fmt(value)));
        setEditing(false);
      }

      e.stopPropagation();
    },
    [commitRaw, value]
  );

  const onBlur = useCallback(() => {
    commitRaw();
  }, [commitRaw]);

  return (
    <div className="xformAxis">
      <span className="xformAxis__label">{axis}</span>

      <div
        className={`xformField${editing ? " editing" : ""}${dragging.current ? " dragging" : ""}`}
        onMouseDown={onMouseDown}
        onClick={onClick}
      >
        <input
          ref={inputRef}
          className="xformField__input"
          type="number"
          value={editing ? raw : fmt(value)}
          readOnly={!editing}
          onChange={(e) => setRaw(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={onBlur}
          tabIndex={editing ? 0 : -1}
        />
      </div>
    </div>
  );
}

/* ── Row ─────────────────────────────────────────────── */
function Row({ label, values, onChange, onEditStart, step = 0.1 }) {
  return (
    <div className="xformRow">
      <div className="xformLabel">{label}</div>

      <div className="xformInputs">
        {["x", "y", "z"].map((k) => (
          <DragInput
            key={k}
            axis={k.toUpperCase()}
            value={values[k]}
            step={step}
            onChange={(n) => onChange({ ...values, [k]: n })}
            onEditStart={onEditStart}
          />
        ))}
      </div>
    </div>
  );
}

/* ── EditPanel ───────────────────────────────────────── */
export default function EditPanel({
  node,
  onBack,
  onFocus,
  transformMode,
  setTransformMode,
  viewportApiRef,
  pushUndo,
}) {
  if (!node) return null;

  const [loc, setLoc] = useState({ x: 0, y: 0, z: 0 });
  const [rot, setRot] = useState({ x: 0, y: 0, z: 0 });
  const [scl, setScl] = useState({ x: 1, y: 1, z: 1 });
  const [modelName, setModelName] = useState("");
  const [color, setColor] = useState("#ffffff");
  const [isLight, setIsLight] = useState(false);
  const [intensity, setIntensity] = useState(1);
  const [distance, setDistance] = useState(null);
  const [liteAlwaysRender, setLiteAlwaysRender] = useState(false);
  const [canConfigureLiteRendering, setCanConfigureLiteRendering] = useState(false);

  useEffect(() => {
    const api = viewportApiRef?.current;
    if (!api?.getTransformOfName) return;

    const t = api.getTransformOfName(node.target);
    if (!t) return;

    setLoc(vec3ToInputs(t.position));
    setRot(vec3ToInputs(t.rotation));
    setScl(vec3ToInputs(t.scale));
  }, [node?.target, viewportApiRef]);

  useEffect(() => {
    const api = viewportApiRef?.current;
    if (!api?.getMaterialOfName || !node?.target) return;

    const info = api.getMaterialOfName(node.target);
    if (!info) return;

    setColor(fmtColor(info.color));
    setIsLight(!!info.isLight);
    if (info.isLight) setIntensity(info.intensity ?? 1);
    setDistance(info.distance ?? null);
  }, [node?.target, viewportApiRef]);

  useEffect(() => {
    const api = viewportApiRef?.current;
    const descriptor = api?.getObjectDescriptorByName?.(node?.target);
    const model = descriptor?.model ?? node?.model ?? "";

    setCanConfigureLiteRendering(supportsLiteAlwaysRender(model));
    setLiteAlwaysRender(descriptor?.lite?.alwaysRender === true);
  }, [node?.target, node?.model, viewportApiRef]);

  useEffect(() => {
    const api = viewportApiRef?.current;

    if (!node) {
      setModelName("");
      return;
    }

    if (node.model) {
      setModelName(String(node.model));
      return;
    }

    if (api?.getObjectByName && node.target) {
      const obj = api.getObjectByName(node.target);
      const model =
        obj?.model ||
        obj?.modelName ||
        obj?.sourceModel ||
        obj?.asset ||
        obj?.assetName;

      if (model) {
        setModelName(String(model));
        return;
      }
    }

    setModelName(node.target || "Unknown model");
  }, [node, viewportApiRef]);

  useEffect(() => {
    const api = viewportApiRef?.current;
    if (!api?.onTransformChange) return;

    const handler = (t) => {
      if (!node?.target || t.name !== node.target) return;

      setLoc({ x: t.position.x, y: t.position.y, z: t.position.z });
      setRot({ x: t.rotation.x, y: t.rotation.y, z: t.rotation.z });
      setScl({ x: t.scale.x, y: t.scale.y, z: t.scale.z });
    };

    const unsubscribe = api.onTransformChange(handler);
    return () => unsubscribe?.();
  }, [node?.target, viewportApiRef]);

  const applyLoc = (next) => {
    setLoc(next);
    viewportApiRef?.current?.setPositionOfName?.(node.target, next);
  };

  const applyRot = (next) => {
    setRot(next);
    viewportApiRef?.current?.setRotationOfName?.(node.target, next);
  };

  const applyScl = (next) => {
    setScl(next);
    viewportApiRef?.current?.setScaleOfName?.(node.target, next);
  };

  const applyColor = (hex) => {
    setColor(hex);
    viewportApiRef?.current?.setColorOfName?.(node.target, hex);
  };

  const applyIntensity = (val) => {
    setIntensity(val);
    viewportApiRef?.current?.setIntensityOfName?.(node.target, val);
  };

  const applyDistance = (val) => {
    setDistance(val);
    viewportApiRef?.current?.setDistanceOfName?.(node.target, val);
  };

  const applyLiteAlwaysRender = (nextValue) => {
    const enabled = nextValue === true;
    setLiteAlwaysRender(enabled);
    viewportApiRef?.current?.setLiteAlwaysRenderOfName?.(node.target, enabled);
  };

  const modes = [
    { id: "translate", label: "Move" },
    { id: "rotate", label: "Rotate" },
    { id: "scale", label: "Scale" },
  ];

  return (
    <>
      <div className="panel__title detailsPanelTitle">
        <span>Edit</span>

        <div className="detailsPanelTitle__nav">
          <button
            type="button"
            className="detailsNavBtn"
            onClick={onBack}
            aria-label="Retour"
            title="Retour"
          >
            ←
          </button>
        </div>
      </div>

      <div className="panel__body">
        <div className="detailsCard editCard">
          <div className="details__header">
            <div className="details__headerMain">
              <span className="details__eyebrow">Editor Mode</span>
              <h3 className="details__title">{node.label}</h3>
            </div>

            <span className="details__type">{modelName || "Unknown model"}</span>
          </div>

          <div className="actions">
            <button className="btn btn--ghost" onClick={onFocus}>
              Focus
            </button>
          </div>

          <div className="details__hero editTransform" key={node.id}>
            <div className="details__heroHighlight" />

            <div className="xformTitle">Transform</div>
            <Row label="Location" values={loc} onChange={applyLoc} step={0.5}
              onEditStart={() => pushUndo?.({ type: 'position', name: node.target, old: { ...loc } })} />
            <Row label="Rotation" values={rot} onChange={applyRot} step={0.5}
              onEditStart={() => pushUndo?.({ type: 'rotation', name: node.target, old: { ...rot } })} />
            <Row label="Scale" values={scl} onChange={applyScl} step={0.01}
              onEditStart={() => pushUndo?.({ type: 'scale', name: node.target, old: { ...scl } })} />
          </div>

          {/* ── Material / Color Card ───────────────────── */}
          <div className="details__hero editMaterial">
            <div className="details__heroHighlight" />

            <div className="xformTitle">
              {isLight ? "Light Color" : "Material"}
            </div>

            <div className="xformRow">
              <div className="xformLabel">Color</div>
              <div className="xformInputs xformInputs--color">
                <input
                  type="color"
                  className="colorPicker"
                  value={color}
                  onMouseDown={() => pushUndo?.({ type: 'color', name: node.target, old: color })}
                  onChange={(e) => applyColor(e.target.value)}
                />
                <div className="colorHex">{color}</div>
              </div>
            </div>
          </div>

          {/* ── Light Intensity Card ────────────────────── */}
          {isLight && (
            <div className="details__hero editLight">
              <div className="details__heroHighlight" />

              <div className="xformTitle">Light</div>

              <div className="xformRow">
                <div className="xformLabel">Intensity</div>
                <div className="xformInputs xformInputs--single">
                  <DragInput
                    axis=""
                    value={intensity}
                    step={0.05}
                    onChange={applyIntensity}
                    onEditStart={() => pushUndo?.({ type: 'intensity', name: node.target, old: intensity })}
                  />
                </div>
              </div>

              {distance !== null && (
                <div className="xformRow">
                  <div className="xformLabel">Range</div>
                  <div className="xformInputs xformInputs--single">
                    <DragInput
                      axis=""
                      value={distance}
                      step={1}
                      onChange={applyDistance}
                      onEditStart={() => pushUndo?.({ type: 'distance', name: node.target, old: distance })}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {canConfigureLiteRendering && (
            <div className="details__hero editLite">
              <div className="details__heroHighlight" />

              <div className="xformTitle">Lite Mode</div>

              <div className="xformRow xformRow--toggle">
                <div className="xformLabel">Render</div>

                <label className="xformToggle">
                  <input
                    type="checkbox"
                    checked={liteAlwaysRender}
                    onChange={(e) => {
                      pushUndo?.({
                        type: "liteAlwaysRender",
                        name: node.target,
                        old: liteAlwaysRender,
                      });
                      applyLiteAlwaysRender(e.target.checked);
                    }}
                  />

                  <span className="xformToggle__text">
                    Always render this imported 3D model in lite mode
                  </span>
                </label>
              </div>
            </div>
          )}

          {!viewportApiRef?.current?.getTransformOfName && (
            <p className="hint">
              Note : fonctions Viewport manquantes. Les inputs s'affichent mais ne pilotent rien.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
