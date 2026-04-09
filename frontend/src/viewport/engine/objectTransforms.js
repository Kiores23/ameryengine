import * as THREE from "three";

export function vec3LikeToVec3(v, fallback = new THREE.Vector3()) {
  if (!v) return fallback.clone();

  const x = Number(v.x);
  const y = Number(v.y);
  const z = Number(v.z);

  return new THREE.Vector3(
    Number.isFinite(x) ? x : fallback.x,
    Number.isFinite(y) ? y : fallback.y,
    Number.isFinite(z) ? z : fallback.z
  );
}

export function getTransformSnapshot(obj) {
  if (!obj) return null;

  return {
    position: {
      x: obj.position.x,
      y: obj.position.y,
      z: obj.position.z,
    },
    rotation: {
      x: THREE.MathUtils.radToDeg(obj.rotation.x),
      y: THREE.MathUtils.radToDeg(obj.rotation.y),
      z: THREE.MathUtils.radToDeg(obj.rotation.z),
    },
    scale: {
      x: obj.scale.x,
      y: obj.scale.y,
      z: obj.scale.z,
    },
  };
}

export function emitTransform(state, name, obj) {
  if (!obj || !name) return;

  const listeners = state.transformChangeListeners;
  if (!state.onTransformChange && !listeners?.size) return;

  const snapshot = {
    name,
    ...getTransformSnapshot(obj),
  };

  state.onTransformChange?.(snapshot);

  for (const listener of listeners ?? []) {
    listener(snapshot);
  }
}

export function setObjectPosition(state, obj, name, pos) {
  if (!obj) return;

  obj.position.copy(vec3LikeToVec3(pos, obj.position));
  state.tControls?.updateMatrixWorld?.(true);
  emitTransform(state, name, obj);
}

export function setObjectRotation(state, obj, name, rotDeg) {
  if (!obj) return;

  const rx = Number(rotDeg?.x);
  const ry = Number(rotDeg?.y);
  const rz = Number(rotDeg?.z);

  if (Number.isFinite(rx)) obj.rotation.x = THREE.MathUtils.degToRad(rx);
  if (Number.isFinite(ry)) obj.rotation.y = THREE.MathUtils.degToRad(ry);
  if (Number.isFinite(rz)) obj.rotation.z = THREE.MathUtils.degToRad(rz);

  state.tControls?.updateMatrixWorld?.(true);
  emitTransform(state, name, obj);
}

export function setObjectScale(state, obj, name, scl) {
  if (!obj) return;

  const sx = Number(scl?.x);
  const sy = Number(scl?.y);
  const sz = Number(scl?.z);

  if (Number.isFinite(sx)) obj.scale.x = sx;
  if (Number.isFinite(sy)) obj.scale.y = sy;
  if (Number.isFinite(sz)) obj.scale.z = sz;

  state.tControls?.updateMatrixWorld?.(true);
  emitTransform(state, name, obj);
}
