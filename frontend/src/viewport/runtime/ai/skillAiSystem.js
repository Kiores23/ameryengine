import * as THREE from "three";
import {
  NAVMESH_MODEL,
  SKILL_AI_CHASE_HEIGHT_OFFSET,
  SKILL_AI_CORPS_MODEL,
  SKILL_AI_MAX_PITCH_DEG,
  SKILL_AI_MODEL,
  SKILL_AI_MOVE_SPEED,
  SKILL_AI_PLAYER_DETECTION_PADDING,
  SKILL_AI_TARGET_REACHED_DISTANCE,
  SKILL_AI_TURN_SPEED_DEG,
  SKILL_AI_WANDER_RETARGET_MAX,
  SKILL_AI_WANDER_RETARGET_MIN,
} from "./constants.js";
import {
  clampWorldPointToNavmesh,
  findAssignedNavmesh,
  getAiRadius,
  isPointInsideNavmesh,
  pickRandomPointInNavmesh,
} from "./navmesh.js";
import { followSkillAiChain, getSkillAiCorpsIndex } from "./followChain.js";
import { getPlayerProbePosition, tryPushPlayer } from "./playerInteraction.js";

const _worldPoint = new THREE.Vector3();
const _targetDirection = new THREE.Vector3();
const _forwardDirection = new THREE.Vector3();
const _nextPosition = new THREE.Vector3();
const _previousPosition = new THREE.Vector3();
const _playerProbe = new THREE.Vector3();

const TURN_SPEED_RAD = THREE.MathUtils.degToRad(SKILL_AI_TURN_SPEED_DEG);
const MAX_PITCH_RAD = THREE.MathUtils.degToRad(SKILL_AI_MAX_PITCH_DEG);

function wrapAngle(angle) {
  let value = angle;
  while (value > Math.PI) value -= Math.PI * 2;
  while (value < -Math.PI) value += Math.PI * 2;
  return value;
}

function getStateForAi(aiStates, ai) {
  let state = aiStates.get(ai);
  if (!state) {
    state = {
      mode: "wander",
      target: ai.position.clone(),
      retargetAt: 0,
    };
    aiStates.set(ai, state);
  }

  ai.rotation.order = "YXZ";
  return state;
}

function steerAiTowards(ai, worldTarget, dt) {
  _targetDirection.subVectors(worldTarget, ai.position);
  if (_targetDirection.lengthSq() <= 1e-8) {
    return false;
  }

  const previousYaw = ai.rotation.y;
  const previousPitch = ai.rotation.x;
  const desiredYaw = Math.atan2(_targetDirection.x, _targetDirection.z);
  const horizontalLength = Math.hypot(_targetDirection.x, _targetDirection.z);
  const desiredPitch = THREE.MathUtils.clamp(
    -Math.atan2(_targetDirection.y, Math.max(horizontalLength, 1e-5)),
    -MAX_PITCH_RAD,
    MAX_PITCH_RAD,
  );

  const maxTurnStep = TURN_SPEED_RAD * dt;
  const yawDiff = wrapAngle(desiredYaw - ai.rotation.y);
  const pitchDiff = desiredPitch - ai.rotation.x;

  ai.rotation.y += THREE.MathUtils.clamp(yawDiff, -maxTurnStep, maxTurnStep);
  ai.rotation.x = THREE.MathUtils.clamp(
    ai.rotation.x + THREE.MathUtils.clamp(pitchDiff, -maxTurnStep, maxTurnStep),
    -MAX_PITCH_RAD,
    MAX_PITCH_RAD,
  );

  return (
    Math.abs(ai.rotation.y - previousYaw) > 1e-8 ||
    Math.abs(ai.rotation.x - previousPitch) > 1e-8
  );
}

function moveAiInsideNavmesh(ai, navmesh, padding, dt) {
  _previousPosition.copy(ai.position);
  _forwardDirection.set(0, 0, 1).applyEuler(ai.rotation).normalize();
  _nextPosition.copy(ai.position).addScaledVector(_forwardDirection, SKILL_AI_MOVE_SPEED * dt);
  clampWorldPointToNavmesh(navmesh, _nextPosition, padding, _worldPoint);
  ai.position.copy(_worldPoint);

  return ai.position.distanceToSquared(_previousPosition) > 1e-8;
}

function ensureWanderTarget(state, navmesh, padding, now) {
  if (
    state.mode !== "wander" ||
    now >= state.retargetAt ||
    state.target.distanceToSquared(_worldPoint) <=
      SKILL_AI_TARGET_REACHED_DISTANCE * SKILL_AI_TARGET_REACHED_DISTANCE
  ) {
    state.mode = "wander";
    pickRandomPointInNavmesh(navmesh, padding, state.target);
    state.retargetAt = now + THREE.MathUtils.randFloat(
      SKILL_AI_WANDER_RETARGET_MIN,
      SKILL_AI_WANDER_RETARGET_MAX,
    );
  }
}

export function createSkillAiSystem() {
  const aiStates = new WeakMap();

  function update({
    objectsByName,
    dt,
    runtimeActive = false,
    player = null,
    pushPlayer = null,
  }) {
    if (!objectsByName || dt <= 0) {
      return { aiMoved: false, playerPushed: false };
    }

    const navmeshes = [];
    const ais = [];
    const corps = [];

    for (const obj of objectsByName.values()) {
      const model = obj.userData?.sceneModel;
      if (model === NAVMESH_MODEL || obj.userData?.isNavMesh) {
        navmeshes.push(obj);
      } else if (model === SKILL_AI_MODEL || obj.userData?.isSkillAi) {
        ais.push(obj);
      } else if (model === SKILL_AI_CORPS_MODEL || obj.userData?.isSkillAiCorps) {
        corps.push(obj);
      }
    }

    if (!navmeshes.length || !ais.length) {
      return { aiMoved: false, playerPushed: false };
    }

    let aiMoved = false;
    let playerPushed = false;
    const now = performance.now() / 1000;

    for (const ai of ais) {
      if (ai === player) continue;

      ai.updateMatrixWorld(true);

      const state = getStateForAi(aiStates, ai);
      const aiPadding = getAiRadius(ai);
      const navmesh = findAssignedNavmesh(ai, navmeshes, aiPadding);
      if (!navmesh) continue;

      clampWorldPointToNavmesh(navmesh, ai.position, aiPadding, _worldPoint);
      if (ai.position.distanceToSquared(_worldPoint) > 1e-8) {
        ai.position.copy(_worldPoint);
        aiMoved = true;
      }

      let hasChaseTarget = false;

      if (runtimeActive && player) {
        getPlayerProbePosition(player, _playerProbe);
        if (isPointInsideNavmesh(navmesh, _playerProbe, SKILL_AI_PLAYER_DETECTION_PADDING)) {
          _playerProbe.y += SKILL_AI_CHASE_HEIGHT_OFFSET;
          clampWorldPointToNavmesh(navmesh, _playerProbe, aiPadding, _worldPoint);
          state.target.copy(_worldPoint);
          state.mode = "chase";
          hasChaseTarget = true;
        }
      }

      if (!hasChaseTarget) {
        clampWorldPointToNavmesh(navmesh, ai.position, aiPadding, _worldPoint);
        ensureWanderTarget(state, navmesh, aiPadding, now);
      }

      if (steerAiTowards(ai, state.target, dt)) {
        aiMoved = true;
      }
      if (moveAiInsideNavmesh(ai, navmesh, aiPadding, dt)) {
        aiMoved = true;
      }

      if (runtimeActive && tryPushPlayer(ai, player, pushPlayer, dt)) {
        playerPushed = true;
      }
    }

    if (corps.length > 0) {
      const head =
        ais.find((obj) => obj.name === SKILL_AI_MODEL) ??
        ais[0] ??
        null;

      if (head) {
        corps.sort((a, b) => getSkillAiCorpsIndex(a.name) - getSkillAiCorpsIndex(b.name));

        let leader = head;
        for (const segment of corps) {
          if (followSkillAiChain(leader, segment)) {
            aiMoved = true;
          }
          leader = segment;
        }
      }
    }

    return { aiMoved, playerPushed };
  }

  return {
    update,
  };
}
