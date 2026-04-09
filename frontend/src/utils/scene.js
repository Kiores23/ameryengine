export function deepClone(value) {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

export function buildUniqueObjectName(baseName, sceneObjects) {
  let i = 1;
  let newName = `${baseName}_copy`;

  while (sceneObjects.some((o) => o.name === newName)) {
    i += 1;
    newName = `${baseName}_copy_${i}`;
  }

  return newName;
}

export function offsetObjectPosition(object, offset = { x: 0.5, z: 0.5 }) {
  const clone = deepClone(object);

  clone.transform = clone.transform || {};
  clone.transform.position = clone.transform.position || { x: 0, y: 0, z: 0 };

  clone.transform.position.x += offset.x ?? 0;
  clone.transform.position.z += offset.z ?? 0;

  return clone;
}

export function nodeHasMedia(node) {
  return !!node && (
    (Array.isArray(node.videoUrls) && node.videoUrls.length > 0) ||
    (Array.isArray(node.imageNames) && node.imageNames.length > 0)
  );
}

export function toSceneEditedItem(selectedSceneObjectName, sceneObjects) {
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
}