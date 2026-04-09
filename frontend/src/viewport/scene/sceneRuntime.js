import * as THREE from "three";
import { createDefaultModel, clearModelRegistryCache } from "./modelRegistry";
import { MAX_SHADOW_LIGHTS } from "./modelRegistry/lights/index.js";
import { disposeObject3D } from "../engine/objectDisposal";

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

export async function createObjectFromDescriptor(desc) {
  const mesh = await createDefaultModel(desc.model, desc.material);

  mesh.name = desc.name || normalizeObjectNameBase(desc.model);
  mesh.userData.sceneModel = desc.model || "box";
  mesh.userData.sceneMaterial = { ...(desc.material ?? {}) };

  applyTransform(mesh, desc.transform);

  // Apply light-specific properties
  if (mesh.isLight) {
    if (desc.material?.color) mesh.color.set(desc.material.color);
    if (desc.material?.intensity != null) mesh.intensity = Number(desc.material.intensity);
    if (desc.material?.distance != null && mesh.distance !== undefined) mesh.distance = Number(desc.material.distance);
  }

  // Enable shadows on meshes selectively
  // Small meshes and collision proxies skip castShadow to save GPU
  mesh.traverse?.((child) => {
    if (!child.isMesh) return;
    if (child.userData.isCollisionProxy) return;
    if (child.userData.skipSceneShadows) {
      child.receiveShadow = false;
      child.castShadow = false;
      return;
    }
    child.receiveShadow = true;
    child.castShadow = true;
  });

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
  clearModelRegistryCache();

  const assignedNames = new Set();
  const objects = (sceneData?.objects ?? []).map((desc) => {
    const name = generateUniqueObjectNameFromModel(desc?.model, assignedNames);
    assignedNames.add(name);

    return {
      ...desc,
      name,
    };
  });
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

  emitWeightedProgress("Loading objects", 0);

  // Load all objects in parallel, reporting progress as each resolves
  const promises = objects.map((desc) =>
    createObjectFromDescriptor(desc)
      .then((obj) => {
        loaded++;
        emitWeightedProgress(`Loaded "${desc.name || desc.model}"`, loaded);
        return obj;
      })
      .catch((err) => {
        loaded++;
        console.error(`[scene] Failed to load object "${desc.name}":`, err);
        emitWeightedProgress(`Failed "${desc.name || desc.model}"`, loaded);
        return null;
      })
  );

  const results = await Promise.all(promises);

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
