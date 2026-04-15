import { useCallback, useEffect, useRef, useState } from "react";
import { createViewportEngine } from "../viewport";
import { useViewportShortcuts } from "../hooks/useViewportShortcuts";
import { useKeybindings } from "../context/KeybindingsContext";
import { KEYBINDING_ACTIONS } from "../constants/keybindings";
import { DEFAULT_SCENE_URL } from "../constants/appConstants";
import RuntimeHUD from "./RuntimeHUD";

export default function Viewport({
  active,
  selectedTargetName,
  editorMode,
  liteMode = false,
  ultraLiteMode = false,
  runtimeMode,
  runtimeLayout = "wasd",
  runtimeCursorLocked = false,
  showRuntimeRotateHint = false,
  mobileMode = false,
  transformMode,
  setTransformMode,
  onReady,
  onPickTargetName,
  onClearSelection,
  onSceneLoaded,
  onObjectAdded,
  onLoadingChange,
  showLoadingOverlay = true,
  sceneUrl = DEFAULT_SCENE_URL,
  sceneFile = null,
  reloadToken = 0,
}) {
  const canvasRef = useRef(null);
  const viewportWrapRef = useRef(null);
  const engineRef = useRef(null);
  const selectedTargetNameRef = useRef(selectedTargetName);
  const effectiveEditorModeRef = useRef(editorMode && !runtimeMode);
  const liteModeRef = useRef(liteMode);
  const ultraLiteModeRef = useRef(ultraLiteMode);
  const [engineReady, setEngineReady] = useState(false);
  const [sceneLoading, setSceneLoading] = useState(true);
  const [runtimeAutoRun, setRuntimeAutoRun] = useState(false);
  const [fullscreenActive, setFullscreenActive] = useState(false);
  const keybindings = useKeybindings();

  function getApi() {
    return engineRef.current?.api ?? null;
  }

  useEffect(() => {
    selectedTargetNameRef.current = selectedTargetName;
  }, [selectedTargetName]);

  useEffect(() => {
    effectiveEditorModeRef.current = editorMode && !runtimeMode;
  }, [editorMode, runtimeMode]);

  useEffect(() => {
    liteModeRef.current = liteMode;
  }, [liteMode]);

  useEffect(() => {
    ultraLiteModeRef.current = ultraLiteMode;
  }, [ultraLiteMode]);

  function resetSelectionSideEffects() {
    const api = getApi();
    if (!api) return;

    api.setTransformEnabled(false);
    api.detachTransform();
  }

  function notifySceneLoaded() {
    const api = getApi();
    if (!api?.saveScene) return;
  
    const snapshot = api.saveScene();
    onSceneLoaded?.(snapshot);
  }

  function syncSelectionAfterSceneLoad() {
    const api = getApi();
    if (!api) return;
    const targetName = selectedTargetNameRef.current;
    const isEditorMode = effectiveEditorModeRef.current;

    api.setLiteMode?.(liteModeRef.current);
    api.setUltraLiteMode?.(ultraLiteModeRef.current);
    api.setEditorMode(isEditorMode);
    api.setSelectedObjectName(targetName);

    if (!targetName) {
      api.clearEditorSelection?.();
      return;
    }

    api.highlightName?.(targetName);

    requestAnimationFrame(() => {
      if (getApi() !== api) return;
      api.focusOnName?.(targetName);
    });
  }

  function handleDragOver(e) {
    if (!engineReady || !editorMode || runtimeMode) return;

    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  async function handleDrop(e) {
    e.preventDefault();

    if (!engineReady || !editorMode || runtimeMode) return;

    const api = getApi();
    if (!api) return;

    const raw = e.dataTransfer.getData("application/x-scene-asset");
    if (!raw) return;

    let payload = null;

    try {
      payload = JSON.parse(raw);
    } catch (err) {
      console.warn("[Viewport] Invalid asset payload:", err);
      return;
    }

    if (payload?.kind !== "scene-asset") return;

    const asset = payload.asset;
    if (!asset?.model) return;

    const dropPos = api.getDropPositionAtClient?.(e.clientX, e.clientY) ?? {
      x: 0,
      y: 0.5,
      z: 0,
    };

    try {
      const createdObject = await api.addObject({
        model: asset.model,
        material: asset.material || {
          color: 0xffffff,
          roughness: 0.4,
          metalness: 0.1,
        },
        transform: {
          position: dropPos,
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
      });

      const createdName = createdObject?.name || asset.model;
      onPickTargetName?.(createdName);
      onObjectAdded?.(createdName);
      // Notify scene loaded to update sceneObjects, but the selection
      // will be preserved because onPickTargetName was called first
      notifySceneLoaded();
    } catch (err) {
      console.error("[Viewport] Failed to drop asset:", err);
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposed = false;
    let createdEngine = null;

    async function init() {
      try {
        onLoadingChange?.({ phase: "Initializing viewport…", loaded: 1, total: 5 });
        const engine = await createViewportEngine(canvas);

        if (disposed) {
          engine.api.dispose();
          return;
        }

        createdEngine = engine;
        engineRef.current = engine;
        setEngineReady(true);
        onLoadingChange?.({ phase: "Viewport ready, loading scene…", loaded: 2, total: 5 });
        
        onReady?.(engine.api);
      } catch (err) {
        console.error("[Viewport] Engine init failed:", err);
      }
    }

    init();

    return () => {
      disposed = true;
      setEngineReady(false);
      onLoadingChange?.(null);
      createdEngine?.api.dispose();
      engineRef.current = null;
      onReady?.(null);
    };
  }, []);

  useEffect(() => {
    getApi()?.setRunning(!!active);
  }, [active]);

  useEffect(() => {
    const api = getApi();
    if (!api) return;
    api.setEditorMode(editorMode && !runtimeMode);
  }, [editorMode, runtimeMode, engineReady]);

  useEffect(() => {
    const api = getApi();
    if (!api) return;
    api.setLiteMode?.(liteMode);
  }, [liteMode, engineReady]);

  useEffect(() => {
    const api = getApi();
    if (!api) return;
    api.setUltraLiteMode?.(ultraLiteMode);
  }, [ultraLiteMode, engineReady]);

  useEffect(() => {
    const api = getApi();
    if (!api) return;
    api.setSelectedObjectName(selectedTargetName);

    if (!selectedTargetName) {
      api.clearEditorSelection?.();
      return;
    }

    api.highlightName(selectedTargetName);
  }, [selectedTargetName, engineReady]);

  useEffect(() => {
    const api = getApi();
    if (!api) return;

    const enabled =
      !!editorMode &&
      !runtimeMode &&
      !!selectedTargetName &&
      transformMode !== "select";

    if (enabled) {
      api.setTransformMode(transformMode || "translate");
      api.setTransformEnabled(true);
      api.attachTransformToName(selectedTargetName);
    } else {
      api.setTransformEnabled(false);
      api.detachTransform();
    }
  }, [editorMode, runtimeMode, selectedTargetName, transformMode]);

  useEffect(() => {
    const api = getApi();
    if (!api?.setRuntimeVirtualMovement) return;

    if (!runtimeMode) {
      api.setRuntimeVirtualMovement(0, 0);
      api.setRuntimeAutoRun?.(false);
      setRuntimeAutoRun(false);
    }
  }, [runtimeMode]);

  const handleRuntimeMove = useCallback((x, y) => {
    getApi()?.setRuntimeVirtualMovement?.(x, y);
  }, []);

  const handleRuntimeMoveEnd = useCallback(() => {
    getApi()?.setRuntimeVirtualMovement?.(0, 0);
  }, []);

  const handleRuntimeJump = useCallback(() => {
    getApi()?.triggerRuntimeJump?.();
  }, []);

  const handleRuntimeAutoRunToggle = useCallback(() => {
    setRuntimeAutoRun((current) => {
      const nextValue = !current;
      getApi()?.setRuntimeAutoRun?.(nextValue);
      return nextValue;
    });
  }, []);

  const handleRuntimeLook = useCallback((deltaX, deltaY) => {
    getApi()?.applyRuntimeLookDelta?.(deltaX, deltaY);
  }, []);

  const handleToggleFullscreen = useCallback(async () => {
    const target = viewportWrapRef.current;
    if (!target || typeof document === "undefined") return;

    const doc = document;
    const fullscreenElement =
      doc.fullscreenElement || doc.webkitFullscreenElement || null;

    try {
      if (fullscreenElement === target) {
        if (doc.exitFullscreen) {
          await doc.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          doc.webkitExitFullscreen();
        }
        return;
      }

      if (target.requestFullscreen) {
        await target.requestFullscreen();
      } else if (target.webkitRequestFullscreen) {
        target.webkitRequestFullscreen();
      }
    } catch (err) {
      console.warn("[Viewport] Failed to toggle fullscreen:", err);
    }
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const doc = document;
    const updateFullscreenState = () => {
      const target = viewportWrapRef.current;
      const fullscreenElement =
        doc.fullscreenElement || doc.webkitFullscreenElement || null;
      setFullscreenActive(fullscreenElement === target);
    };

    updateFullscreenState();
    doc.addEventListener("fullscreenchange", updateFullscreenState);
    doc.addEventListener("webkitfullscreenchange", updateFullscreenState);

    return () => {
      doc.removeEventListener("fullscreenchange", updateFullscreenState);
      doc.removeEventListener("webkitfullscreenchange", updateFullscreenState);
    };
  }, []);

  // chargement runtime depuis une URL
  useEffect(() => {
    if (!engineReady) return;
  
    const api = getApi();
    if (!api) return;
    if (!sceneUrl) return;
    if (sceneFile) return;
  
    let cancelled = false;
  
    async function loadFromUrl() {
      try {
        setSceneLoading(true);
        onLoadingChange?.({ phase: "Connecting…", loaded: 2, total: 5 });
        await api.loadSceneFromUrl(sceneUrl, (p) => {
          if (!cancelled) onLoadingChange?.(p);
        });
        if (cancelled) return;
        resetSelectionSideEffects();
        syncSelectionAfterSceneLoad();
        notifySceneLoaded();
      } catch (err) {
        console.error(`[Viewport] Failed to load scene from URL: ${sceneUrl}`, err);
      } finally {
        if (!cancelled) {
          setSceneLoading(false);
          onLoadingChange?.(null);
        }
      }
    }
  
    loadFromUrl();
    console.log("[Viewport] load from URL", sceneUrl)
    console.log("[Viewport] load from file", sceneFile?.name);;
  
    return () => {
      cancelled = true;
    };
  }, [engineReady, sceneUrl, sceneFile, reloadToken]);

  // chargement runtime depuis un fichier importé
  useEffect(() => {
    if (!engineReady) return;
  
    const api = getApi();
    if (!api) return;
    if (!sceneFile) return;
  
    let cancelled = false;
  
    async function loadFromFile() {
      try {
        setSceneLoading(true);
        onLoadingChange?.({ phase: "Reading file…", loaded: 2, total: 5 });
        await api.loadSceneFromFile(sceneFile, (p) => {
          if (!cancelled) onLoadingChange?.(p);
        });
        if (cancelled) return;
        resetSelectionSideEffects();
        syncSelectionAfterSceneLoad();
        notifySceneLoaded();
      } catch (err) {
        console.error("[Viewport] Failed to load scene from file:", err);
      } finally {
        if (!cancelled) {
          setSceneLoading(false);
          onLoadingChange?.(null);
        }
      }
    }
  
    loadFromFile();
  
    return () => {
      cancelled = true;
    };
  }, [engineReady, sceneFile, reloadToken]);

  // Handle configurable Focus and Escape shortcuts
  useViewportShortcuts({
    active,
    editorMode,
    runtimeMode,
    selectedTargetName,
    viewportApi: engineRef.current?.api,
    onClearSelection,
  });



  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let moved = false;

    const onPointerDown = () => {
      moved = false;
    };

    const onPointerMove = () => {
      moved = true;
    };

    const onPointerUp = (e) => {
      if (!active || !editorMode || runtimeMode) return;
      if (e.button !== 0) return;
      if (moved) return;

      const api = getApi();
      if (!api?.pickNameAtClient) return;

      const name = api.pickNameAtClient(e.clientX, e.clientY);
      
      if (name) {
        onPickTargetName?.(name);
      } else {
        onClearSelection?.();
      }
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
    };
  }, [active, editorMode, runtimeMode, onPickTargetName, onClearSelection]);

  return (
    <div ref={viewportWrapRef} className={"viewportWrap" + (fullscreenActive ? " viewportWrap--fullscreen" : "")}
         onDragOver={handleDragOver}
         onDrop={handleDrop}
    >
      <canvas ref={canvasRef} className="viewportCanvas" />

      {mobileMode && !runtimeMode && (
        <div className="viewportMobileTopbar">
          <button
            type="button"
            className={
              "runtime-mobileHud__utilityBtn" +
              (fullscreenActive ? " is-active" : "")
            }
            onClick={handleToggleFullscreen}
            aria-pressed={fullscreenActive}
            aria-label={fullscreenActive ? "Exit fullscreen" : "Enter fullscreen"}
          >
            <span className="runtime-mobileHud__fullscreenIcon" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
          </button>
        </div>
      )}

      {showLoadingOverlay && (!engineReady || sceneLoading) && (
        <div className="viewportLoading">
          <div className="viewportLoading__spinner" />
          <span className="viewportLoading__text">Loading scene…</span>
        </div>
      )}

      {runtimeMode && (
        <RuntimeHUD
          layout={runtimeLayout}
          cursorLocked={runtimeCursorLocked}
          showRotateHint={showRuntimeRotateHint}
          mobileMode={mobileMode}
          autoRunEnabled={runtimeAutoRun}
          fullscreenActive={fullscreenActive}
          onMove={handleRuntimeMove}
          onMoveEnd={handleRuntimeMoveEnd}
          onLook={handleRuntimeLook}
          onJump={handleRuntimeJump}
          onToggleFullscreen={handleToggleFullscreen}
          onToggleAutoRun={handleRuntimeAutoRunToggle}
        />
      )}

      {editorMode && !runtimeMode && (
        <div className="overlayEditorMode">
          <div className="modeTitle">Editor Mode</div>
          <div className="modeValue" data-mode={transformMode}>
            {transformMode}
          </div>
        </div>
      )}

      {editorMode && !runtimeMode && (
        <div className="transformToolbar">
          <button
            type="button"
            className={`toolBtn${transformMode === "select" ? " active" : ""}`}
            onClick={() => setTransformMode("select")}
            title={`Select (${keybindings.getKeybinding(KEYBINDING_ACTIONS.SELECT)})`}
          >
            ⬚
          </button>
          <button
            type="button"
            className={`toolBtn${transformMode === "translate" ? " active" : ""}`}
            onClick={() => setTransformMode("translate")}
            title={`Move (${keybindings.getKeybinding(KEYBINDING_ACTIONS.MOVE)})`}
          >
            ↔
          </button>
          <button
            type="button"
            className={`toolBtn${transformMode === "rotate" ? " active" : ""}`}
            onClick={() => setTransformMode("rotate")}
            title={`Rotate (${keybindings.getKeybinding(KEYBINDING_ACTIONS.ROTATE)})`}
          >
            ↻
          </button>
          <button
            type="button"
            className={`toolBtn${transformMode === "scale" ? " active" : ""}`}
            onClick={() => setTransformMode("scale")}
            title={`Scale (${keybindings.getKeybinding(KEYBINDING_ACTIONS.SCALE)})`}
          >
            ⇲
          </button>
        </div>
      )}
    </div>
  );
}
