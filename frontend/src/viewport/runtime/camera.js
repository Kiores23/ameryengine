import * as THREE from "three";
import {
  CAM_ARM, CAM_PIVOT_H, CAM_SHOULDER, CAM_LERP, SKIN_WIDTH,
} from "./constants.js";

const _pivot      = new THREE.Vector3();
const _desiredCam = new THREE.Vector3();
const _lookAt     = new THREE.Vector3();
const _rayDir     = new THREE.Vector3();
const _armVec     = new THREE.Vector3();
const _finalPos   = new THREE.Vector3();
const _hits       = [];

const RC = new THREE.Raycaster();
RC.firstHitOnly = true;

/**
 * Update the third-person camera position around the character.
 * Clips the arm against geometry so the camera never enters a mesh.
 *
 * @param {THREE.Camera} camera
 * @param {object}       orient       – `{ yaw, pitch }` (radians)
 * @param {THREE.Object3D} character
 * @param {THREE.Mesh[]} collidables  – pre-filtered collidable meshes
 * @param {boolean}      snap         – instant reposition instead of lerp
 */
export function updateCamera(camera, orient, character, collidables, snap = false) {
  const { yaw, pitch } = orient;

  const scaleFactor = Math.max(character.scale.y, character.scale.x);

  _pivot.set(
    character.position.x,
    character.position.y + CAM_PIVOT_H * scaleFactor,
    character.position.z
  );

  const arm      = CAM_ARM * scaleFactor;
  const shoulder = CAM_SHOULDER * scaleFactor;

  const cp = Math.cos(pitch);
  const sp = Math.sin(pitch);
  const cy = Math.cos(yaw);
  const sy = Math.sin(yaw);

  _desiredCam.set(
    _pivot.x + sy * arm * cp + cy * shoulder,
    _pivot.y + sp * arm,
    _pivot.z + cy * arm * cp - sy * shoulder
  );

  _lookAt.copy(_pivot);
  _lookAt.y += 0.2;

  // Clip arm against scene geometry
  _armVec.subVectors(_desiredCam, _pivot);
  const armLen = _armVec.length();
  _rayDir.copy(_armVec).divideScalar(armLen);

  RC.set(_pivot, _rayDir);
  RC.far = armLen;
  _hits.length = 0;
  RC.intersectObjects(collidables, false, _hits);

  let finalDist = armLen;
  if (_hits.length > 0) {
    finalDist = Math.max(0.5, _hits[0].distance - SKIN_WIDTH * 4);
  }

  _finalPos.copy(_pivot).addScaledVector(_rayDir, finalDist);

  if (snap) {
    camera.position.copy(_finalPos);
  } else {
    camera.position.lerp(_finalPos, CAM_LERP);
  }
  camera.lookAt(_lookAt);
}
