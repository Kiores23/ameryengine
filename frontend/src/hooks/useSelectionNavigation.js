import { useMemo, useState } from "react";

function hasMedia(node) {
  return !!node && (
    (Array.isArray(node.videoUrls) && node.videoUrls.length > 0) ||
    (Array.isArray(node.imageNames) && node.imageNames.length > 0)
  );
}

async function focusViewportTarget(api, targetName, focus = true) {
  if (!api || !targetName) return;

  api.highlightName?.(targetName);

  if (!focus) return;

  try {
    const result = api.focusOnName?.(targetName);

    if (result && typeof result.then === "function") {
      await result;
    } else {
      await new Promise((resolve) => setTimeout(resolve, 650));
    }
  } catch {
    await new Promise((resolve) => setTimeout(resolve, 650));
  }
}

export function useSelectionNavigation({
  nodes,
  sceneObjects,
  viewportApiRef,
  rightTab,
  setRightTab,
  setActiveTab,
  setHealthMessage,
  setSelectedSceneObjectName,
}) {
  const [selectedId, setSelectedId] = useState(nodes[0]?.id || null);
  const [historyBack, setHistoryBack] = useState([]);
  const [historyForward, setHistoryForward] = useState([]);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedId) || null,
    [nodes, selectedId]
  );

  const selectedSceneObject = useMemo(() => {
    const selectedSceneObjectName = sceneObjects.find(
      (o) => o.__selected === true
    )?.name;

    if (!selectedSceneObjectName) return null;

    const obj = sceneObjects.find((o) => o.name === selectedSceneObjectName);
    if (!obj) return null;

    return {
      id: `scene:${obj.name}`,
      label: obj.name,
      target: obj.name,
      type: "scene-object",
      model: obj.model,
    };
  }, [sceneObjects]);

  const applySelectionSideEffects = async (node, { focus = true } = {}) => {
    if (!node) return;

    const api = viewportApiRef.current;
    const shouldAutoOpenMedia = focus && hasMedia(node) && node.autoOpenMedia === true;
    const isEditingPanelOpen = rightTab === "edit";

    await focusViewportTarget(api, node.target, focus);

    if (shouldAutoOpenMedia && !isEditingPanelOpen) {
      setRightTab("details");
      setTimeout(() => setActiveTab("media"), 1000);
    } else {
      setActiveTab("viewport");
    }

    setHealthMessage(`Selected: ${node.label}`);
  };

  const selectNode = (id, opts = {}) => {
    const { focus = true, trackHistory = true } = opts;

    setSelectedSceneObjectName(null);

    // Clear selection if id is null
    if (id === null) {
      if (trackHistory && selectedId != null) {
        setHistoryBack((prev) => [...prev, selectedId]);
        setHistoryForward([]);
      }
      setSelectedId(null);
      return;
    }

    const node = nodes.find((n) => n.id === id);
    if (!node) return;

    if (id === selectedId) {
      applySelectionSideEffects(node, { focus });
      return;
    }

    if (trackHistory && selectedId != null) {
      setHistoryBack((prev) => [...prev, selectedId]);
      setHistoryForward([]);
    }

    setSelectedId(id);
    applySelectionSideEffects(node, { focus });
  };

  const selectSceneObject = async (objectName, opts = {}) => {
    const { focus = false } = opts;

    if (!objectName) return;

    setHistoryForward([]);
    setSelectedSceneObjectName(objectName);
    setRightTab("edit");
    setActiveTab("viewport");
    setHealthMessage(`Editing scene object: ${objectName}`);

    const api = viewportApiRef.current;
    await focusViewportTarget(api, objectName, focus);
  };

  const goBack = () => {
    if (!historyBack.length) return;

    const previousId = historyBack[historyBack.length - 1];

    setHistoryBack((prev) => prev.slice(0, -1));

    if (selectedId != null) {
      setHistoryForward((prev) => [selectedId, ...prev]);
    }

    const previousNode = nodes.find((n) => n.id === previousId);
    setSelectedId(previousId);
    applySelectionSideEffects(previousNode, { focus: true });
  };

  const goForward = () => {
    if (!historyForward.length) return;

    const nextId = historyForward[0];

    setHistoryForward((prev) => prev.slice(1));

    if (selectedId != null) {
      setHistoryBack((prev) => [...prev, selectedId]);
    }

    const nextNode = nodes.find((n) => n.id === nextId);
    setSelectedId(nextId);
    applySelectionSideEffects(nextNode, { focus: true });
  };

  const resetHistory = () => {
    setHistoryBack([]);
    setHistoryForward([]);
  };

  return {
    selectedId,
    selectedNode,
    selectedSceneObject,
    historyBack,
    historyForward,
    selectNode,
    selectSceneObject,
    goBack,
    goForward,
    resetHistory,
  };
}