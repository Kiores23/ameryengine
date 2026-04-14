import * as THREE from "three";
import { JUMP_VEL, JUMP_DELAY, MOVE_SPEED, RUN_SPEED, MOUSE_SENS, PITCH_MIN, PITCH_MAX, RESPAWN_KILL_FLOOR, ARROW_YAW_SPEED } from "./constants.js";
import { getCollidables } from "./helpers.js";
import { createDebugManager } from "./debug.js";
import { createCollisionSystem } from "./collision.js";
import { updateCamera } from "./camera.js";
import { playAnimation } from "../engine/animation.js";

// ─────────────────────────────────────────
//  FACTORY
// ─────────────────────────────────────────
export function createRuntimeController() {

  // ── Sub-systems ────────────────────────
  const debug     = createDebugManager();
  const collision = createCollisionSystem();

  // ── Physics state (passed into collision) ──
  const physics = { velocityY: 0, isGrounded: false };

  // ── Controller state ───────────────────
  const keys      = {};
  let active      = false;

  let character      = null;
  let objectsByName  = null;
  let canvas         = null;
  let savedCamPos    = null;
  let savedTarget    = null;
  let stopCb         = null;
  let savedTransforms = null;
  let _onLayoutChange    = null;
  let _onCursorLockChange = null;
  let _tabReleased = false;
  let _focusReleased = false;
  let spawnPos        = null;
  let _cachedCollidables = null;
  let captureInput = true;

  let yaw   = 0;
  let pitch = 0.3;
  let jumpPressedAt = -Infinity; // timestamp of last Space press (while grounded)

  // ── Input layout: 'wasd' | 'zqsd' (auto-detected, switchable at any time) ──
  let layout = 'wasd';

  // ── Pre-allocated vectors ───────────────
  const _fwd     = new THREE.Vector3();
  const _right   = new THREE.Vector3();
  const _moveDir = new THREE.Vector3();

  function resetInputs() {
    for (const k in keys) keys[k] = false;
    jumpPressedAt = -Infinity;
  }

  function resetCharacterAnimation(targetCharacter = character) {
    const actions = targetCharacter?.userData?.animationActions;
    if (!actions) return false;

    const defaultAnimation = targetCharacter.userData?.defaultAnimation ?? "idle";
    return (
      playAnimation(actions, defaultAnimation) ||
      playAnimation(actions, "idle")
    );
  }

  // ── Input ──────────────────────────────
  function onKeyDown(e) {
    if (!active) return;
    // ESC when cursor is already free → stop runtime
    if (e.code === 'Escape' && document.pointerLockElement !== canvas) {
      stopCb?.();
      return;
    }
    if (e.code === 'Tab') {
      e.preventDefault();
      if (document.pointerLockElement === canvas) {
        _tabReleased = true;
        document.exitPointerLock?.();
      } else {
        canvas.requestPointerLock?.();
      }
      return;
    }
    // Auto-detect layout based on character produced, not physical position
    const key = e.key?.toLowerCase();
    if (['w', 'a'].includes(key) && layout !== 'wasd') { layout = 'wasd'; _onLayoutChange?.('wasd'); }
    if (['z', 'q'].includes(key) && layout !== 'zqsd') { layout = 'zqsd'; _onLayoutChange?.('zqsd'); }
    keys[e.code] = true;  // Store by code for special keys (arrows, space, etc.)
    if (e.key) keys[key] = true;  // Store by character for movement keys
    // Space: start jump sequence immediately if grounded
    if (e.code === 'Space' && physics.isGrounded && jumpPressedAt < 0) {
      jumpPressedAt = performance.now() / 1000;
      _playAnim('Regular_Jump');
    }
  }
  function onKeyUp(e) { 
    keys[e.code] = false;
    if (e.key) keys[e.key.toLowerCase()] = false;
  }
  function onWindowBlur() {
    if (!active) return;
    _focusReleased = true;
    resetInputs();
  }
  function onVisibilityChange() {
    if (!active || document.visibilityState !== "hidden") return;
    _focusReleased = true;
    resetInputs();
  }
  function onMouseMove(e) {
    if (!active) return;
    yaw  -= e.movementX * MOUSE_SENS;
    pitch = THREE.MathUtils.clamp(
      pitch + e.movementY * MOUSE_SENS,
      PITCH_MIN, PITCH_MAX
    );
  }
  function onPointerLockChange() {
    const locked = document.pointerLockElement === canvas;
    if (!locked && !_tabReleased && !_focusReleased) {
      // Browser released lock via ESC → stop runtime
      stopCb?.();
      return;
    }
    _tabReleased = false;
    if (locked) _focusReleased = false;
    _onCursorLockChange?.(locked);
  }
  function onCanvasClick() {
    if (!active) return;
    if (document.pointerLockElement !== canvas) {
      canvas.focus();
      try {
        const p = canvas.requestPointerLock?.();
        if (p instanceof Promise) p.catch(() => {});
      } catch (_) {}
    }
  }

  // ── Lifecycle ──────────────────────────
  function start(
    state,
    camera,
    controls,
    targetName,
    canvasEl,
    onStop,
    {
      onLayoutChange,
      onCursorLockChange,
      background = false,
    } = {},
  ) {
    if (active) return false;

    const obj = state.objectsByName?.get(targetName);
    if (!obj) return false;

    character      = obj;
    objectsByName  = state.objectsByName;
    canvas         = canvasEl;
    _onLayoutChange    = onLayoutChange ?? null;
    _onCursorLockChange = onCursorLockChange ?? null;
    captureInput = !background;
    active    = true;
    physics.velocityY  = 0;
    physics.isGrounded = false;
    stopCb    = onStop;

    yaw   = character.rotation.y + Math.PI;
    pitch = 0.3;

    // Save spawn position (for respawn)
    spawnPos = character.position.clone();

    // Snapshot every scene object's transform
    savedTransforms = new Map();
    for (const [name, obj] of objectsByName) {
      savedTransforms.set(name, {
        position: obj.position.clone(),
        rotation: obj.rotation.clone(),
        scale:    obj.scale.clone(),
      });
    }

    savedCamPos = camera.position.clone();
    savedTarget = controls.target.clone();
    controls.enabled = false;

    // Log available animation clips for debugging
    const actions = character?.userData?.animationActions;
    if (actions) {
      console.log("[Runtime] Available animations:", Object.keys(actions));
    }

    _playAnim("idle");
    _cachedCollidables = getCollidables(character, objectsByName);
    collision.buildCache(_cachedCollidables);
    updateCamera(camera, { yaw, pitch }, character, _cachedCollidables, true);

    debug.init(character, _cachedCollidables);

    if (captureInput) {
      canvas.requestPointerLock?.();
      window.addEventListener("keydown",  onKeyDown);
      window.addEventListener("keyup",    onKeyUp);
      window.addEventListener("blur",     onWindowBlur);
      document.addEventListener("visibilitychange", onVisibilityChange);
      document.addEventListener("mousemove",          onMouseMove);
      document.addEventListener("pointerlockchange",  onPointerLockChange);
      canvas.addEventListener("click", onCanvasClick);
    } else {
      _onCursorLockChange?.(false);
    }

    return true;
  }

  function stop(camera, controls) {
    if (!active) return;
    active = false;
    resetInputs();

    if (captureInput && document.pointerLockElement === canvas) {
      document.exitPointerLock?.();
    }

    if (savedCamPos) camera.position.copy(savedCamPos);
    if (savedTarget) controls.target.copy(savedTarget);
    controls.enabled = true;

    // Restore every scene object's transform
    if (savedTransforms && objectsByName) {
      for (const [name, t] of savedTransforms) {
        const obj = objectsByName.get(name);
        if (!obj) continue;
        obj.position.copy(t.position);
        obj.rotation.copy(t.rotation);
        obj.scale.copy(t.scale);
      }
    }
    savedTransforms = null;

    resetCharacterAnimation();

    debug.destroy();
    collision.clearCache();

    if (captureInput) {
      window.removeEventListener("keydown",  onKeyDown);
      window.removeEventListener("keyup",    onKeyUp);
      window.removeEventListener("blur",     onWindowBlur);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      document.removeEventListener("mousemove",         onMouseMove);
      document.removeEventListener("pointerlockchange", onPointerLockChange);
      canvas?.removeEventListener("click", onCanvasClick);
    }

    _tabReleased = false;
    _focusReleased = false;
    captureInput = true;
    _onCursorLockChange?.(false);
    _cachedCollidables = null;
    character = canvas = savedCamPos = savedTarget = stopCb = objectsByName = null;
    _onLayoutChange = _onCursorLockChange = null;
  }

  // ── Animation helper ───────────────────
  function _playAnim(name) {
    const actions = character?.userData?.animationActions;
    if (!actions) return;

    let action = actions[name] ??
      Object.values(actions).find((_, k) =>
        typeof k === "string" && k.toLowerCase().includes(name));

    if (!action) {
      const entry = Object.entries(actions).find(([k]) =>
        k.toLowerCase().includes(name.toLowerCase()));
      action = entry?.[1];
    }
    if (!action || action.isRunning()) return;

    for (const a of Object.values(actions)) if (a !== action) a.fadeOut(0.2);
    action.reset().fadeIn(0.2).play();
  }

  // ─────────────────────────────────────────────────────
  //  MAIN UPDATE LOOP
  // ─────────────────────────────────────────────────────
  function update(dt, camera, _controls) {
    if (!active || !character) return;

    // Clamp dt to avoid huge first-frame spikes (timer may accumulate idle time)
    const safeDt = Math.min(dt, 1 / 30);

    // Collidables are cached inside collision system (buildCache at start)

    // Check if player fell too low → respawn at spawn position
    if (character.position.y < RESPAWN_KILL_FLOOR) {
      character.position.copy(spawnPos);
      physics.velocityY = 0;
      physics.isGrounded = false;
    }

    // 1. Arrow keys rotate the camera (and will also move, see below)
    if (keys["ArrowLeft"])  yaw += ARROW_YAW_SPEED * safeDt;
    if (keys["ArrowRight"]) yaw -= ARROW_YAW_SPEED * safeDt;

    // 2. Camera-relative forward/right directions
    _fwd.set(Math.sin(yaw), 0, Math.cos(yaw)).normalize();
    _right.crossVectors(THREE.Object3D.DEFAULT_UP, _fwd).normalize();

    // 3. Build desired move vector
    //    WASD: w=fwd, s=back, a=left, d=right
    //    ZQSD: z=fwd, s=back, q=left, d=right
    //    Arrows: up=fwd, down=back (left/right already handled above as camera turn)
    const fwdKey  = layout === 'zqsd' ? 'z' : 'w';
    const backKey = 's';
    const leftKey = layout === 'zqsd' ? 'q' : 'a';
    const rightKey = 'd';

    _moveDir.set(0, 0, 0);
    if (keys[fwdKey]  || keys["ArrowUp"])    _moveDir.sub(_fwd);
    if (keys[backKey] || keys["ArrowDown"])  _moveDir.add(_fwd);
    if (keys[leftKey])                       _moveDir.sub(_right);
    if (keys[rightKey])                      _moveDir.add(_right);

    const isMoving = _moveDir.lengthSq() > 0.001;
    const isRunning = isMoving && (keys["ShiftLeft"] || keys["ShiftRight"]);
    let dx = 0, dz = 0;

    // Scale speed by character height
    const scaleFactor = character.scale.y;
    const globalScaleFactor = (character.scale.y + character.scale.x) * 0.5;
    const speed = isRunning ? RUN_SPEED : MOVE_SPEED;

    if (isMoving) {
      _moveDir.normalize();
      dx = _moveDir.x * speed * scaleFactor * safeDt;
      dz = _moveDir.z * speed * scaleFactor * safeDt;
    }

    // 4. Horizontal sweep (collision + slide)
    collision.sweepMove(dx, dz, character, physics);

    // 5. Rotate character toward movement direction
    if (isMoving) {
      const targetAngle = Math.atan2(dx, dz);
      let diff = targetAngle - character.rotation.y;
      while (diff >  Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      character.rotation.y += diff * 0.15;
    }

    // Track current time
    const currentTime = performance.now() / 1000;

    // 6. Jump — fires after JUMP_DELAY from the initial keypress
    if (jumpPressedAt >= 0) {
      if (!physics.isGrounded) {
        // Left the ground some other way — cancel
        jumpPressedAt = -Infinity;
      } else if ((currentTime - jumpPressedAt) >= JUMP_DELAY) {
        physics.velocityY  = JUMP_VEL * scaleFactor;
        physics.isGrounded = false;
        jumpPressedAt = -Infinity;
      }
    }

    // 7. Vertical (gravity + ground resolution)
    collision.resolveVertical(safeDt, character, physics, globalScaleFactor);

    // 8. Animation (jump handled directly in onKeyDown)
    // While airborne, never override the jump/fall animation with walk/run/idle
    if (physics.isGrounded && jumpPressedAt < 0) {
      let anim;
      if (isMoving) {
        anim = isRunning ? "run" : "walk";
      } else {
        anim = "idle";
      }
      _playAnim(anim);
    } else if (!physics.isGrounded && physics.velocityY < -2) {
      _playAnim("fall");
    }

    // 9. Camera
    updateCamera(camera, { yaw, pitch }, character, _cachedCollidables, false);

    // 10. Lock character upright (animations may tilt x/z)
    character.rotation.x = 0;
    character.rotation.z = 0;

    // 11. Debug visuals
    debug.update(character);
  }

  function isActive() { return active; }
  function getLayout() { return layout; }
  function getCharacter() { return character; }

  function pushCharacter(dx, dz) {
    if (!active || !character) return false;
    if (Math.abs(dx) < 1e-7 && Math.abs(dz) < 1e-7) return false;

    const prevX = character.position.x;
    const prevZ = character.position.z;
    collision.sweepMove(dx, dz, character, physics);
    return (
      Math.abs(character.position.x - prevX) > 1e-7 ||
      Math.abs(character.position.z - prevZ) > 1e-7
    );
  }

  function syncAfterExternalMovement(camera) {
    if (!active || !character) return;
    updateCamera(camera, { yaw, pitch }, character, _cachedCollidables, false);
    character.rotation.x = 0;
    character.rotation.z = 0;
    debug.update(character);
  }

  return {
    start,
    stop,
    update,
    isActive,
    getLayout,
    getCharacter,
    pushCharacter,
    syncAfterExternalMovement,
  };
}
