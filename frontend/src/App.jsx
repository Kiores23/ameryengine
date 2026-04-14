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
const MOBILE_BREAKPOINT = 1024;

function getInitialMobileLayout() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT}px)`).matches;
}

function getInitialPortraitOrientation() {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(orientation: portrait)").matches;
}

export default function App() {
  const initialMobileLayout = getInitialMobileLayout();
  const initialRenderMode = initialMobileLayout
    ? RENDER_MODE_ULTRA_LITE
    : RENDER_MODE_NATIVE;
  const [isMobileLayout, setIsMobileLayout] = useState(initialMobileLayout);
  const [isPortraitOrientation, setIsPortraitOrientation] = useState(
    getInitialPortraitOrientation()
  );
  const [activeTab, setActiveTab] = useState(() =>
    initialRenderMode === RENDER_MODE_NO_VIEWPORT ? TAB_MEDIA : TAB_VIEWPORT
  );
  const [editorMode, setEditorMode] = useState(false);
  const [renderMode, setRenderMode] = useState(initialRenderMode);
  const [rightTab, setRightTab] = useState(RIGHT_TAB_DETAILS);
  const [transformOn, setTransformOn] = useState(false);
  const [transformMode, setTransformMode] = useState(TRANSFORM_TRANSLATE);
  const [AssetLibraryOpen, setAssetLibraryOpen] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [mobilePanel, setMobilePanel] = useState(RIGHT_TAB_DETAILS);
  const [mobileOutlinerOpen, setMobileOutlinerOpen] = useState(false);
  const [hasOpenedViewport, setHasOpenedViewport] = useState(
    !initialMobileLayout && initialRenderMode !== RENDER_MODE_NO_VIEWPORT
  );
  const [demoUrl, setDemoUrl] = useState(DEFAULT_DEMO_URL);
  const [runtimeMode, setRuntimeMode] = useState(false);
  const [runtimeLaunchPending, setRuntimeLaunchPending] = useState(false);
  const [runtimeLayout, setRuntimeLayout] = useState("wasd");
  const [runtimeCursorLocked, setRuntimeCursorLocked] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(null);
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
  const canOpenSelectedMedia = noViewportMode ? true : nodeHasMedia(selectedNode);
  const canOpenDemoPanel =
    !!selectedNode?.demoUrl || demoUrl !== DEFAULT_DEMO_URL;
  const displayedMobilePanel = shouldShowEditPanel ? RIGHT_TAB_EDIT : mobilePanel;
  const isViewportVisible =
    runtimeUiMode ||
    (isMobileLayout
      ? displayedMobilePanel === TAB_VIEWPORT
      : displayedTab === TAB_VIEWPORT);
  const viewportSyncTab =
    runtimeUiMode || isViewportVisible
      ? TAB_VIEWPORT
      : activeTab === TAB_VIEWPORT
        ? null
        : activeTab;
  const shouldMountViewport =
    hasOpenedViewport || runtimeMode || runtimeLaunchPending;
  const showRuntimeRotateHint =
    runtimeMode && isMobileLayout && isPortraitOrientation;

  useViewportSync({ viewportApiRef, activeTab: viewportSyncTab });

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

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT}px)`
    );
    const handleChange = (event) => {
      setIsMobileLayout(event.matches);
    };

    setIsMobileLayout(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const orientationQuery = window.matchMedia("(orientation: portrait)");
    const handleChange = (event) => {
      setIsPortraitOrientation(event.matches);
    };

    setIsPortraitOrientation(orientationQuery.matches);

    if (typeof orientationQuery.addEventListener === "function") {
      orientationQuery.addEventListener("change", handleChange);
      return () => orientationQuery.removeEventListener("change", handleChange);
    }

    orientationQuery.addListener(handleChange);
    return () => orientationQuery.removeListener(handleChange);
  }, []);

  const handleClearSelection = () => {
    setSelectedSceneObjectName(null);
    selectNode(null);
    setRightTab(RIGHT_TAB_DETAILS);
    if (isMobileLayout && !runtimeUiMode) {
      setMobilePanel(RIGHT_TAB_DETAILS);
    }
  };

  useEffect(() => {
    if (!liteMode || !editorMode) return;

    setEditorMode(false);
  }, [liteMode, editorMode]);

  useEffect(() => {
    if (!isViewportVisible && !runtimeLaunchPending) return;

    setHasOpenedViewport(true);
  }, [isViewportVisible, runtimeLaunchPending]);

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

  useEffect(() => {
    if (!isMobileLayout || !runtimeUiMode) return;

    setMobileOutlinerOpen(false);
  }, [isMobileLayout, runtimeUiMode]);

  useEffect(() => {
    if (!isMobileLayout) {
      setMobileOutlinerOpen(false);
      return;
    }

    if (shouldShowEditPanel) {
      setMobilePanel(RIGHT_TAB_EDIT);
      return;
    }

    if (noViewportMode && mobilePanel === TAB_VIEWPORT) {
      setMobilePanel(RIGHT_TAB_DETAILS);
    }
  }, [isMobileLayout, mobilePanel, noViewportMode, shouldShowEditPanel]);

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
    if (!runtimeLaunchPending) return;
    if (runtimeMode) return;
    if (loadingProgress) return;

    const api = viewportApiRef.current;
    if (!api?.startRuntime) return;

    const started = api.startRuntime?.("who_i_am", handleRuntimeStopped, {
      onLayoutChange: setRuntimeLayout,
      onCursorLockChange: setRuntimeCursorLocked,
      background: isMobileLayout,
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
    isMobileLayout,
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

      if (isMobileLayout && mobilePanel === TAB_VIEWPORT) {
        setMobilePanel(RIGHT_TAB_DETAILS);
      }
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
  }, [isMobileLayout, mobilePanel, runtimeMode]);

  useEffect(() => {
    if (!isMobileLayout) return;
    if (renderMode === RENDER_MODE_ULTRA_LITE) return;

    handleRenderModeChange(RENDER_MODE_ULTRA_LITE);
  }, [handleRenderModeChange, isMobileLayout, renderMode]);

  const handleToolbarFilePicked = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    importSceneFile(file);
  }, [importSceneFile]);

  const handleRuntimeToggle = useCallback((event) => {
    if (runtimeMode) {
      viewportApiRef.current?.stopRuntime?.();
      handleRuntimeStopped();
    } else if (noViewportMode) {
      setRuntimeLaunchPending(true);
    } else {
      const api = viewportApiRef.current;

      if (!api?.startRuntime) {
        setRuntimeLaunchPending(true);
        setResolvedActiveTab(TAB_VIEWPORT);

        if (isMobileLayout && !runtimeUiMode) {
          setMobilePanel(TAB_VIEWPORT);
        }

        event?.currentTarget?.blur?.();
        return;
      }

      const ok = api.startRuntime(
        "who_i_am",
        handleRuntimeStopped,
        {
          onLayoutChange: setRuntimeLayout,
          onCursorLockChange: setRuntimeCursorLocked,
          background: isMobileLayout,
        }
      );

      if (ok) {
        setRuntimeMode(true);
        setResolvedActiveTab(TAB_VIEWPORT);
        if (isMobileLayout) {
          setMobilePanel(TAB_VIEWPORT);
        }
      }
    }

    event?.currentTarget?.blur?.();
  }, [
    handleRuntimeStopped,
    isMobileLayout,
    noViewportMode,
    runtimeMode,
    runtimeUiMode,
    setResolvedActiveTab,
    viewportApiRef,
  ]);

  const handleMobilePanelChange = useCallback((nextPanel) => {
    setMobilePanel(nextPanel);
    setMobileOutlinerOpen(false);

    if (nextPanel === RIGHT_TAB_EDIT) {
      setRightTab(RIGHT_TAB_EDIT);
      setResolvedActiveTab(TAB_VIEWPORT);
      return;
    }

    if (nextPanel === RIGHT_TAB_DETAILS) {
      setRightTab(RIGHT_TAB_DETAILS);
      return;
    }

    setRightTab(RIGHT_TAB_DETAILS);
    setResolvedActiveTab(nextPanel);
  }, [setResolvedActiveTab]);

  const resolveMobilePanelAfterNodeChange = useCallback(() => {
    if (!isMobileLayout || runtimeUiMode) return;

    setMobileOutlinerOpen(false);

    if (displayedMobilePanel === TAB_CONTACT) {
      setMobilePanel(RIGHT_TAB_DETAILS);
      setRightTab(RIGHT_TAB_DETAILS);
    }
  }, [displayedMobilePanel, isMobileLayout, runtimeUiMode]);

  const handleSelectNode = useCallback((id, opts = {}) => {
    resolveMobilePanelAfterNodeChange();
    selectNode(id, opts);
  }, [resolveMobilePanelAfterNodeChange, selectNode]);

  const handleSelectSceneObject = useCallback((objectName, opts = {}) => {
    if (isMobileLayout && !runtimeUiMode) {
      setMobilePanel(RIGHT_TAB_EDIT);
      setMobileOutlinerOpen(false);
    }

    selectSceneObject(objectName, opts);
  }, [isMobileLayout, runtimeUiMode, selectSceneObject]);

  const handleGoBack = useCallback(() => {
    resolveMobilePanelAfterNodeChange();
    goBack();
  }, [goBack, resolveMobilePanelAfterNodeChange]);

  const handleGoForward = useCallback(() => {
    resolveMobilePanelAfterNodeChange();
    goForward();
  }, [goForward, resolveMobilePanelAfterNodeChange]);

  const openDemoForNode = (node) => {
    if (!node?.demoUrl) return;
    setDemoUrl(node.demoUrl);
    setResolvedActiveTab(TAB_DEMO);
    if (isMobileLayout && !runtimeUiMode) {
      setMobilePanel(TAB_DEMO);
    }
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
  const shouldShowInlineViewportLoading =
    isMobileLayout &&
    displayedMobilePanel === TAB_VIEWPORT &&
    !!visibleLoadingProgress;
  const shouldShowGlobalLoading =
    !!visibleLoadingProgress && !shouldShowInlineViewportLoading;
  const mobilePrimaryNav = (
    <div className="mobilePrimaryNav" aria-label="Mobile panel navigation">
      <button
        className="mobileOutlinerToggle mobileOutlinerToggle--inline"
        type="button"
        aria-label={mobileOutlinerOpen ? "Fermer le sommaire" : "Ouvrir le sommaire"}
        aria-expanded={mobileOutlinerOpen}
        onClick={() => setMobileOutlinerOpen((open) => !open)}
      >
        <span />
        <span />
        <span />
      </button>

      <div className="mobilePanelSwitcher">
        {[
          { id: RIGHT_TAB_DETAILS, label: "Details", disabled: false },
          { id: TAB_MEDIA, label: "Media", disabled: !canOpenSelectedMedia },
          { id: TAB_VIEWPORT, label: "Viewport", disabled: noViewportMode },
          { id: TAB_CONTACT, label: "Contact", disabled: false },
        ].map((item) => (
          <button
            key={item.id}
            className={
              "btn btn--ghost tab" +
              (displayedMobilePanel === item.id ? " active" : "") +
              (item.disabled ? " disabled" : "")
            }
            type="button"
            disabled={item.disabled}
            onClick={() => handleMobilePanelChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
  const mobilePanelSwitcher = (
    <div className="mobilePanelSwitcher" aria-label="Mobile panel navigation">
      {[
        { id: RIGHT_TAB_DETAILS, label: "Details", disabled: false },
        { id: TAB_MEDIA, label: "Media", disabled: !canOpenSelectedMedia },
        { id: TAB_VIEWPORT, label: "Viewport", disabled: noViewportMode },
        { id: TAB_CONTACT, label: "Contact", disabled: false },
      ].map((item) => (
        <button
          key={item.id}
          className={
            "btn btn--ghost tab" +
            (displayedMobilePanel === item.id ? " active" : "") +
            (item.disabled ? " disabled" : "")
          }
          type="button"
          disabled={item.disabled}
          onClick={() => handleMobilePanelChange(item.id)}
        >
          {item.label}
        </button>
      ))}

      {canUseAssetLibrary && displayedMobilePanel === TAB_VIEWPORT && (
        <>
          <button
            className="btn btn--ghost"
            onClick={() => setShowShortcuts((v) => !v)}
            title="Shortcuts"
            type="button"
          >
            Shortcuts
          </button>

          <button
            className="btn btn--ghost"
            onClick={toggleAssetLibrary}
            title="Open/close the asset library"
            type="button"
          >
            Asset Library
          </button>
        </>
      )}
    </div>
  );
  const viewportContent = (
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
              active={isViewportVisible}
              selectedTargetName={editedItem?.target || null}
              editorMode={effectiveEditorMode}
              liteMode={liteMode}
              ultraLiteMode={ultraLiteMode}
              runtimeMode={runtimeMode}
              runtimeLayout={runtimeLayout}
              runtimeCursorLocked={runtimeCursorLocked}
              showRuntimeRotateHint={showRuntimeRotateHint}
              mobileMode={isMobileLayout}
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
                  const stillExists = snapshot.objects.some(
                    (o) => o.name === selectedSceneObjectName
                  );
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
                  handleSelectNode(node.id, {
                    focus: false,
                    trackHistory: true,
                  });
                } else {
                  handleSelectSceneObject(targetName, { focus: false });
                }
              }}
              onClearSelection={handleClearSelection}
              onObjectAdded={(name) => pushUndo({ type: "add", name })}
              showLoadingOverlay={!shouldShowInlineViewportLoading}
            />
          )}

          {shouldShowInlineViewportLoading && (
            <LoadingScreen
              progress={visibleLoadingProgress}
              className="loadingScreen--panel"
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
  );
  const mediaContent = (
    <MediaGallery
      node={selectedNode}
      nodes={NODES}
      onSelect={handleSelectNode}
    />
  );
  const demoContent = (
    <div className="demoWrap">
      <div className="demoHeader">
        <span>Demo</span>
        <button
          className="btn btn--ghost"
          onClick={() => {
            if (isMobileLayout && !runtimeUiMode) {
              handleMobilePanelChange(RIGHT_TAB_DETAILS);
              return;
            }

            setResolvedActiveTab(baseTab);
          }}
        >
          {isMobileLayout && !runtimeUiMode
            ? "Retour Details"
            : baseTab === TAB_MEDIA
              ? "Retour Media"
              : "Retour Viewport"}
        </button>
      </div>
      <iframe
        className="demoFrame"
        src={demoUrl}
        title="Demo"
        loading="lazy"
      />
    </div>
  );
  const contactContent = <ContactForm />;
  const mobilePanelContent = (() => {
    switch (displayedMobilePanel) {
      case RIGHT_TAB_EDIT:
        return (
          <EditPanel
            node={editedItem}
            onBack={() => {
              handleClearSelection();
              setRightTab(RIGHT_TAB_DETAILS);
              setMobilePanel(RIGHT_TAB_DETAILS);
            }}
            onFocus={() =>
              editedItem && viewportApiRef.current?.focusOnName(editedItem.target)
            }
            transformMode={transformMode}
            setTransformMode={setTransformMode}
            viewportApiRef={viewportApiRef}
            pushUndo={pushUndo}
            subbarContent={mobilePanelSwitcher}
          />
        );
      case TAB_MEDIA:
        return (
          <>
            <div className="panel__title mobilePanelHeader">
              {mobilePrimaryNav}
            </div>
            <div className="panel__body panel__body--flush mobilePanelBody">
              {mediaContent}
            </div>
          </>
        );
      case TAB_DEMO:
        return (
          <>
            <div className="panel__title">Demo</div>
            <div className="panel__subbar mobilePanelSubbar">
              {mobilePanelSwitcher}
            </div>
            <div className="panel__body panel__body--flush mobilePanelBody">
              {demoContent}
            </div>
          </>
        );
      case TAB_CONTACT:
        return (
          <>
            <div className="panel__title mobilePanelHeader">
              {mobilePrimaryNav}
            </div>
            <div className="panel__body panel__body--flush mobilePanelBody">
              {contactContent}
            </div>
          </>
        );
      case TAB_VIEWPORT:
        return (
          <>
            <div className="panel__title mobilePanelHeader">
              {mobilePrimaryNav}
            </div>
            <div className="panel__body panel__body--flush mobilePanelBody">
              {viewportContent}
            </div>
          </>
        );
      case RIGHT_TAB_DETAILS:
      default:
        return (
          <Details
            node={selectedNode}
            nodes={NODES}
            onSelect={handleSelectNode}
            onBack={handleGoBack}
            onForward={handleGoForward}
            canGoBack={historyBack.length > 0}
            canGoForward={historyForward.length > 0}
            onFocus={() =>
              selectedNode && viewportApiRef.current?.focusOnName(selectedNode.target)
            }
            onOpenDemo={() => openDemoForNode(selectedNode)}
            editorMode={effectiveEditorMode}
            editorAvailable={!liteMode}
            setEditorMode={setEditorMode}
            transformOn={transformOn}
            setTransformOn={setTransformOn}
            setTransformMode={setTransformMode}
            onOpenEdit={() => {
              setRightTab(RIGHT_TAB_EDIT);
              setMobilePanel(RIGHT_TAB_EDIT);
              setResolvedActiveTab(TAB_VIEWPORT);
            }}
            hideDefaultHeader
            headerContent={mobilePrimaryNav}
          />
        );
    }
  })();

  return (
    <div className="app">
      <header className={"toolbar" + (isMobileLayout ? " toolbar--mobile" : "")}>
        <div className="toolbar__left">
          <img src={logo} alt="Logo" className="logo" />
          <span className="brand">AMery Engine</span>

          {!isMobileLayout && (
            <RenderModeMenu
              value={renderMode}
              onChange={handleRenderModeChange}
            />
          )}

          {!isLoading && !isMobileLayout && (
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
                onFilePicked={handleToolbarFilePicked}
                onSaveClick={exportCurrentScene}
              />

              <button
                className={"btn btn--ghost" + (runtimeMode ? " active" : "")}
                onClick={handleRuntimeToggle}
                title={runtimeMode ? "Stop" : "Play"}
              >
                {runtimeMode ? "■" : "▶"}
              </button>
            </>
          )}
        </div>

        {isMobileLayout ? (
          <div className="toolbar__right">
            <button
              className={"btn btn--ghost" + (runtimeMode ? " active" : "")}
              onClick={handleRuntimeToggle}
              title={runtimeMode ? "Stop" : "Play"}
            >
              {runtimeMode ? "■" : "▶"}
            </button>
          </div>
        ) : (
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
              <button
                className="btn"
                onClick={() => {
                  exitRuntime();
                  if (isMobileLayout && !runtimeUiMode) {
                    handleMobilePanelChange(TAB_CONTACT);
                    return;
                  }

                  setResolvedActiveTab(TAB_CONTACT);
                }}
              >
                Contact me
              </button>
            )}
          </div>
        )}
      </header>

      <div className={`main3${runtimeUiMode || loadingProgress ? " main3--runtime" : ""}`}>
        {shouldShowGlobalLoading && <LoadingScreen progress={visibleLoadingProgress} />}
        {isMobileLayout ? (
          <section className="center center--mobile">
            <div className="mobileMainWrap">
              <section
                className={
                  "panel mobileMainPanel" +
                  (runtimeUiMode ? " mobileMainPanel--runtime" : "")
                }
              >
                {mobilePanelContent}
              </section>

              {!runtimeUiMode && (
                <>
                  <div
                    className={
                      "mobileOutlinerBackdrop" + (mobileOutlinerOpen ? " is-open" : "")
                    }
                    onClick={() => setMobileOutlinerOpen(false)}
                  />

                  <aside
                    className={
                      "mobileOutlinerDrawer" + (mobileOutlinerOpen ? " is-open" : "")
                    }
                  >
                    <section className="panel mobileOutlinerPanel">
                      <div className="panel__title mobileOutlinerPanel__title">
                        <span>Outliner</span>
                        <button
                          className="btn btn--ghost"
                          type="button"
                          onClick={() => setMobileOutlinerOpen(false)}
                        >
                          Fermer
                        </button>
                      </div>

                      <Outliner
                        nodes={NODES}
                        sceneObjects={sceneObjects}
                        selectedId={selectedId}
                        selectedSceneObjectName={selectedSceneObjectName}
                        onSelect={handleSelectNode}
                        onSelectSceneObject={handleSelectSceneObject}
                        editorMode={effectiveEditorMode}
                      />
                    </section>
                  </aside>
                </>
              )}
            </div>
          </section>
        ) : (
          <>
            <aside className="dock left">
              {!runtimeUiMode && (
              <section className="panel">
                <div className="panel__title">Outliner</div>
                <Outliner
                  nodes={NODES}
                  sceneObjects={sceneObjects}
                  selectedId={selectedId}
                  selectedSceneObjectName={selectedSceneObjectName}
                  onSelect={handleSelectNode}
                  onSelectSceneObject={handleSelectSceneObject}
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
                  canOpenMedia={canOpenSelectedMedia}
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
                    {viewportContent}
                  </div>

                  {/* Slide 1 — Media */}
                  <div className="tab-slide">
                    {shouldRender(TAB_MEDIA) && (
                      <div className="tabContent">
                        {mediaContent}
                      </div>
                    )}
                  </div>

                  {/* Slide 2 — Demo */}
                  <div className="tab-slide">
                    {shouldRender(TAB_DEMO) && (
                      <div className="tabContent">
                        {demoContent}
                      </div>
                    )}
                  </div>

                  {/* Slide 3 — Contact */}
                  <div className="tab-slide">
                    {shouldRender(TAB_CONTACT) && (
                      <div className="tabContent">
                        {contactContent}
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
                    onSelect={handleSelectNode}
                    onBack={handleGoBack}
                    onForward={handleGoForward}
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
          </>
        )}
      </div>

      <ShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      {!isMobileLayout && (
        <footer className="statusbar">
          <span>{statusMessage}</span>
          <span className="sep">•</span>
          <span>Static React build</span>
          <span className="sep">•</span>
          <span>Layout: {runtimeLayout.toUpperCase()}</span>
        </footer>
      )}
    </div>
  );
}
