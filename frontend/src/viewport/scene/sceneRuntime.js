import * as THREE from "three";
import { createDefaultModel, warmModelCache } from "./modelRegistry";
import { MAX_SHADOW_LIGHTS } from "./modelRegistry/lights/index.js";
import { disposeObject3D } from "../engine/objectDisposal";

const OBJECT_LOAD_CONCURRENCY = 8;
const PRELOAD_CONCURRENCY = 4;

function degToRad(v) {
  return THREE.MathUtils.degToRad(Number(v) || 0);
}

function radToDeg(v) {
  return THREE.MathUtils.radToDeg(v);
}

function applyTransform(obj, transform = {}) {
  const pos = transform.position ?? {};
  const rot = transform.rotation ?? {};
  const scl = transform.scale ?? {};

  obj.position.set(
    Number(pos.x) || 0,
    Number(pos.y) || 0,
    Number(pos.z) || 0
  );

  obj.rotation.set(
    degToRad(rot.x),
    degToRad(rot.y),
    degToRad(rot.z)
  );

  obj.scale.set(
    Number(scl.x) || 1,
    Number(scl.y) || 1,
    Number(scl.z) || 1
  );
}

function normalizeObjectNameBase(modelName = "object") {
  return String(modelName).trim() || "object";
}

function hasObjectName(nameSource, name) {
  if (!nameSource || !name) return false;
  if (nameSource instanceof Map || nameSource instanceof Set) return nameSource.has(name);
  if (Array.isArray(nameSource)) return nameSource.includes(name);
  return false;
}

export function generateUniqueObjectNameFromModel(modelName, nameSource) {
  const baseName = normalizeObjectNameBase(modelName);

  if (!hasObjectName(nameSource, baseName)) {
    return baseName;
  }

  let index = 1;
  while (hasObjectName(nameSource, `${baseName}_${index}`)) {
    index += 1;
  }

  return `${baseName}_${index}`;
}

function mergeNestedObject(defaultValue, overrideValue) {
  if (!defaultValue && !overrideValue) return undefined;
  return {
    ...(defaultValue ?? {}),
    ...(overrideValue ?? {}),
  };
}

function mergeTransforms(defaultTransform, transform) {
  if (!defaultTransform && !transform) return undefined;

  return {
    ...(defaultTransform ?? {}),
    ...(transform ?? {}),
    position: mergeNestedObject(defaultTransform?.position, transform?.position),
    rotation: mergeNestedObject(defaultTransform?.rotation, transform?.rotation),
    scale: mergeNestedObject(defaultTransform?.scale, transform?.scale),
  };
}

function mergeDescriptorWithDefaults(defaults = {}, desc = {}) {
  return {
    ...defaults,
    ...desc,
    material: mergeNestedObject(defaults.material, desc.material),
    transform: mergeTransforms(defaults.transform, desc.transform),
    runtime: mergeNestedObject(defaults.runtime, desc.runtime),
    shadows: mergeNestedObject(defaults.shadows, desc.shadows),
  };
}

function copySceneOptions(desc) {
  const options = {};

  if (desc.runtime) {
    options.runtime = { ...desc.runtime };
  }

  if (desc.shadows) {
    options.shadows = { ...desc.shadows };
  }

  if (desc.visible === false) {
    options.visible = false;
  }

  return options;
}

function hasOwnKeys(value) {
  return !!value && Object.keys(value).length > 0;
}

function markObjectNonCollidable(obj) {
  obj.userData.excludeFromRuntimeCollisions = true;

  if (obj.userData.collisionProxy) {
    obj.userData.collisionProxy.userData.excludeFromRuntimeCollisions = true;
  }

  obj.traverse?.((child) => {
    if (!child.isMesh) return;
    child.userData.excludeFromRuntimeCollisions = true;
  });
}

function applyObjectShadowSettings(obj, shadowOptions = {}) {
  const options = shadowOptions ?? {};

  if (obj.isLight && obj.shadow && options.cast != null) {
    obj.castShadow = !!options.cast;
  }

  obj.traverse?.((child) => {
    if (!child.isMesh) return;
    if (child.userData.isCollisionProxy) return;

    if (child.userData.skipSceneShadows) {
      child.receiveShadow = false;
      child.castShadow = false;
      return;
    }

    child.receiveShadow = options.receive ?? true;
    child.castShadow = options.cast ?? true;
  });
}

function normalizeSceneObjects(sceneData) {
  const modelDefaults = sceneData?.modelDefaults ?? {};
  const assignedNames = new Set();

  return (sceneData?.objects ?? []).map((rawDesc) => {
    const desc = mergeDescriptorWithDefaults(modelDefaults?.[rawDesc?.model], rawDesc);
    const name = generateUniqueObjectNameFromModel(desc?.model, assignedNames);
    assignedNames.add(name);

    return {
      ...desc,
      name,
    };
  });
}

async function preloadRepeatedModels(objects, onProgress) {
  const modelCounts = new Map();
  for (const desc of objects) {
    const model = desc?.model;
    if (!model) continue;
    modelCounts.set(model, (modelCounts.get(model) ?? 0) + 1);
  }

  const repeatedModels = Array.from(modelCounts.entries())
    .filter(([, count]) => count > 1)
    .map(([model]) => model);

  if (repeatedModels.length === 0) return;

  let warmed = 0;
  onProgress?.({
    phase: `Priming shared models (${warmed}/${repeatedModels.length})`,
    loaded: 54,
    total: 100,
  });

  let nextIndex = 0;
  const workers = Array.from({
    length: Math.min(PRELOAD_CONCURRENCY, repeatedModels.length),
  }, async () => {
    while (nextIndex < repeatedModels.length) {
      const currentIndex = nextIndex++;
      const model = repeatedModels[currentIndex];

      try {
        await warmModelCache(model);
      } finally {
        warmed += 1;
        onProgress?.({
          phase: `Priming shared models (${warmed}/${repeatedModels.length})`,
          loaded: 54,
          total: 100,
        });
      }
    }
  });

  await Promise.all(workers);
}

export async function createObjectFromDescriptor(desc) {
  const mesh = await createDefaultModel(desc.model, desc.material, desc);

  mesh.name = desc.name || normalizeObjectNameBase(desc.model);
  mesh.userData.sceneModel = desc.model || "box";
  mesh.userData.sceneMaterial = { ...(desc.material ?? {}) };
  mesh.userData.sceneOptions = copySceneOptions(desc);

  applyTransform(mesh, desc.transform);

  if (desc.visible === false) {
    mesh.visible = false;
  }

  // Apply light-specific properties
  if (mesh.isLight) {
    if (desc.material?.color) mesh.color.set(desc.material.color);
    if (desc.material?.intensity != null) mesh.intensity = Number(desc.material.intensity);
    if (desc.material?.distance != null && mesh.distance !== undefined) mesh.distance = Number(desc.material.distance);
  }

  if (desc.runtime?.collidable === false) {
    markObjectNonCollidable(mesh);
  }

  applyObjectShadowSettings(mesh, desc.shadows);

  return mesh;
}

export async function addObjectToScene(scene, objectsByName, desc) {
  const namedDesc = {
    ...desc,
    name: generateUniqueObjectNameFromModel(desc?.model, objectsByName),
  };

  const obj = await createObjectFromDescriptor(namedDesc);
  scene.add(obj);
  objectsByName.set(obj.name, obj);
  if (obj.isLight) enforceShadowBudget(scene);
  return obj;
}

export function clearRuntimeObjects(scene, objectsByName) {
  for (const obj of objectsByName.values()) {
    scene.remove(obj);
    disposeObject3D(obj);
  }

  objectsByName.clear();
}

export async function loadSceneFromData(scene, objectsByName, sceneData, onProgress) {
  clearRuntimeObjects(scene, objectsByName);
  const objects = normalizeSceneObjects(sceneData);
  const total = objects.length;
  let loaded = 0;
  const LOADING_START = 55;
  const LOADING_END = 92;

  function emitWeightedProgress(phase, currentLoaded) {
    if (total <= 0) {
      onProgress?.({ phase, loaded: 96, total: 100 });
      return;
    }

    const ratio = currentLoaded / total;
    const pct = Math.round(LOADING_START + ratio * (LOADING_END - LOADING_START));
    onProgress?.({ phase, loaded: pct, total: 100 });
  }

  await preloadRepeatedModels(objects, onProgress);
  emitWeightedProgress("Loading objects", 0);

  const results = new Array(total).fill(null);
  let nextIndex = 0;
  const workers = Array.from({
    length: Math.min(OBJECT_LOAD_CONCURRENCY, Math.max(total, 1)),
  }, async () => {
    while (nextIndex < total) {
      const currentIndex = nextIndex++;
      const desc = objects[currentIndex];

      try {
        results[currentIndex] = await createObjectFromDescriptor(desc);
        loaded += 1;
        emitWeightedProgress(`Loaded "${desc.name || desc.model}"`, loaded);
      } catch (err) {
        loaded += 1;
        console.error(`[scene] Failed to load object "${desc.name}":`, err);
        emitWeightedProgress(`Failed "${desc.name || desc.model}"`, loaded);
      }
    }
  });

  await Promise.all(workers);

  onProgress?.({ phase: "Building scene", loaded: 96, total: 100 });

  for (const obj of results) {
    if (!obj) continue;
    scene.add(obj);
    objectsByName.set(obj.name, obj);
  }

  enforceShadowBudget(scene);
  onProgress?.({ phase: "Ready", loaded: 100, total: 100 });
}

/**
 * Only the N closest shadow-capable lights keep castShadow=true.
 * The rest still emit light but skip shadow map rendering.
 */
export function enforceShadowBudget(scene) {
  const shadowLights = [];
  scene.traverse((child) => {
    if (child.isLight && child.shadow && child.castShadow) {
      shadowLights.push(child);
    }
  });

  if (shadowLights.length <= MAX_SHADOW_LIGHTS) return;

  // Keep the first N lights with castShadow, disable the rest
  for (let i = MAX_SHADOW_LIGHTS; i < shadowLights.length; i++) {
    shadowLights[i].castShadow = false;
  }
}

export function serializeScene(objectsByName) {
  const objects = Array.from(objectsByName.values()).map((obj) => {
    const sceneOptions = obj.userData.sceneOptions ?? {};
    const entry = {
      name: obj.name,
      model: obj.userData.sceneModel ?? "box",
      material: {
        ...(obj.userData.sceneMaterial ?? {}),
      },
      transform: {
        position: {
          x: obj.position.x,
          y: obj.position.y,
          z: obj.position.z,
        },
        rotation: {
          x: radToDeg(obj.rotation.x),
          y: radToDeg(obj.rotation.y),
          z: radToDeg(obj.rotation.z),
        },
        scale: {
          x: obj.scale.x,
          y: obj.scale.y,
          z: obj.scale.z,
        },
      },
    };

    if (hasOwnKeys(sceneOptions.runtime)) {
      entry.runtime = { ...sceneOptions.runtime };
    }

    if (hasOwnKeys(sceneOptions.shadows)) {
      entry.shadows = { ...sceneOptions.shadows };
    }

    if (sceneOptions.visible === false) {
      entry.visible = false;
    }

    if (obj.isLight) {
      entry.material.intensity = obj.intensity;
      if (obj.distance !== undefined) entry.material.distance = obj.distance;
      entry.material.color = "#" + obj.color.getHexString();
    } else {
      entry.material.color = obj.material?.color
        ? `#${obj.material.color.getHexString()}`
        : "#ffffff";
      entry.material.roughness = obj.material?.roughness ?? 0.4;
      entry.material.metalness = obj.material?.metalness ?? 0.1;
    }

    return entry;
  });

  return {
    version: 1,
    objects,
  };
}
