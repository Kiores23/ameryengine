function disposeTexture(value, disposedTextures) {
  if (!value) return;

  if (Array.isArray(value)) {
    value.forEach((entry) => disposeTexture(entry, disposedTextures));
    return;
  }

  if (value.isTexture && !disposedTextures.has(value)) {
    value.dispose();
    disposedTextures.add(value);
  }
}

function disposeMaterial(material, disposedTextures, disposeTextures = true) {
  if (!material) return;

  if (disposeTextures) {
    for (const value of Object.values(material)) {
      disposeTexture(value, disposedTextures);
    }

    for (const uniform of Object.values(material.uniforms ?? {})) {
      disposeTexture(uniform?.value ?? uniform, disposedTextures);
    }
  }

  material.dispose?.();
}

export function disposeObject3D(obj) {
  if (!obj) return;

  const mixer = obj.userData?.animationMixer;
  if (mixer) {
    mixer.stopAllAction();
    mixer.uncacheRoot(obj);
  }

  const usesSharedStaticAssets = !!obj.userData?.usesSharedStaticAssets;
  const disposedGeometries = new Set();
  const disposedMaterials = new Set();
  const disposedTextures = new Set();

  obj.traverse?.((child) => {
    child.shadow?.dispose?.();

    const ownsGeometry = !usesSharedStaticAssets || child.userData?.isCollisionProxy;
    const ownsMaterials =
      ownsGeometry || child.userData?.hasUniqueMaterialInstance;
    const disposeTexturesForChild = ownsGeometry;

    if (!ownsGeometry && !ownsMaterials) return;

    if (ownsGeometry) {
      child.skeleton?.dispose?.();
    }

    if (ownsGeometry && child.geometry && !disposedGeometries.has(child.geometry)) {
      child.geometry.dispose();
      disposedGeometries.add(child.geometry);
    }

    if (!ownsMaterials) return;

    if (Array.isArray(child.material)) {
      child.material.forEach((mat) => {
        if (!mat || disposedMaterials.has(mat)) return;
        disposeMaterial(mat, disposedTextures, disposeTexturesForChild);
        disposedMaterials.add(mat);
      });
    } else if (child.material && !disposedMaterials.has(child.material)) {
      disposeMaterial(child.material, disposedTextures, disposeTexturesForChild);
      disposedMaterials.add(child.material);
    }
  });

  if (obj.userData) {
    delete obj.userData.animationMixer;
    delete obj.userData.animationActions;
    delete obj.userData.animationClips;
    delete obj.userData.defaultAnimation;
  }
}

export function disposeSceneChildren(scene) {
  for (const child of [...(scene?.children ?? [])]) {
    scene.remove(child);
    disposeObject3D(child);
  }
}

export function clearObjectEmissiveCache(state, obj) {
  obj.traverse?.((child) => {
    state.originalEmissive.delete(child.uuid);
    for (const key of state.originalEmissive.keys()) {
      if (key.startsWith(`${child.uuid}:`)) {
        state.originalEmissive.delete(key);
      }
    }
  });
}
