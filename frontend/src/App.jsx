import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import "./styles/main.css";

import { NODES } from "./data/nodes/index.js";
import Outliner from "./components/Outliner.jsx";
import Details from "./components/Details.jsx";
import EditPanel from "./components/EditPanel.jsx";
import Tabs from "./components/Tabs.jsx";
import Viewport from "./components/Viewport.jsx";
import MediaGallery from "./components/MediaGallery.jsx";
import AssetLibrary from "./components/AssetLibrary.jsx";
import ContactForm from "./components/ContactForm.jsx";
import EditorFileMenu from "./components/EditorFileMenu.jsx";
import RenderModeMenu from "./components/RenderModeMenu.jsx";
import AssetLibraryHint from "./components/AssetLibraryHint.jsx";
import ShortcutsModal from "./components/ShortcutsModal.jsx";
import LoadingScreen from "./components/LoadingScreen.jsx";

import logo from "./assets/logo.png";
import { RESUME_URL } from "./config/site";
import { useViewportSync } from "./hooks/useViewportSync";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useSceneEditor } from "./hooks/useSceneEditor";
import { useSelectionNavigation } from "./hooks/useSelectionNavigation";
import { useEditorShortcuts } from "./hooks/useEditorShortcuts";
import { useCameraMovement } from "./hooks/useCameraMovement";
import { useTransformShortcuts } from "./hooks/useTransformShortcuts";

import {
  DEFAULT_DEMO_URL,
  RIGHT_TAB_DETAILS,
  RIGHT_TAB_EDIT,
  RENDER_MODE_LITE,
  RENDER_MODE_NATIVE,
  RENDER_MODE_NO_VIEWPORT,
  RENDER_MODE_ULTRA_LITE,
  TAB_CONTACT,
  TAB_DEMO,
  TAB_MEDIA,
  TAB_VIEWPORT,
  TRANSFORM_TRANSLATE,
} from "./constants/appConstants";

import { nodeHasMedia } from "./utils/scene";

const TAB_ORDER = [TAB_VIEWPORT, TAB_MEDIA, TAB_DEMO, TAB_CONTACT];

export default function App() {
  const [activeTab, setActiveTab] = useState(TAB_VIEWPORT);
  const [editorMode, setEditorMode] = useState(false);
  const [renderMode, setRenderMode] = useState(RENDER_MODE_NATIVE);
  const [rightTab, setRightTab] = useState(RIGHT_TAB_DETAILS);
  const [transformOn, setTransformOn] = useState(false);
  const [transformMode, setTransformMode] = useState(TRANSFORM_TRANSLATE);
  const [AssetLibraryOpen, setAssetLibraryOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [demoUrl, setDemoUrl] = useState(DEFAULT_DEMO_URL);
  const [runtimeMode, setRuntimeMode] = useState(false);
  const [runtimeLaunchPending, setRuntimeLaunchPending] = useState(false);
  const [runtimeLayout, setRuntimeLayout] = useState("wasd");
  const [runtimeCursorLocked, setRuntimeCursorLocked] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ phase: "Initializing engine…", loaded: 0, total: 0 });
  const [modeLoadingProgress, setModeLoadingProgress] = useState(null);
  const [statusMessage, setStatusMessage] = useState("Static portfolio ready.");

  // Ref to skip handleClearSelection on initial mount
  const isInitialMount = useRef(true);

  const noViewportMode = renderMode === RENDER_MODE_NO_VIEWPORT;
  const liteMode = renderMode !== RENDER_MODE_NATIVE;
  const ultraLiteMode = renderMode === RENDER_MODE_ULTRA_LITE || noViewportMode;
  const baseTab = noViewportMode ? TAB_MEDIA : TAB_VIEWPORT;
  const runtimeUiMode = runtimeMode;
  const displayedTab = runtimeUiMode ? TAB_VIEWPORT : activeTab;
  const shouldMountViewport = !noViewportMode || runtimeMode || runtimeLaunchPending;

  const setResolvedActiveTab = useCallback((nextValue) => {
    setActiveTab((current) => {
      const resolved =
        typeof nextValue === "function"
          ? nextValue(current)
          : nextValue;

      if (noViewportMode && resolved === TAB_VIEWPORT) {
        return TAB_MEDIA;
      }

      return resolved;
    });
  }, [noViewportMode]);

  const {
    viewportApiRef,
    sceneUrl,
    sceneFile,
    sceneObjects,
    sceneReloadToken,
    selectedSceneObjectName,
    selectedSceneObject,
    setSceneObjects,
    setSelectedSceneObjectName,
    importSceneFile,
    exportCurrentScene,
    copySelectedSceneObject,
    pasteSceneObject,
    deleteSelectedSceneObject,
    undoLastSceneAction,
    pushUndo,
    bindViewportApi,
  } = useSceneEditor({
    setActiveTab: setResolvedActiveTab,
    setRightTab,
    setHealthMessage: setStatusMessage,
  });

  const {
    selectedId,
    selectedNode,
    historyBack,
    historyForward,
    selectNode,
    selectSceneObject,
    goBack,
    goForward,
    resetHistory,
  } = useSelectionNavigation({
    nodes: NODES,
    sceneObjects,
    viewportApiRef,
    rightTab,
    setRightTab,
    setActiveTab: setResolvedActiveTab,
    setHealthMessage: setStatusMessage,
    setSelectedSceneObjectName,
  });

  const editedItem = selectedSceneObject || selectedNode;
  const effectiveEditorMode = editorMode && !liteMode;
  const shouldShowEditPanel = effectiveEditorMode && rightTab === RIGHT_TAB_EDIT;

  useViewportSync({ viewportApiRef, activeTab: displayedTab });

  const canUseAssetLibrary =
    effectiveEditorMode &&
    activeTab === TAB_VIEWPORT &&
    !runtimeUiMode &&
    !noViewportMode;

  useKeyboardShortcuts({
    enabled: canUseAssetLibrary,
    runtimeMode,
    selectedNode,
    onToggleAssetLibrary: () => {
      if (!canUseAssetLibrary) return;
      setAssetLibraryOpen((v) => !v);
    },
    onFocus: () => {
      if (selectedNode) {
        viewportApiRef.current?.focusOnName(selectedNode.target);
      }
    },
  });

  useEditorShortcuts({
    editorMode: effectiveEditorMode,
    runtimeMode,
    activeTab,
    onDelete: deleteSelectedSceneObject,
    onCopy: copySelectedSceneObject,
    onPaste: pasteSceneObject,
    onUndo: undoLastSceneAction,
  });

  useCameraMovement({
    enabled: effectiveEditorMode,
    viewportApiRef,
    editorMode: effectiveEditorMode,
    runtimeMode,
  });

  useTransformShortcuts({
    enabled: effectiveEditorMode,
    editorMode: effectiveEditorMode,
    runtimeMode,
    activeTab,
    transformMode,
    setTransformMode,
    viewportApiRef,
  });

  const handleClearSelection = () => {
    setSelectedSceneObjectName(null);
    selectNode(null);
    setRightTab(RIGHT_TAB_DETAILS);
  };

  useEffect(() => {
    if (!liteMode || !editorMode) return;

    setEditorMode(false);
  }, [liteMode, editorMode]);

  useEffect(() => {
    if (!noViewportMode) return;
    if (activeTab !== TAB_VIEWPORT) return;

    setResolvedActiveTab(TAB_MEDIA);
  }, [activeTab, noViewportMode, setResolvedActiveTab]);

  useEffect(() => {
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (!effectiveEditorMode) {
      // Stop runtime if active
      if (runtimeMode) {
        viewportApiRef.current?.stopRuntime?.();
        setRuntimeMode(false);
        setRuntimeLaunchPending(false);
      }
      setTransformOn(false);
      setSelectedSceneObjectName(null);
      viewportApiRef.current?.clearEditorSelection?.();
      selectNode(NODES[0]?.id, { focus: true, trackHistory: false });
      resetHistory();
      setRightTab(RIGHT_TAB_DETAILS);
    }
    if (!effectiveEditorMode && rightTab === RIGHT_TAB_EDIT) {
      setRightTab(RIGHT_TAB_DETAILS);
    }
  }, [effectiveEditorMode, rightTab]);

  useEffect(() => {
    if (activeTab === TAB_MEDIA) {
      setRightTab(RIGHT_TAB_DETAILS);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!canUseAssetLibrary && AssetLibraryOpen) {
      setAssetLibraryOpen(false);
    }
  }, [canUseAssetLibrary, AssetLibraryOpen]);

  const toggleAssetLibrary = () => {
    if (!canUseAssetLibrary) return;
    setAssetLibraryOpen((v) => !v);
  };

  const handleRuntimeStopped = useCallback(() => {
    setRuntimeMode(false);
    setRuntimeLaunchPending(false);
    setModeLoadingProgress(null);
  }, []);

  useEffect(() => {
    if (noViewportMode) return;
    if (!runtimeLaunchPending) return;

    setRuntimeLaunchPending(false);
    setModeLoadingProgress(null);
  }, [
    noViewportMode,
    runtimeLaunchPending,
  ]);

  useEffect(() => {
    if (!runtimeLaunchPending) return;
    if (runtimeMode) return;
    if (loadingProgress) return;

    const api = viewportApiRef.current;
    if (!api?.startRuntime) return;

    const started = api.startRuntime?.("who_i_am", handleRuntimeStopped, {
      onLayoutChange: setRuntimeLayout,
      onCursorLockChange: setRuntimeCursorLocked,
    });

    if (!started) {
      setRuntimeLaunchPending(false);
      setModeLoadingProgress(null);
      setStatusMessage("Runtime start failed.");
      return;
    }

    setRuntimeMode(true);
    setModeLoadingProgress(null);
  }, [
    handleRuntimeStopped,
    loadingProgress,
    runtimeLaunchPending,
    runtimeMode,
    sceneReloadToken,
    viewportApiRef,
  ]);

  const handleRenderModeChange = useCallback((nextMode) => {
    setRenderMode(nextMode);

    if (nextMode === RENDER_MODE_NO_VIEWPORT) {
      setActiveTab(TAB_MEDIA);
    } else if (!runtimeMode) {
      setRuntimeLaunchPending(false);
      setModeLoadingProgress(null);
    }

    switch (nextMode) {
      case RENDER_MODE_LITE:
        setStatusMessage("Lite mode enabled.");
        break;
      case RENDER_MODE_ULTRA_LITE:
        setStatusMessage("Ultra lite mode enabled.");
        break;
      case RENDER_MODE_NO_VIEWPORT:
        setStatusMessage("No viewport mode enabled.");
        break;
      case RENDER_MODE_NATIVE:
      default:
        setStatusMessage("Lite mode disabled.");
        break;
    }
  }, [runtimeMode]);

  const openDemoForNode = (node) => {
    if (!node?.demoUrl) return;
    setDemoUrl(node.demoUrl);
    setResolvedActiveTab(TAB_DEMO);
  };

  const initialTarget = useMemo(
    () => editedItem?.target || null,
    [editedItem]
  );

  const tabIndex = TAB_ORDER.indexOf(displayedTab);

  // Keep the outgoing tab rendered during the slide transition
  // Updated synchronously during render to avoid flicker
  const leavingTabRef = useRef(null);
  const [, forceRender] = useState(0);
  const prevTabRef = useRef(displayedTab);

  if (prevTabRef.current !== displayedTab) {
    leavingTabRef.current = prevTabRef.current;
    prevTabRef.current = displayedTab;
  }

  const handleSlideTransitionEnd = useCallback(() => {
    if (leavingTabRef.current !== null) {
      leavingTabRef.current = null;
      forceRender((n) => n + 1);
    }
  }, []);

  const shouldRender = useCallback(
    (tab) => displayedTab === tab || leavingTabRef.current === tab,
    [displayedTab]
  );

  function exitRuntime() {
    if (!runtimeMode) return;
    viewportApiRef.current?.stopRuntime?.();
    handleRuntimeStopped();
  }

  const visibleLoadingProgress = loadingProgress || modeLoadingProgress;
  const isLoading = !!loadingProgress;

  return (
    <div className="app">
      <header className="toolbar">
        <div className="toolbar__left">
          <img src={logo} alt="Logo" className="logo" />
          <span className="brand">AMery Engine</span>

          <RenderModeMenu
            value={renderMode}
            onChange={handleRenderModeChange}
          />

          {!isLoading && (
            <>
              {!liteMode && (
                <button
                  className="btn btn--ghost"
                  aria-pressed={editorMode}
                  onClick={() => { exitRuntime(); setEditorMode((v) => !v); }}
                >
                  {editorMode ? "Editor Mode ✓" : "Editor Mode"}
                </button>
              )}

              <EditorFileMenu
                editorMode={effectiveEditorMode && !runtimeUiMode}
                onFilePicked={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  importSceneFile(file);
                }}
                onSaveClick={exportCurrentScene}
              />

              <button
                className={"btn btn--ghost" + (runtimeMode ? " active" : "")}
                onClick={(e) => {
                  if (runtimeMode) {
                    viewportApiRef.current?.stopRuntime?.();
                    handleRuntimeStopped();
                  } else if (noViewportMode) {
                    setModeLoadingProgress({ phase: "Initializing runtime…" });
                    setRuntimeLaunchPending(true);
                  } else {
                    const ok = viewportApiRef.current?.startRuntime?.("who_i_am", handleRuntimeStopped, {
                      onLayoutChange: setRuntimeLayout,
                      onCursorLockChange: setRuntimeCursorLocked,
                    });
                    if (ok) { setRuntimeMode(true); setResolvedActiveTab(TAB_VIEWPORT); }
                  }
                  e.currentTarget.blur();
                }}
                title={runtimeMode ? "Stop" : "Play"}
              >
                {runtimeMode ? "■" : "▶"}
              </button>
            </>
          )}
        </div>

        <div className="toolbar__right">
          <span className="pill">
            {statusMessage}
          </span>

          <a
            href={RESUME_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
          >
            CV
          </a>

          {!isLoading && (
            <button className="btn" onClick={() => { exitRuntime(); setResolvedActiveTab(TAB_CONTACT); }}>
              Contact me
            </button>
          )}
        </div>
      </header>

      <div className={`main3${runtimeUiMode || loadingProgress ? " main3--runtime" : ""}`}>
        {visibleLoadingProgress && <LoadingScreen progress={visibleLoadingProgress} />}
        <aside className="dock left">
          {!runtimeUiMode && (
          <section className="panel">
            <div className="panel__title">Outliner</div>
            <Outliner
              nodes={NODES}
              sceneObjects={sceneObjects}
              selectedId={selectedId}
              selectedSceneObjectName={selectedSceneObjectName}
              onSelect={selectNode}
              onSelectSceneObject={selectSceneObject}
              editorMode={effectiveEditorMode}
            />
          </section>
          )}
        </aside>

        <section className="center">
          <div className="centerTop">
            {!runtimeUiMode && (
            <Tabs
              activeTab={activeTab}
              onChangeTab={setResolvedActiveTab}
              canOpenMedia={noViewportMode ? true : nodeHasMedia(selectedNode)}
              baseTab={baseTab}
              viewportDisabled={noViewportMode}
            />
            )}

            {canUseAssetLibrary && !runtimeUiMode && (
              <>
                <button
                  className="btn centerTop__AssetLibraryBtn"
                  onClick={() => setShowShortcuts((v) => !v)}
                  title="Shortcuts"
                  type="button"
                >
                  Shortcuts
                </button>

                <button
                  className="btn centerTop__ShortcutBtn"
                  onClick={toggleAssetLibrary}
                  title="Open/close the asset library"
                  type="button"
                >
                  Asset Library
                </button>
              </>
            )}
          </div>

          {/* ── Tab slider ── */}
          <div className="tab-slider">
            <div
              className="tab-slide-track"
              style={{ transform: `translateX(-${tabIndex * 25}%)` }}
              onTransitionEnd={handleSlideTransitionEnd}
            >
              {/* Slide 0 — Viewport (always mounted) */}
              <div className="tab-slide">
                <div
                  className={
                    AssetLibraryOpen && canUseAssetLibrary
                      ? "viewportWithLibrary viewportWithLibrary--split"
                      : "viewportWithLibrary"
                  }
                >
                  <div className="viewportMain">
                    <div className="tabContent">
                      {shouldMountViewport && (
                        <Viewport
                          active={displayedTab === TAB_VIEWPORT}
                          selectedTargetName={editedItem?.target || null}
                          editorMode={effectiveEditorMode}
                          liteMode={liteMode}
                          ultraLiteMode={ultraLiteMode}
                          runtimeMode={runtimeMode}
                          runtimeLayout={runtimeLayout}
                          runtimeCursorLocked={runtimeCursorLocked}
                          transformOn={transformOn}
                          transformMode={transformMode}
                          setTransformMode={setTransformMode}
                          sceneUrl={sceneUrl}
                          sceneFile={sceneFile}
                          reloadToken={sceneReloadToken}
                          onReady={(api) => bindViewportApi(api, initialTarget)}
                          onLoadingChange={setLoadingProgress}
                          onSceneLoaded={(snapshot) => {
                            setSceneObjects(snapshot?.objects || []);
                            if (selectedSceneObjectName && snapshot?.objects) {
                              const stillExists = snapshot.objects.some((o) => o.name === selectedSceneObjectName);
                              if (!stillExists) {
                                setSelectedSceneObjectName(null);
                              }
                            } else if (!snapshot?.objects?.length) {
                              setSelectedSceneObjectName(null);
                            }
                          }}
                          onPickTargetName={(targetName) => {
                            const node = NODES.find((n) => n.target === targetName);
                            if (node) {
                              selectNode(node.id, { focus: false, trackHistory: true });
                            } else {
                              selectSceneObject(targetName, { focus: false });
                            }
                          }}
                          onClearSelection={handleClearSelection}
                          onObjectAdded={(name) => pushUndo({ type: 'add', name })}
                        />
                      )}

                      {canUseAssetLibrary && !runtimeUiMode && !AssetLibraryOpen && (
                        <AssetLibraryHint onToggle={toggleAssetLibrary} />
                      )}
                    </div>
                  </div>

                  {canUseAssetLibrary && AssetLibraryOpen && !runtimeUiMode && (
                    <AssetLibrary onClose={() => setAssetLibraryOpen(false)} />
                  )}
                </div>
              </div>

              {/* Slide 1 — Media */}
              <div className="tab-slide">
                {shouldRender(TAB_MEDIA) && (
                  <div className="tabContent">
                    <MediaGallery
                      node={selectedNode}
                      nodes={NODES}
                      onSelect={selectNode}
                    />
                  </div>
                )}
              </div>

              {/* Slide 2 — Demo */}
              <div className="tab-slide">
                {shouldRender(TAB_DEMO) && (
                  <div className="tabContent">
                    <div className="demoWrap">
                      <div className="demoHeader">
                        <span>Demo</span>
                        <button
                          className="btn btn--ghost"
                          onClick={() => setResolvedActiveTab(baseTab)}
                        >
                          {baseTab === TAB_MEDIA ? "Retour Media" : "Retour Viewport"}
                        </button>
                      </div>
                      <iframe
                        className="demoFrame"
                        src={demoUrl}
                        title="Demo"
                        loading="lazy"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Slide 3 — Contact */}
              <div className="tab-slide">
                {shouldRender(TAB_CONTACT) && (
                  <div className="tabContent">
                    <ContactForm />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <aside className="dock right">
          {!runtimeUiMode && (
          <section className="panel">
            {!shouldShowEditPanel ? (
              <Details
                node={selectedNode}
                nodes={NODES}
                onSelect={selectNode}
                onBack={goBack}
                onForward={goForward}
                canGoBack={historyBack.length > 0}
                canGoForward={historyForward.length > 0}
                onFocus={() => selectedNode && viewportApiRef.current?.focusOnName(selectedNode.target)}
                onOpenDemo={() => openDemoForNode(selectedNode)}
                editorMode={effectiveEditorMode}
                editorAvailable={!liteMode}
                setEditorMode={setEditorMode}
                transformOn={transformOn}
                setTransformOn={setTransformOn}
                setTransformMode={setTransformMode}
                onOpenEdit={() => {
                  setRightTab(RIGHT_TAB_EDIT);
                  setResolvedActiveTab(TAB_VIEWPORT);
                }}
              />
            ) : (
              <EditPanel
                node={editedItem}
                onBack={() => {
                  handleClearSelection();
                  setRightTab(RIGHT_TAB_DETAILS);
                }}
                onFocus={() =>
                  editedItem && viewportApiRef.current?.focusOnName(editedItem.target)
                }
                transformMode={transformMode}
                setTransformMode={setTransformMode}
                viewportApiRef={viewportApiRef}
                pushUndo={pushUndo}
              />
            )}
          </section>
          )}
        </aside>
      </div>

      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />



      <footer className="statusbar">
        <span>{statusMessage}</span>
        <span className="sep">•</span>
        <span>Static React build</span>
        <span className="sep">•</span>
        <span>Layout: {runtimeLayout.toUpperCase()}</span>
      </footer>
    </div>
  );
}
