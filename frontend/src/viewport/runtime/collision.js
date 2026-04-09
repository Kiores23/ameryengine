import * as THREE from "three";
import {
  GRAVITY,
  CAP_RADIUS, CAP_BOT_Y, CAP_TOP_Y, CAP_HEIGHT,
  STEP_UP, SKIN_WIDTH, FEET_OFFSET,
} from "./constants.js";

/**
 * Creates the collision sub-system.
 *
 * Call `buildCache(collidables)` once (e.g. at runtime start) to
 * cache the flattened mesh list used by the raycast sweeps.
 * Per-frame functions then use the cache — zero traversals, zero allocations.
 *
 * Call `clearCache()` when the runtime stops.
 */
export function createCollisionSystem() {
  const RC = new THREE.Raycaster();
  RC.firstHitOnly = false;

  // Pre-allocated vectors (never leave this module)
  const _rayOrig   = new THREE.Vector3();
  const _rayDir    = new THREE.Vector3();
  const _capBot    = new THREE.Vector3();
  const _capTop    = new THREE.Vector3();
  const _perpDir   = new THREE.Vector3();
  const _worldN    = new THREE.Vector3();
  const _stepHeights = [0, 0, 0];
  const _groundProbeX = [0, 0, 0, 0, 0];
  const _groundProbeZ = [0, 0, 0, 0, 0];
  const _raycastTargets = [];
  const _hits = [];

  const GROUND_SNAP_UP = SKIN_WIDTH * 4;
  const GROUND_PROBE_FRAC = 0.6;

  // Mutable scaled capsule dimensions (recomputed each frame from character.scale)
  let _capRadiusX = CAP_RADIUS;
  let _capRadiusZ = CAP_RADIUS;
  let _capHeight  = CAP_HEIGHT;
  let _capBotY    = CAP_BOT_Y;
  let _capTopY    = CAP_TOP_Y;
  let _rotY       = 0;

  // ── Cache ──────────────────────────────────────────────
  // Built once via buildCache(); avoids per-frame traversals & allocations.
  let _meshData = [];   // [{ mesh, box }] static broad-phase cache.

  function buildCache(collidables) {
    _meshData = [];

    for (const obj of collidables) {
      obj.updateMatrixWorld(true);
      obj.traverse(child => {
        if (!child.isMesh) return;
        const geo = child.geometry;
        if (!geo.boundingBox) geo.computeBoundingBox();

        _meshData.push({
          mesh: child,
          box: new THREE.Box3().copy(geo.boundingBox).applyMatrix4(child.matrixWorld),
        });
      });
    }
  }

  function clearCache() {
    _meshData = [];
    _raycastTargets.length = 0;
    _hits.length = 0;
  }

  function _collectCandidates(minX, minY, minZ, maxX, maxY, maxZ) {
    _raycastTargets.length = 0;

    for (let i = 0, len = _meshData.length; i < len; i++) {
      const { mesh, box } = _meshData[i];
      if (
        box.max.x < minX || box.min.x > maxX ||
        box.max.y < minY || box.min.y > maxY ||
        box.max.z < minZ || box.min.z > maxZ
      ) continue;
      _raycastTargets.push(mesh);
    }

    return _raycastTargets;
  }

  function _intersectCandidates(targets) {
    _hits.length = 0;
    return RC.intersectObjects(targets, false, _hits);
  }

  /** Ellipse radius at a given WORLD horizontal angle (radians). */
  function _ellipseRadius(angle) {
    const local = angle - _rotY;
    const cx = Math.cos(local);
    const cz = Math.sin(local);
    return (_capRadiusX * _capRadiusZ) /
      Math.sqrt(_capRadiusZ * _capRadiusZ * cx * cx + _capRadiusX * _capRadiusX * cz * cz);
  }

  function _ellipseRadiusDir(dx, dz) {
    return _ellipseRadius(Math.atan2(dz, dx));
  }

  function _updateGroundProbes() {
    const cosY = Math.cos(_rotY);
    const sinY = Math.sin(_rotY);
    const probeX = _capRadiusX * GROUND_PROBE_FRAC;
    const probeZ = _capRadiusZ * GROUND_PROBE_FRAC;

    _groundProbeX[0] = 0;
    _groundProbeZ[0] = 0;

    _groundProbeX[1] =  probeX * cosY;
    _groundProbeZ[1] = -probeX * sinY;
    _groundProbeX[2] = -probeX * cosY;
    _groundProbeZ[2] =  probeX * sinY;

    _groundProbeX[3] = probeZ * sinY;
    _groundProbeZ[3] = probeZ * cosY;
    _groundProbeX[4] = -probeZ * sinY;
    _groundProbeZ[4] = -probeZ * cosY;
  }

  /** Refresh capsule sphere centres + scale dimensions. */
  function _capsuleSpheres(character) {
    _capRadiusX = CAP_RADIUS * character.scale.x;
    _capRadiusZ = CAP_RADIUS * character.scale.z;
    _capHeight  = CAP_HEIGHT * character.scale.y;
    _rotY       = character.rotation.y;
    const minR  = Math.min(_capRadiusX, _capRadiusZ);
    _capBotY    = minR;
    _capTopY    = _capHeight - minR;
    _updateGroundProbes();
    const fy = character.position.y;
    _capBot.set(character.position.x, fy + _capBotY, character.position.z);
    _capTop.set(character.position.x, fy + _capTopY, character.position.z);
  }

  // ── Helper: extract world normal from a raycast hit without allocation ──
  function _hitWorldNormal(hit) {
    const n = hit.face?.normal;
    if (n) {
      _worldN.copy(n).transformDirection(hit.object.matrixWorld).normalize();
    } else {
      _worldN.copy(_rayDir).negate();
    }
    _worldN.y = 0;
    if (_worldN.lengthSq() > 1e-6) _worldN.normalize();
  }

  function _isWalkableHit(hit) {
    const n = hit.face?.normal;
    if (!n) return true;
    _worldN.copy(n).transformDirection(hit.object.matrixWorld).normalize();
    return _worldN.y > 0.45;
  }

  function _findWalkableGround(px, pz, feetY, maxStepUp) {
    const rayTopY = feetY + _capBotY + maxStepUp + GROUND_SNAP_UP;
    const rayBottomY = feetY - SKIN_WIDTH;
    const maxR = Math.max(_capRadiusX, _capRadiusZ) + SKIN_WIDTH;
    const probePad = maxR * GROUND_PROBE_FRAC;
    const targets = _collectCandidates(
      px - maxR - probePad,
      rayBottomY,
      pz - maxR - probePad,
      px + maxR + probePad,
      rayTopY,
      pz + maxR + probePad,
    );
    if (targets.length === 0) return null;

    _rayDir.set(0, -1, 0);
    RC.far = _capBotY + maxStepUp + GROUND_SNAP_UP + SKIN_WIDTH * 4;
    let bestHit = null;

    for (let i = 0; i < _groundProbeX.length; i++) {
      _rayOrig.set(px + _groundProbeX[i], rayTopY, pz + _groundProbeZ[i]);
      RC.set(_rayOrig, _rayDir);

      const hit = _intersectCandidates(targets).find((candidate) => (
        _isWalkableHit(candidate) &&
        candidate.point.y >= feetY - SKIN_WIDTH &&
        candidate.point.y <= feetY + maxStepUp + GROUND_SNAP_UP
      ));

      if (hit && (!bestHit || hit.point.y > bestHit.point.y)) {
        bestHit = hit;
      }
    }

    return bestHit;
  }

  // ─────────────────────────────────────────────────────
  //  STEP 1 — VERTICAL (gravity + ground)
  // ─────────────────────────────────────────────────────
  function resolveVertical(dt, character, physics, scaleFactor = 1) {
    const previousFeetY = character.position.y;

    _capsuleSpheres(character);

    physics.velocityY += GRAVITY * scaleFactor * dt;
    character.position.y += physics.velocityY * dt;

    _capsuleSpheres(character);

    if (physics.velocityY > 0) {
      physics.isGrounded = false;
      return;
    }

    const fallDist = Math.max(0, previousFeetY - character.position.y);

    _rayOrig.set(
      character.position.x,
      previousFeetY + _capBotY + GROUND_SNAP_UP,
      character.position.z,
    );
    _rayDir.set(0, -1, 0);

    const lookDist =
      _capBotY + GROUND_SNAP_UP + fallDist + SKIN_WIDTH * 4;
    const maxR = Math.max(_capRadiusX, _capRadiusZ) + SKIN_WIDTH;
    const probePad = maxR * GROUND_PROBE_FRAC;
    const targets = _collectCandidates(
      character.position.x - maxR - probePad,
      character.position.y - SKIN_WIDTH * 4,
      character.position.z - maxR - probePad,
      character.position.x + maxR + probePad,
      _rayOrig.y,
      character.position.z + maxR + probePad,
    );

    if (targets.length === 0) {
      physics.isGrounded = false;
      return;
    }

    RC.far = lookDist;
    let hit = null;

    for (let i = 0; i < _groundProbeX.length; i++) {
      _rayOrig.set(
        character.position.x + _groundProbeX[i],
        previousFeetY + _capBotY + GROUND_SNAP_UP,
        character.position.z + _groundProbeZ[i],
      );
      RC.set(_rayOrig, _rayDir);
      const probeHit = _intersectCandidates(targets).find((candidate) => (
        _isWalkableHit(candidate) &&
        candidate.point.y <= previousFeetY + GROUND_SNAP_UP &&
        candidate.point.y >= character.position.y - SKIN_WIDTH * 4
      ));
      if (probeHit && (!hit || probeHit.point.y > hit.point.y)) {
        hit = probeHit;
      }
    }

    if (hit) {
      character.position.y = hit.point.y + FEET_OFFSET;
      physics.velocityY = 0;
      physics.isGrounded = true;
      return;
    }

    physics.isGrounded = false;
  }

  // ─────────────────────────────────────────────────────
  //  STEP 2 — HORIZONTAL
  // ─────────────────────────────────────────────────────

  // Shared sweep logic — returns true if movement was blocked.
  // Hits below the feet are ignored; controlled auto-step happens separately.
  let _sweepSlideNX = 0;
  let _sweepSlideNZ = 0;

  function _doSweep(px, pz, heights, moveLen, stepFloorY) {
    _perpDir.set(-_rayDir.z, 0, _rayDir.x);
    const perpRadius = _ellipseRadiusDir(_perpDir.x, _perpDir.z);
    const SIDE_FRAC = 0.7;
    const perpOff = perpRadius * SIDE_FRAC;
    const perpDx  = _perpDir.x * perpOff;
    const perpDz  = _perpDir.z * perpOff;

    const dirRadius = _ellipseRadiusDir(_rayDir.x, _rayDir.z);
    const ofsX = [0, perpDx, -perpDx];
    const ofsZ = [0, perpDz, -perpDz];

    let blocked = false;
    _sweepSlideNX = 0;
    _sweepSlideNZ = 0;

    const maxR = Math.max(_capRadiusX, _capRadiusZ) + SKIN_WIDTH;
    const sweepX = _rayDir.x * (moveLen + maxR);
    const sweepZ = _rayDir.z * (moveLen + maxR);
    const minX = Math.min(px - maxR, px + sweepX - maxR);
    const maxX = Math.max(px + maxR, px + sweepX + maxR);
    const minZ = Math.min(pz - maxR, pz + sweepZ - maxR);
    const maxZ = Math.max(pz + maxR, pz + sweepZ + maxR);
    const targets = _collectCandidates(
      minX,
      heights[0] - maxR,
      minZ,
      maxX,
      heights[2] + maxR,
      maxZ,
    );
    if (targets.length === 0) return false;

    for (let hi = 0; hi < 3; hi++) {
      const py = heights[hi];
      for (let oi = 0; oi < 3; oi++) {
        _rayOrig.set(px + ofsX[oi], py, pz + ofsZ[oi]);
        RC.set(_rayOrig, _rayDir);
        const effRadius = oi === 0 ? dirRadius : dirRadius * (1 - SIDE_FRAC);
        RC.far = effRadius + moveLen + SKIN_WIDTH;

        const hits = _intersectCandidates(targets);
        if (hits.length === 0) continue;

        const hit = hits.find((candidate) => (
          !_isWalkableHit(candidate) && candidate.point.y >= stepFloorY
        ));
        if (!hit) continue;
        const dist = hit.distance;

        if (dist < effRadius + SKIN_WIDTH) {
          blocked = true;
          _hitWorldNormal(hit);
          _sweepSlideNX += _worldN.x;
          _sweepSlideNZ += _worldN.z;
        } else if (dist < effRadius + moveLen) {
          blocked = true;
          _hitWorldNormal(hit);
          _sweepSlideNX += _worldN.x;
          _sweepSlideNZ += _worldN.z;
        }
      }
    }
    return blocked;
  }

  function _tryStepUp(dx, dz, character, physics, moveLen) {
    if (!physics?.isGrounded || physics.velocityY > SKIN_WIDTH) return false;

    const maxStepUp = STEP_UP * character.scale.y;
    const targetX = character.position.x + dx;
    const targetZ = character.position.z + dz;
    const floorHit = _findWalkableGround(targetX, targetZ, character.position.y, maxStepUp);
    _rayDir.set(dx / moveLen, 0, dz / moveLen);
    if (!floorHit) return false;

    const targetY = floorHit.point.y + FEET_OFFSET;
    const stepHeight = targetY - character.position.y;
    if (stepHeight <= GROUND_SNAP_UP || stepHeight > maxStepUp) return false;

    _stepHeights[0] = targetY + _capBotY;
    _stepHeights[1] = targetY + _capHeight * 0.5;
    _stepHeights[2] = targetY + _capTopY;

    // At the stepped height, there must be no wall blocking the capsule path.
    const prevSlideNX = _sweepSlideNX;
    const prevSlideNZ = _sweepSlideNZ;
    const blockedAtStep = _doSweep(
      character.position.x,
      character.position.z,
      _stepHeights,
      moveLen,
      targetY + SKIN_WIDTH,
    );
    _sweepSlideNX = prevSlideNX;
    _sweepSlideNZ = prevSlideNZ;
    if (blockedAtStep) return false;

    character.position.x = targetX;
    character.position.y = targetY;
    character.position.z = targetZ;
    physics.velocityY = 0;
    physics.isGrounded = true;

    _rayDir.set(dx / moveLen, 0, dz / moveLen);
    return true;
  }

  function sweepMove(dx, dz, character, physics) {
    if (Math.abs(dx) < 1e-7 && Math.abs(dz) < 1e-7) return;

    const moveLen = Math.sqrt(dx * dx + dz * dz);
    _rayDir.set(dx / moveLen, 0, dz / moveLen);
    _capsuleSpheres(character);

    const stepFloorY = character.position.y + SKIN_WIDTH;

    // Probe heights: bottom at feet, middle, top
    const h0 = _capBot.y;
    const h1 = character.position.y + _capHeight * 0.5;
    const h2 = _capTop.y;
    const heights = [h0, h1, h2];

    const px0 = character.position.x;
    const pz0 = character.position.z;

    // ── 1. Try horizontal sweep ──
    const blocked = _doSweep(px0, pz0, heights, moveLen, stepFloorY);

    if (blocked && _tryStepUp(dx, dz, character, physics, moveLen)) return;

    if (!blocked) {
      character.position.x += dx;
      character.position.z += dz;

      // Restore _rayDir for any subsequent use
      _rayDir.set(dx / moveLen, 0, dz / moveLen);
      return;
    }

    // ── 2. Wall slide ──
    const slideNX = _sweepSlideNX;
    const slideNZ = _sweepSlideNZ;

    const nLen = Math.sqrt(slideNX * slideNX + slideNZ * slideNZ);
    if (nLen < 1e-6) return;

    const nx = slideNX / nLen;
    const nz = slideNZ / nLen;
    const tx =  nz;
    const tz = -nx;

    const dot = dx * tx + dz * tz;
    if (Math.abs(dot) > 1e-3) {
      const slideX   = tx * dot;
      const slideZ   = tz * dot;
      const slideLen = Math.sqrt(slideX * slideX + slideZ * slideZ);

      _rayDir.set(slideX / slideLen, 0, slideZ / slideLen);
      const slideBlocked = _doSweep(character.position.x, character.position.z,
        heights, slideLen, stepFloorY);

      if (!slideBlocked) {
        character.position.x += slideX;
        character.position.z += slideZ;
      }
    }
  }

  return { buildCache, clearCache, resolveVertical, sweepMove };
}
