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
  const [rightTab, setRightTab] = useState(RIGHT_TAB_DETAILS);
  const [transformOn, setTransformOn] = useState(false);
  const [transformMode, setTransformMode] = useState(TRANSFORM_TRANSLATE);
  const [AssetLibraryOpen, setAssetLibraryOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [demoUrl, setDemoUrl] = useState(DEFAULT_DEMO_URL);
  const [runtimeMode, setRuntimeMode] = useState(false);
  const [runtimeLayout, setRuntimeLayout] = useState("wasd");
  const [runtimeCursorLocked, setRuntimeCursorLocked] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState({ phase: "Initializing engine…", loaded: 0, total: 0 });
  const [statusMessage, setStatusMessage] = useState("Static portfolio ready.");

  // Ref to skip handleClearSelection on initial mount
  const isInitialMount = useRef(true);

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
    setActiveTab,
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
    setActiveTab,
    setHealthMessage: setStatusMessage,
    setSelectedSceneObjectName,
  });

  const editedItem = selectedSceneObject || selectedNode;

  useViewportSync({ viewportApiRef, activeTab });

  const canUseAssetLibrary = editorMode && activeTab === TAB_VIEWPORT && !runtimeMode;

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
    editorMode,
    runtimeMode,
    activeTab,
    onDelete: deleteSelectedSceneObject,
    onCopy: copySelectedSceneObject,
    onPaste: pasteSceneObject,
    onUndo: undoLastSceneAction,
  });

  useCameraMovement({
    enabled: editorMode,
    viewportApiRef,
    editorMode,
    runtimeMode,
  });

  useTransformShortcuts({
    enabled: editorMode,
    editorMode,
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
    // Skip on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    if (!editorMode) {
      // Stop runtime if active
      if (runtimeMode) {
        viewportApiRef.current?.stopRuntime?.();
        setRuntimeMode(false);
      }
      setTransformOn(false);
      setSelectedSceneObjectName(null);
      viewportApiRef.current?.clearEditorSelection?.();
      selectNode(NODES[0]?.id, { focus: true, trackHistory: false });
      resetHistory();
      setRightTab(RIGHT_TAB_DETAILS);
    }
    if (!editorMode && rightTab === RIGHT_TAB_EDIT) {
      setRightTab(RIGHT_TAB_DETAILS);
    }
  }, [editorMode, rightTab]);

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

  const openDemoForNode = (node) => {
    if (!node?.demoUrl) return;
    setDemoUrl(node.demoUrl);
    setActiveTab(TAB_DEMO);
  };

  const initialTarget = useMemo(
    () => editedItem?.target || null,
    [editedItem]
  );

  const tabIndex = TAB_ORDER.indexOf(activeTab);

  // Keep the outgoing tab rendered during the slide transition
  // Updated synchronously during render to avoid flicker
  const leavingTabRef = useRef(null);
  const [, forceRender] = useState(0);
  const prevTabRef = useRef(activeTab);

  if (prevTabRef.current !== activeTab) {
    leavingTabRef.current = prevTabRef.current;
    prevTabRef.current = activeTab;
  }

  const handleSlideTransitionEnd = useCallback(() => {
    if (leavingTabRef.current !== null) {
      leavingTabRef.current = null;
      forceRender((n) => n + 1);
    }
  }, []);

  const shouldRender = useCallback(
    (tab) => activeTab === tab || leavingTabRef.current === tab,
    [activeTab]
  );

  function exitRuntime() {
    if (!runtimeMode) return;
    viewportApiRef.current?.stopRuntime?.();
    setRuntimeMode(false);
  }

  const isLoading = !!loadingProgress;

  return (
    <div className="app">
      <header className="toolbar">
        <div className="toolbar__left">
          <img src={logo} alt="Logo" className="logo" />
          <span className="brand">AMery Engine</span>

          {!isLoading && (
            <>
              <button
                className="btn btn--ghost"
                aria-pressed={editorMode}
                onClick={() => { exitRuntime(); setEditorMode((v) => !v); }}
              >
                {editorMode ? "Editor Mode ✓" : "Editor Mode"}
              </button>

              <EditorFileMenu
                editorMode={editorMode && !runtimeMode}
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
                    setRuntimeMode(false);
                  } else {
                    const ok = viewportApiRef.current?.startRuntime?.("who_i_am", () => {
                      setRuntimeMode(false);
                    }, {
                      onLayoutChange: setRuntimeLayout,
                      onCursorLockChange: setRuntimeCursorLocked,
                    });
                    if (ok) { setRuntimeMode(true); setActiveTab(TAB_VIEWPORT); }
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
            <button className="btn" onClick={() => { exitRuntime(); setActiveTab(TAB_CONTACT); }}>
              Contact me
            </button>
          )}
        </div>
      </header>

      <div className={`main3${runtimeMode || loadingProgress ? " main3--runtime" : ""}`}>
        {loadingProgress && <LoadingScreen progress={loadingProgress} />}
        <aside className="dock left">
          {!runtimeMode && (
          <section className="panel">
            <div className="panel__title">Outliner</div>
            <Outliner
              nodes={NODES}
              sceneObjects={sceneObjects}
              selectedId={selectedId}
              selectedSceneObjectName={selectedSceneObjectName}
              onSelect={selectNode}
              onSelectSceneObject={selectSceneObject}
              editorMode={editorMode}
            />
          </section>
          )}
        </aside>

        <section className="center">
          <div className="centerTop">
            {!runtimeMode && (
            <Tabs
              activeTab={activeTab}
              onChangeTab={setActiveTab}
              canOpenMedia={nodeHasMedia(selectedNode)}
            />
            )}

            {canUseAssetLibrary && !runtimeMode && (
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
                      <Viewport
                        active={activeTab === TAB_VIEWPORT}
                        selectedTargetName={editedItem?.target || null}
                        editorMode={editorMode}
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

                      {canUseAssetLibrary && !runtimeMode && !AssetLibraryOpen && (
                        <AssetLibraryHint onToggle={toggleAssetLibrary} />
                      )}
                    </div>
                  </div>

                  {canUseAssetLibrary && AssetLibraryOpen && !runtimeMode && (
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
                          onClick={() => setActiveTab(TAB_VIEWPORT)}
                        >
                          Retour Viewport
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
          {!runtimeMode && (
          <section className="panel">
            {rightTab === RIGHT_TAB_DETAILS && !selectedSceneObject ? (
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
                editorMode={editorMode}
                setEditorMode={setEditorMode}
                transformOn={transformOn}
                setTransformOn={setTransformOn}
                setTransformMode={setTransformMode}
                onOpenEdit={() => {
                  setRightTab(RIGHT_TAB_EDIT);
                  setActiveTab(TAB_VIEWPORT);
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
