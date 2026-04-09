// ── Tuning ──────────────────────────────────────────────────
export const DEBUG      = false;  // set to true to show collision capsule & bbox helpers
export const GRAVITY    = -20;
export const JUMP_VEL   =  8;
export const JUMP_DELAY = 0.2;  // delay (seconds) before jump is triggered
export const MOVE_SPEED =  4;
export const RUN_SPEED  =  8;

// Capsule dimensions (character stands with feet at position.y)
export const CAP_RADIUS  = 0.35;   // radius of the two spheres
export const CAP_HEIGHT  = 1.6;    // total height (feet → head)
// Centre of the bottom sphere (from feet)
export const CAP_BOT_Y   = CAP_RADIUS;
// Centre of the top sphere (from feet)
export const CAP_TOP_Y   = CAP_HEIGHT - CAP_RADIUS;
// Vertical segment length between sphere centres
export const CAP_SEG_LEN = CAP_TOP_Y - CAP_BOT_Y;

// Ground collision
export const STEP_UP     = 0.4;   // max automatic step-up height; keep small to avoid visible teleports
export const SKIN_WIDTH  = 0.02;   // small epsilon to avoid z-fighting
export const FEET_OFFSET = -0.01;   // shift character down relative to ground snap (visual correction)

// Camera third-person
export const CAM_ARM        = 6;
export const CAM_PIVOT_H    = 1.5;  // camera pivot height above feet
export const CAM_SHOULDER   = 0.7;  // horizontal shoulder offset
export const CAM_LERP       = 0.18;
export const MOUSE_SENS     = 0.002;
export const ARROW_YAW_SPEED = 1.8; // rad/s camera rotation with arrow keys
export const PITCH_MIN      = -0.5;
export const PITCH_MAX      =  1.1;

// Respawn/kill floor — if character falls below this, respawn at spawn point
export const RESPAWN_KILL_FLOOR = -100;
