import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_SCENE_URL } from "../constants/appConstants";

const MAX_UNDO = 30;

function safeClone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function cloneTransform(t = {}) {
  return {
    position: { ...(t.position ?? {}) },
    rotation: { ...(t.rotation ?? {}) },
    scale: { ...(t.scale ?? {}) },
  };
}

function getUndoActionKey(action) {
  if (!action) return "";

  const name = action.name ?? action.descriptor?.name ?? "";
  return `${action.type}:${name}`;
}

function getUndoActionPayload(action) {
  if (!action) return null;
  return action.old ?? action.descriptor ?? action.name ?? null;
}

function isDuplicateUndoAction(a, b) {
  if (!a || !b) return false;
  if (getUndoActionKey(a) !== getUndoActionKey(b)) return false;

  return JSON.stringify(getUndoActionPayload(a)) === JSON.stringify(getUndoActionPayload(b));
}

function sameNumber(a, b) {
  return Math.abs(Number(a) - Number(b)) <= 1e-6;
}

function sameVec3(a = {}, b = {}) {
  return sameNumber(a.x, b.x) && sameNumber(a.y, b.y) && sameNumber(a.z, b.z);
}

function sameTransform(a, b) {
  if (!a || !b) return false;

  return (
    sameVec3(a.position, b.position) &&
    sameVec3(a.rotation, b.rotation) &&
    sameVec3(a.scale, b.scale)
  );
}

export function useSceneEditor({
  setActiveTab,
  setRightTab,
  setHealthMessage,
}) {
  const viewportApiRef = useRef(null);
  const transformsRef = useRef({});
  const undoStackRef = useRef([]);
  const pendingTransformUndoRef = useRef(null);
  const pendingTransformsRef = useRef(new Map());
  const transformFrameRef = useRef(0);

  const [sceneUrl, setSceneUrl] = useState(DEFAULT_SCENE_URL);
  const [sceneFile, setSceneFile] = useState(null);
  const [sceneObjects, setSceneObjects] = useState([]);
  const [sceneReloadToken, setSceneReloadToken] = useState(0);

  const [selectedSceneObjectName, setSelectedSceneObjectName] = useState(null);
  const [clipboardObject, setClipboardObject] = useState(null);

  const selectedSceneObject = useMemo(() => {
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
  }, [selectedSceneObjectName, sceneObjects]);

  const cancelPendingTransformFlush = useCallback(() => {
    if (!transformFrameRef.current) return;

    cancelAnimationFrame(transformFrameRef.current);
    transformFrameRef.current = 0;
  }, []);

  const flushQueuedSceneTransforms = useCallback(() => {
    transformFrameRef.current = 0;

    if (pendingTransformsRef.current.size === 0) return;

    const pending = pendingTransformsRef.current;
    pendingTransformsRef.current = new Map();

    setSceneObjects((prev) => {
      let changed = false;

      const next = prev.map((obj) => {
        const transform = pending.get(obj.name);
        if (!transform) return obj;

        changed = true;
        return {
          ...obj,
          transform,
        };
      });

      return changed ? next : prev;
    });
  }, []);

  const queueSceneTransform = useCallback((t) => {
    if (!t?.name) return;

    pendingTransformsRef.current.set(t.name, cloneTransform(t));

    if (!transformFrameRef.current) {
      transformFrameRef.current = requestAnimationFrame(flushQueuedSceneTransforms);
    }
  }, [flushQueuedSceneTransforms]);

  const saveTransform = useCallback((t) => {
    if (!t?.name) return;

    transformsRef.current[t.name] = cloneTransform(t);
  }, []);

  const clearSceneEditCaches = useCallback(() => {
    undoStackRef.current = [];
    pendingTransformUndoRef.current = null;
    transformsRef.current = {};
    pendingTransformsRef.current.clear();
    cancelPendingTransformFlush();
  }, [cancelPendingTransformFlush]);

  useEffect(() => {
    return () => {
      cancelPendingTransformFlush();
    };
  }, [cancelPendingTransformFlush]);

  const pushUndo = useCallback((action) => {
    if (!action) return false;

    const entry = safeClone(action);
    const stack = undoStackRef.current;
    const previous = stack[stack.length - 1];

    if (isDuplicateUndoAction(previous, entry)) {
      return false;
    }

    const next = stack.slice(Math.max(0, stack.length - MAX_UNDO + 1));
    next.push(entry);
    undoStackRef.current = next;
    return true;
  }, []);

  const upsertLocalSceneObject = useCallback((descriptor) => {
    if (!descriptor?.name) return;

    const entry = safeClone(descriptor);
    setSceneObjects((prev) => {
      const index = prev.findIndex((obj) => obj.name === entry.name);
      if (index < 0) return [...prev, entry];

      const next = prev.slice();
      next[index] = entry;
      return next;
    });
  }, []);

  const removeLocalSceneObject = useCallback((name) => {
    if (!name) return;

    delete transformsRef.current[name];
    pendingTransformsRef.current.delete(name);
    if (pendingTransformUndoRef.current?.name === name) {
      pendingTransformUndoRef.current = null;
    }

    setSceneObjects((prev) => {
      if (!prev.some((obj) => obj.name === name)) return prev;
      return prev.filter((obj) => obj.name !== name);
    });
  }, []);

  const syncLocalDescriptorFromViewport = useCallback((api, name) => {
    const descriptor = api?.getObjectDescriptorByName?.(name);
    if (descriptor) {
      upsertLocalSceneObject(descriptor);
    }
  }, [upsertLocalSceneObject]);

  const syncLocalTransformFromViewport = useCallback((api, name) => {
    const t = api?.getTransformOfName?.(name);
    if (!t) return;

    const snapshot = { name, ...t };
    saveTransform(snapshot);
    queueSceneTransform(snapshot);
  }, [queueSceneTransform, saveTransform]);

  const refreshSceneObjectsFromViewport = useCallback(() => {
    const api = viewportApiRef.current;
    if (!api?.saveScene) return;

    const snapshot = api.saveScene();
    setSceneObjects(snapshot?.objects || []);
  }, []);

  const importSceneFile = useCallback((file) => {
    if (!file) return;

    clearSceneEditCaches();
    setSceneFile(file);
    setSelectedSceneObjectName(null);
    setSceneReloadToken((v) => v + 1);
    setHealthMessage(`Scene imported: ${file.name}`);
  }, [clearSceneEditCaches, setHealthMessage]);

  const loadSceneFromUrl = useCallback((url) => {
    if (!url) return;

    clearSceneEditCaches();
    setSceneFile(null);
    setSceneUrl(url);
    setSelectedSceneObjectName(null);
    setSceneReloadToken((v) => v + 1);
    setHealthMessage(`Scene loaded: ${url}`);
  }, [clearSceneEditCaches, setHealthMessage]);

  const exportCurrentScene = useCallback(() => {
    const api = viewportApiRef.current;
    if (!api?.exportSceneToFile) return;

    api.exportSceneToFile("scene.scene.json");
    setHealthMessage("Scene exported");
  }, [setHealthMessage]);

  const copySelectedSceneObject = useCallback(() => {
    const api = viewportApiRef.current;
    if (!api?.getObjectDescriptorByName) return false;
    if (!selectedSceneObjectName) return false;

    const desc = api.getObjectDescriptorByName(selectedSceneObjectName);
    if (!desc) return false;

    setClipboardObject(safeClone(desc));
    setHealthMessage(`Copied: ${desc.name}`);
    return true;
  }, [selectedSceneObjectName, setHealthMessage]);

  const pasteSceneObject = useCallback(async () => {
    const api = viewportApiRef.current;
    if (!api?.addObject || !clipboardObject) return false;

    const clone = safeClone(clipboardObject);

    clone.transform = clone.transform || {};
    clone.transform.position = clone.transform.position || { x: 0, y: 0, z: 0 };
    clone.transform.position.x += 0.5;
    clone.transform.position.z += 0.5;

    try {
      const createdObject = await api.addObject(clone);
      const createdName = createdObject?.name || clone.model || "object";

      pushUndo({ type: "add", name: createdName });
      syncLocalDescriptorFromViewport(api, createdName);

      setSelectedSceneObjectName(createdName);
      setRightTab("edit");
      setActiveTab("viewport");
      setHealthMessage(`Pasted: ${createdName}`);
      return true;
    } catch (err) {
      console.error("[useSceneEditor] paste failed:", err);
      setHealthMessage("Paste failed");
      return false;
    }
  }, [
    clipboardObject,
    pushUndo,
    setActiveTab,
    setHealthMessage,
    setRightTab,
    syncLocalDescriptorFromViewport,
  ]);

  const deleteSelectedSceneObject = useCallback(() => {
    const api = viewportApiRef.current;
    if (!api?.removeObjectByName) return false;
    if (!selectedSceneObjectName) return false;

    const descriptor = api.getObjectDescriptorByName?.(selectedSceneObjectName);
    const ok = api.removeObjectByName(selectedSceneObjectName);
    if (!ok) return false;

    if (descriptor) {
      pushUndo({ type: "remove", descriptor });
    }

    removeLocalSceneObject(selectedSceneObjectName);
    setSelectedSceneObjectName(null);
    setHealthMessage("Object deleted");
    return true;
  }, [
    pushUndo,
    removeLocalSceneObject,
    selectedSceneObjectName,
    setHealthMessage,
  ]);

  const undoLastSceneAction = useCallback(async () => {
    const api = viewportApiRef.current;
    if (!api) return false;

    const stack = undoStackRef.current;
    if (!stack.length) return false;

    const action = stack[stack.length - 1];
    undoStackRef.current = stack.slice(0, -1);

    try {
      switch (action.type) {
        case "transform":
          api.setPositionOfName(action.name, action.old.position);
          api.setRotationOfName(action.name, action.old.rotation);
          api.setScaleOfName(action.name, action.old.scale);
          syncLocalTransformFromViewport(api, action.name);
          break;

        case "add":
          api.removeObjectByName(action.name);
          removeLocalSceneObject(action.name);
          setSelectedSceneObjectName((prev) => prev === action.name ? null : prev);
          break;

        case "remove":
          {
            const restoredObject = await api.addObject(action.descriptor);
            const restoredName =
              restoredObject?.name ?? action.descriptor?.model ?? action.descriptor?.name ?? null;
            syncLocalDescriptorFromViewport(api, restoredName);
            setSelectedSceneObjectName(restoredName);
          }
          break;

        case "position":
          api.setPositionOfName(action.name, action.old);
          syncLocalTransformFromViewport(api, action.name);
          break;

        case "rotation":
          api.setRotationOfName(action.name, action.old);
          syncLocalTransformFromViewport(api, action.name);
          break;

        case "scale":
          api.setScaleOfName(action.name, action.old);
          syncLocalTransformFromViewport(api, action.name);
          break;

        case "color":
          api.setColorOfName(action.name, action.old);
          syncLocalDescriptorFromViewport(api, action.name);
          break;

        case "intensity":
          api.setIntensityOfName(action.name, action.old);
          syncLocalDescriptorFromViewport(api, action.name);
          break;

        case "distance":
          api.setDistanceOfName(action.name, action.old);
          syncLocalDescriptorFromViewport(api, action.name);
          break;

        case "liteAlwaysRender":
          api.setLiteAlwaysRenderOfName?.(action.name, action.old === true);
          syncLocalDescriptorFromViewport(api, action.name);
          break;

        default:
          console.warn("[useSceneEditor] Unknown undo action:", action.type);
          return false;
      }

      setHealthMessage("Undo");
      return true;
    } catch (err) {
      console.error("[useSceneEditor] undo failed:", err);
      setHealthMessage("Undo failed");
      return false;
    }
  }, [
    removeLocalSceneObject,
    setHealthMessage,
    syncLocalDescriptorFromViewport,
    syncLocalTransformFromViewport,
  ]);

  const bindViewportApi = useCallback((api, initialTarget) => {
    viewportApiRef.current = api;
    if (!api) return;

    api.setRunning(true);

    api.onTransformStart?.((targetName) => {
      const t = api.getTransformOfName?.(targetName);
      pendingTransformUndoRef.current = t
        ? { name: targetName, old: safeClone(t) }
        : null;
    });

    api.onTransformEnd?.(() => {
      pendingTransformUndoRef.current = null;
    });

    api.onTransformChange?.((t) => {
      const pendingUndo = pendingTransformUndoRef.current;
      if (
        pendingUndo?.name === t.name &&
        !sameTransform(pendingUndo.old, t)
      ) {
        pushUndo({ type: "transform", name: pendingUndo.name, old: pendingUndo.old });
        pendingTransformUndoRef.current = null;
      }

      saveTransform(t);
      queueSceneTransform(t);
    });

    const snapshot = api.saveScene?.();
    setSceneObjects(snapshot?.objects || []);

    for (const [name, tr] of Object.entries(transformsRef.current)) {
      api.setPositionOfName?.(name, tr.position);
      api.setRotationOfName?.(name, tr.rotation);
      api.setScaleOfName?.(name, tr.scale);
    }

    if (initialTarget) {
      api.highlightName?.(initialTarget);

      requestAnimationFrame(() => {
        api.focusOnName?.(initialTarget);
      });
    }
  }, [pushUndo, queueSceneTransform, saveTransform]);

  return {
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
    loadSceneFromUrl,
    exportCurrentScene,
    refreshSceneObjectsFromViewport,
    copySelectedSceneObject,
    pasteSceneObject,
    deleteSelectedSceneObject,
    undoLastSceneAction,
    pushUndo,
    bindViewportApi,
  };
}
