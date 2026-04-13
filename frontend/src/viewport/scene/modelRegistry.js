import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { createBasicShape } from "./modelRegistry/basicShapes/index.js";
import { createAiHelperModel, configureAiModel } from "./modelRegistry/ai/index.js";
import { createLight } from "./modelRegistry/lights/index.js";
import { disposeObject3D } from "../engine/objectDisposal";
import { resolvePublicPath } from "../../utils/publicPath";

const loader = new GLTFLoader();
let ktx2Loader = null;

loader.setMeshoptDecoder(MeshoptDecoder);

export function initModelRegistryLoader(renderer) {
  if (!renderer || ktx2Loader) return;

  ktx2Loader = new KTX2Loader();
  ktx2Loader.setTranscoderPath(resolvePublicPath("basis/"));
  ktx2Loader.detectSupport(renderer);
  loader.setKTX2Loader(ktx2Loader);
}

// Cache parsed GLTF for static models (no animations).
// Animated models (SkinnedMesh) must be re-parsed each time.
const _staticCache = new Map();   // path → gltf
const _hasAnimations = new Set(); // paths known to have animations
const _missingPaths = new Set();

export function clearModelRegistryCache() {
  for (const gltf of _staticCache.values()) {
    disposeObject3D(gltf?.scene);
  }

  _staticCache.clear();
  _hasAnimations.clear();
  _missingPaths.clear();
}

function computeLocalBounds(object) {
  const box = new THREE.Box3().setFromObject(object);
  if (box.isEmpty()) return null;

  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  return {
    center,
    size,
    radius: size.length() * 0.5,
  };
}

function cloneLocalBounds(bounds) {
  if (!bounds) return null;
  return {
    center: bounds.center.clone(),
    size: bounds.size.clone(),
    radius: bounds.radius,
  };
}

function applyLocalBoundsMetadata(object, bounds) {
  if (!bounds) return;

  object.userData.localBounds = cloneLocalBounds(bounds);
  object.userData.boundingRadius = bounds.radius;
}

async function tryLoadFirst(paths) {
  for (const path of paths) {
    if (_missingPaths.has(path)) continue;

    try {
      // Serve from static cache if this model was previously parsed as static
      if (_staticCache.has(path)) return _staticCache.get(path);
      // Known animated model → always re-parse from network cache (browser handles it)
      if (_hasAnimations.has(path)) return await loader.loadAsync(path);

      const gltf = await loader.loadAsync(path);

      // Decide cacheability: animated models can't be shared (SkinnedMesh bindings)
      let animated = (gltf.animations?.length ?? 0) > 0;
      if (!animated) {
        gltf.scene.traverse((c) => { if (c.isSkinnedMesh) animated = true; });
      }

      if (animated) {
        _hasAnimations.add(path);
      } else {
        const cached = _staticCache.get(path);
        if (cached) {
          // Another parallel load won the race; keep one shared source only.
          disposeObject3D(gltf.scene);
          return cached;
        }

        applyLocalBoundsMetadata(gltf.scene, computeLocalBounds(gltf.scene));
        _staticCache.set(path, gltf);
      }
      return gltf;
    } catch {
      _missingPaths.add(path);
    }
  }
  return null;
}

function getModelPaths(model) {
  return [
    resolvePublicPath(`models/${model}.glb`),
    resolvePublicPath(`models/${model}.gltf`),
  ];
}

function getAnimationPaths(model) {
  return [
    resolvePublicPath(`models/${model}_Animations.glb`),
    resolvePublicPath(`models/${model}_Animations.gltf`),
  ];
}

function findIdleClip(clips) {
  if (!clips?.length) return null;

  const exact = clips.find((clip) => clip.name.toLowerCase() === "idle");
  if (exact) return exact;

  const containsIdle = clips.find((clip) =>
    clip.name.toLowerCase().includes("idle")
  );
  if (containsIdle) return containsIdle;

  return clips[0] ?? null;
}

function createSceneMaterial(materialOptions = {}) {
  return new THREE.MeshStandardMaterial({
    color: materialOptions.color ?? 0xffffff,
    roughness: materialOptions.roughness ?? 0.4,
    metalness: materialOptions.metalness ?? 0.1,
  });
}

function shouldSkipCollisionProxy(options = {}) {
  return options?.runtime?.collidable === false;
}

export async function warmModelCache(model) {
  const light = createLight(model);
  if (light) return;

  const aiHelper = createAiHelperModel(model);
  if (aiHelper) {
    disposeObject3D(aiHelper);
    return;
  }

  const testMaterial = new THREE.MeshBasicMaterial();
  const primitive = createBasicShape(model, testMaterial);
  if (primitive) {
    primitive.geometry?.dispose?.();
    primitive.material?.dispose?.();
    return;
  }
  testMaterial.dispose();

  await Promise.all([
    tryLoadFirst(getModelPaths(model)),
    tryLoadFirst(getAnimationPaths(model)),
  ]);
}

export async function createDefaultModel(model, materialOptions = {}, options = {}) {
  // ---------- LIGHTS ----------
  const light = createLight(model);
  if (light) {
    return light;
  }

  // ---------- AI HELPERS ----------
  const aiHelper = createAiHelperModel(model, materialOptions);
  if (aiHelper) {
    return configureAiModel(aiHelper, model);
  }

  // ---------- PRIMITIVES ----------
  const mat = createSceneMaterial(materialOptions);
  const primitive = createBasicShape(model, mat);
  if (primitive) {
    return configureAiModel(primitive, model);
  }
  mat.dispose();

  // ---------- LOAD BASE MODEL + ANIM IN PARALLEL ----------
  const modelPaths = getModelPaths(model);
  const animationPaths = getAnimationPaths(model);

  const [modelGltf, animGltf] = await Promise.all([
    tryLoadFirst(modelPaths),
    tryLoadFirst(animationPaths),
  ]);

  if (!modelGltf) {
    console.warn(`Model "${model}" not found. Using default box.`);
    return configureAiModel(
      new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), createSceneMaterial(materialOptions)),
      model,
    );
  }

  const fromStaticCache = modelPaths.some((path) => _staticCache.has(path));
  const object = fromStaticCache ? modelGltf.scene.clone(true) : modelGltf.scene;
  if (fromStaticCache) {
    object.userData.usesSharedStaticAssets = true;
  }
  applyLocalBoundsMetadata(
    object,
    modelGltf.scene.userData?.localBounds ?? computeLocalBounds(object),
  );

  // ---------- FIX MATERIALS FOR IMPORTS ----------
  object.traverse((child) => {
    if (!child.isMesh) return;
    const mats = Array.isArray(child.material) ? child.material : [child.material];
    for (const m of mats) {
      if (m.metalness !== undefined && m.metalness > 0.4) {
        m.metalness = 0.4;
        m.needsUpdate = true;
      }
      if (m.roughness !== undefined && m.roughness < 0.25) {
        m.roughness = 0.25;
        m.needsUpdate = true;
      }
    }
  });

  // ---------- COLLISION PROXY (box collider) ----------
  // Use a simple invisible box instead of the raw mesh for collision.
  // This prevents complex geometry from causing erratic collisions.
  const localBounds = object.userData?.localBounds ?? null;
  if (!shouldSkipCollisionProxy(options) && localBounds) {
    const size = localBounds.size;
    const center = localBounds.center;
    const proxyGeo = new THREE.BoxGeometry(size.x, size.y, size.z);
    const proxyMat = new THREE.MeshBasicMaterial({ visible: false });
    const proxyMesh = new THREE.Mesh(proxyGeo, proxyMat);
    // Position the proxy so its center matches the model's bounding box center
    // in the object's local space
    proxyMesh.position.copy(center);
    proxyMesh.userData.isCollisionProxy = true;
    proxyMesh.frustumCulled = false;
    object.userData.collisionProxy = proxyMesh;
    object.add(proxyMesh);
  }

  // ---------- OPTIONAL ANIM (already loaded above) ----------

  const clips = [
    ...(modelGltf.animations ?? []),
    ...(animGltf?.animations ?? []),
  ];

  if (clips.length > 0) {
    const mixer = new THREE.AnimationMixer(object);
    const actions = {};

    for (const clip of clips) {
      actions[clip.name] = mixer.clipAction(clip);
    }

    const idleClip = findIdleClip(clips);
    if (idleClip) {
      const idleAction = mixer.clipAction(idleClip);
      idleAction.reset().play();

      object.userData.defaultAnimation = idleClip.name;
    }

    object.userData.animationMixer = mixer;
    object.userData.animationActions = actions;
    object.userData.animationClips = clips.map((clip) => clip.name);

    console.log(`\n🎬 Animations pour "${model}" :`);
    clips.forEach((clip, i) => {
      console.log(`${i} → "${clip.name}" (duration: ${clip.duration.toFixed(2)}s)`);
    });
  }

  return configureAiModel(object, model);
}
