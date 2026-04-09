import * as THREE from "three";
import { CAP_HEIGHT } from "../constants.js";
import {
  SKILL_AI_MAX_PUSH_STEP,
  SKILL_AI_PUSH_CONTACT_RADIUS,
  SKILL_AI_PUSH_STRENGTH,
} from "./constants.js";

const _aiBox = new THREE.Box3();
const _forwardDirection = new THREE.Vector3();
const _playerDelta = new THREE.Vector3();
const _aiContactPoint = new THREE.Vector3();

export function getPlayerProbePosition(player, out) {
  out.copy(player.position);
  out.y += CAP_HEIGHT * player.scale.y * 0.5;
  return out;
}

export function tryPushPlayer(ai, player, pushPlayer, dt) {
  if (!player || typeof pushPlayer !== "function") {
    return false;
  }

  _aiBox.setFromObject(ai);
  const playerFeetY = player.position.y;
  const playerHeadY = player.position.y + CAP_HEIGHT * player.scale.y;

  if (playerHeadY < _aiBox.min.y || playerFeetY > _aiBox.max.y) {
    return false;
  }

  _aiContactPoint.set(
    THREE.MathUtils.clamp(player.position.x, _aiBox.min.x, _aiBox.max.x),
    0,
    THREE.MathUtils.clamp(player.position.z, _aiBox.min.z, _aiBox.max.z),
  );

  _playerDelta.set(
    player.position.x - _aiContactPoint.x,
    0,
    player.position.z - _aiContactPoint.z,
  );
  const distanceSq = _playerDelta.x * _playerDelta.x + _playerDelta.z * _playerDelta.z;

  if (distanceSq >= SKILL_AI_PUSH_CONTACT_RADIUS * SKILL_AI_PUSH_CONTACT_RADIUS) {
    return false;
  }

  let pushX = _playerDelta.x;
  let pushZ = _playerDelta.z;
  let horizontalLength = Math.hypot(pushX, pushZ);

  if (horizontalLength <= 1e-5) {
    _forwardDirection.set(0, 0, 1).applyEuler(ai.rotation).normalize();
    pushX = _forwardDirection.x;
    pushZ = _forwardDirection.z;
    horizontalLength = Math.hypot(pushX, pushZ);
    if (horizontalLength <= 1e-5) return false;
  }

  pushX /= horizontalLength;
  pushZ /= horizontalLength;

  const overlap = Math.max(0, SKILL_AI_PUSH_CONTACT_RADIUS - Math.sqrt(distanceSq));
  const pushStep = Math.min(
    SKILL_AI_MAX_PUSH_STEP,
    overlap + SKILL_AI_PUSH_STRENGTH * dt,
  );

  return !!pushPlayer(pushX * pushStep, pushZ * pushStep);
}
