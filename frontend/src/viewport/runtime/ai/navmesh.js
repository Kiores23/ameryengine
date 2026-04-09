import * as THREE from "three";
import { SKILL_AI_NAVMESH_PADDING } from "./constants.js";

const _aiBox = new THREE.Box3();
const _aiSphere = new THREE.Sphere();
const _navScale = new THREE.Vector3();
const _localPoint = new THREE.Vector3();
const _localPadding = new THREE.Vector3();
const _clampedLocalPoint = new THREE.Vector3();
const _closestPoint = new THREE.Vector3();

function updateLocalPadding(navmesh, paddingWorld) {
  navmesh.getWorldScale(_navScale);
  _localPadding.set(
    Math.min(0.49, paddingWorld / Math.max(Math.abs(_navScale.x), 1e-3)),
    Math.min(0.49, paddingWorld / Math.max(Math.abs(_navScale.y), 1e-3)),
    Math.min(0.49, paddingWorld / Math.max(Math.abs(_navScale.z), 1e-3)),
  );
}

function getLocalAxisBounds(padding, axis) {
  const min = -0.5 + padding[axis];
  const max = 0.5 - padding[axis];

  if (min <= max) {
    return { min, max };
  }

  return { min: 0, max: 0 };
}

export function isPointInsideNavmesh(navmesh, worldPoint, paddingWorld = 0) {
  updateLocalPadding(navmesh, paddingWorld);
  _localPoint.copy(worldPoint);
  navmesh.worldToLocal(_localPoint);

  const xBounds = getLocalAxisBounds(_localPadding, "x");
  const yBounds = getLocalAxisBounds(_localPadding, "y");
  const zBounds = getLocalAxisBounds(_localPadding, "z");

  return (
    _localPoint.x >= xBounds.min &&
    _localPoint.x <= xBounds.max &&
    _localPoint.y >= yBounds.min &&
    _localPoint.y <= yBounds.max &&
    _localPoint.z >= zBounds.min &&
    _localPoint.z <= zBounds.max
  );
}

export function clampWorldPointToNavmesh(navmesh, worldPosition, paddingWorld, out) {
  updateLocalPadding(navmesh, paddingWorld);
  _localPoint.copy(worldPosition);
  navmesh.worldToLocal(_localPoint);

  const xBounds = getLocalAxisBounds(_localPadding, "x");
  const yBounds = getLocalAxisBounds(_localPadding, "y");
  const zBounds = getLocalAxisBounds(_localPadding, "z");

  _clampedLocalPoint.set(
    THREE.MathUtils.clamp(_localPoint.x, xBounds.min, xBounds.max),
    THREE.MathUtils.clamp(_localPoint.y, yBounds.min, yBounds.max),
    THREE.MathUtils.clamp(_localPoint.z, zBounds.min, zBounds.max),
  );

  out.copy(_clampedLocalPoint);
  return navmesh.localToWorld(out);
}

export function pickRandomPointInNavmesh(navmesh, paddingWorld, out) {
  updateLocalPadding(navmesh, paddingWorld);

  const xBounds = getLocalAxisBounds(_localPadding, "x");
  const yBounds = getLocalAxisBounds(_localPadding, "y");
  const zBounds = getLocalAxisBounds(_localPadding, "z");

  out.set(
    THREE.MathUtils.randFloat(xBounds.min, xBounds.max),
    THREE.MathUtils.randFloat(yBounds.min, yBounds.max),
    THREE.MathUtils.randFloat(zBounds.min, zBounds.max),
  );

  return navmesh.localToWorld(out);
}

export function getAiRadius(ai) {
  _aiBox.setFromObject(ai);
  _aiBox.getBoundingSphere(_aiSphere);
  return Math.max(SKILL_AI_NAVMESH_PADDING, _aiSphere.radius * 0.45);
}

export function findAssignedNavmesh(ai, navmeshes, padding) {
  let bestNavmesh = null;
  let bestDistanceSq = Infinity;

  for (const navmesh of navmeshes) {
    navmesh.updateMatrixWorld(true);

    if (isPointInsideNavmesh(navmesh, ai.position, padding)) {
      return navmesh;
    }

    clampWorldPointToNavmesh(navmesh, ai.position, padding, _closestPoint);
    const distanceSq = _closestPoint.distanceToSquared(ai.position);
    if (distanceSq < bestDistanceSq) {
      bestDistanceSq = distanceSq;
      bestNavmesh = navmesh;
    }
  }

  return bestNavmesh;
}
