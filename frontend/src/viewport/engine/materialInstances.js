function cloneMaterialInstance(material) {
  return material?.clone?.() ?? material;
}

export function ensureObjectHasUniqueMaterials(obj) {
  if (!obj?.userData?.usesSharedStaticAssets) return;

  obj.traverse?.((child) => {
    if (!child.isMesh) return;
    if (child.userData?.isCollisionProxy) return;
    if (child.userData?.hasUniqueMaterialInstance) return;
    if (!child.material) return;

    if (Array.isArray(child.material)) {
      child.material = child.material.map(cloneMaterialInstance);
    } else {
      child.material = cloneMaterialInstance(child.material);
    }

    child.userData.hasUniqueMaterialInstance = true;
  });
}
