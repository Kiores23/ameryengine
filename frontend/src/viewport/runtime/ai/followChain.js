import * as THREE from "three";
import {
  SKILL_AI_CORPS_MIN_LINK_DISTANCE,
  SKILL_AI_CORPS_MODEL,
  SKILL_AI_MAX_PITCH_DEG,
} from "./constants.js";

const _aiBox = new THREE.Box3();
const _aiSphere = new THREE.Sphere();
const _previousPosition = new THREE.Vector3();
const _followOffset = new THREE.Vector3();
const _desiredFollowerPos = new THREE.Vector3();
const _targetDirection = new THREE.Vector3();

const MAX_PITCH_RAD = THREE.MathUtils.degToRad(SKILL_AI_MAX_PITCH_DEG);

function getObjectBoundingRadius(obj) {
  const baseRadius = obj?.userData?.boundingRadius;
  if (Number.isFinite(baseRadius) && baseRadius > 0) {
    return baseRadius * Math.max(
      Math.abs(obj.scale.x),
      Math.abs(obj.scale.y),
      Math.abs(obj.scale.z),
    );
  }

  _aiBox.setFromObject(obj);
  _aiBox.getBoundingSphere(_aiSphere);
  return _aiSphere.radius;
}

function getSkillAiCorpsLinkDistance(follower) {
  return Math.max(
    SKILL_AI_CORPS_MIN_LINK_DISTANCE,
    getObjectBoundingRadius(follower),
  );
}

export function getSkillAiCorpsIndex(name = "") {
  if (name === SKILL_AI_CORPS_MODEL) return 0;
  const match = new RegExp(`^${SKILL_AI_CORPS_MODEL}_(\\d+)$`).exec(name);
  return match ? Number(match[1]) : Number.POSITIVE_INFINITY;
}

export function followSkillAiChain(leader, follower) {
  if (!leader || !follower) return false;

  const previousPosition = _previousPosition.copy(follower.position);
  const previousYaw = follower.rotation.y;
  const previousPitch = follower.rotation.x;
  const linkDistance = getSkillAiCorpsLinkDistance(follower);

  _followOffset.subVectors(follower.position, leader.position);
  let distance = _followOffset.length();

  if (distance <= 1e-5) {
    _followOffset.set(0, 0, -1).applyEuler(leader.rotation);
    if (_followOffset.lengthSq() <= 1e-8) {
      _followOffset.set(0, 0, -1);
    }
    distance = 1;
  }

  _followOffset.divideScalar(distance);
  _desiredFollowerPos.copy(leader.position).addScaledVector(_followOffset, linkDistance);
  follower.position.copy(_desiredFollowerPos);

  _targetDirection.subVectors(leader.position, follower.position);
  if (_targetDirection.lengthSq() > 1e-8) {
    const desiredYaw = Math.atan2(_targetDirection.x, _targetDirection.z);
    const horizontalLength = Math.hypot(_targetDirection.x, _targetDirection.z);
    const desiredPitch = THREE.MathUtils.clamp(
      -Math.atan2(_targetDirection.y, Math.max(horizontalLength, 1e-5)),
      -MAX_PITCH_RAD,
      MAX_PITCH_RAD,
    );

    follower.rotation.order = "YXZ";
    follower.rotation.y = desiredYaw;
    follower.rotation.x = desiredPitch;
    follower.rotation.z = 0;
  }

  return (
    follower.position.distanceToSquared(previousPosition) > 1e-8 ||
    Math.abs(follower.rotation.y - previousYaw) > 1e-8 ||
    Math.abs(follower.rotation.x - previousPitch) > 1e-8
  );
}
