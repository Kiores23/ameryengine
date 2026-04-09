import { ensureObjectHasUniqueMaterials } from "./materialInstances";

function getEmissiveKey(child, index = null) {
  return index == null ? child.uuid : `${child.uuid}:${index}`;
}

export function restoreHighlightedObject(state) {
  if (!state.highlighted) return;

  state.highlighted.traverse?.((child) => {
    if (Array.isArray(child.material)) {
      child.material.forEach((mat, index) => {
        const prevHex = state.originalEmissive.get(getEmissiveKey(child, index));
        if (prevHex !== undefined && mat?.emissive) {
          mat.emissive.setHex(prevHex);
        }
      });
      return;
    }

    const prevHex = state.originalEmissive.get(getEmissiveKey(child));
    if (prevHex !== undefined && child.material?.emissive) {
      child.material.emissive.setHex(prevHex);
    }
  });
}

export function clearHighlight(state) {
  restoreHighlightedObject(state);
  state.highlighted = null;
  state.originalEmissive.clear();
}

export function highlightObject(state, obj) {
  if (!obj) return;

  restoreHighlightedObject(state);
  ensureObjectHasUniqueMaterials(obj);
  state.highlighted = obj;

  obj.traverse?.((child) => {
    if (Array.isArray(child.material)) {
      child.material.forEach((mat, index) => {
        if (!mat?.emissive) return;

        const key = getEmissiveKey(child, index);
        if (!state.originalEmissive.has(key)) {
          state.originalEmissive.set(key, mat.emissive.getHex());
        }

        mat.emissive.setHex(0xff4fd8);
      });
      return;
    }

    const mat = child.material;
    if (!mat?.emissive) return;

    const key = getEmissiveKey(child);
    if (!state.originalEmissive.has(key)) {
      state.originalEmissive.set(key, mat.emissive.getHex());
    }

    mat.emissive.setHex(0xff4fd8);
  });
}
