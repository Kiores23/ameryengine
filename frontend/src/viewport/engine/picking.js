import * as THREE from "three";

export function createRaycastPicker(state, dom, camera) {
  const raycaster = new THREE.Raycaster();

  return function pickNameAtClient(clientX, clientY) {
    if (state.transformDragging) return null;

    const rect = dom.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((clientY - rect.top) / rect.height) * 2 - 1);

    raycaster.setFromCamera({ x, y }, camera);

    const pickables = Array.from(state.objectsByName.values());
    const hits = raycaster.intersectObjects(pickables, true);
    if (!hits.length) return null;

    const knownNames = new Set(state.objectsByName.keys());
    let obj = hits[0].object;

    while (obj) {
      if (obj.name && knownNames.has(obj.name)) {
        return obj.name;
      }
      obj = obj.parent;
    }

    return hits[0].object?.name || null;
  };
}