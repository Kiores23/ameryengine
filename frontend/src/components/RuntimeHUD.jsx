import { useCallback, useEffect, useRef, useState } from "react";
import "../styles/RuntimeHUD.css";

const JOYSTICK_RADIUS = 34;
const JOYSTICK_DEADZONE = 0.14;

function HudKey({ children, wide }) {
  return (
    <span className={"hud-key" + (wide ? " hud-key--wide" : "")}>
      {children}
    </span>
  );
}

function WasdKeys({ active }) {
  return (
    <div className={"hud-keys-group" + (active ? "" : " hud-keys-group--dim")}>
      <div className="hud-key-row hud-key-row--center">
        <HudKey>W</HudKey>
      </div>
      <div className="hud-key-row">
        <HudKey>A</HudKey>
        <HudKey>S</HudKey>
        <HudKey>D</HudKey>
      </div>
      <div className="hud-key-group-label">WASD</div>
    </div>
  );
}

function ZqsdKeys({ active }) {
  return (
    <div className={"hud-keys-group" + (active ? "" : " hud-keys-group--dim")}>
      <div className="hud-key-row hud-key-row--center">
        <HudKey>Z</HudKey>
      </div>
      <div className="hud-key-row">
        <HudKey>Q</HudKey>
        <HudKey>S</HudKey>
        <HudKey>D</HudKey>
      </div>
      <div className="hud-key-group-label">ZQSD</div>
    </div>
  );
}

function ArrowKeys() {
  return (
    <div className="hud-keys-group">
      <div className="hud-key-row hud-key-row--center">
        <HudKey>↑</HudKey>
      </div>
      <div className="hud-key-row">
        <HudKey>←</HudKey>
        <HudKey>↓</HudKey>
        <HudKey>→</HudKey>
      </div>
    </div>
  );
}

function MobileRuntimeHUD({
  showRotateHint = false,
  autoRunEnabled = false,
  onMove,
  onMoveEnd,
  onJump,
  onToggleAutoRun,
}) {
  const baseRef = useRef(null);
  const activePointerIdRef = useRef(null);
  const [stickPosition, setStickPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const applyPointerPosition = useCallback((clientX, clientY) => {
    const base = baseRef.current;
    if (!base) return;

    const rect = base.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const distance = Math.hypot(dx, dy);

    if (distance > JOYSTICK_RADIUS) {
      const scale = JOYSTICK_RADIUS / distance;
      dx *= scale;
      dy *= scale;
    }

    const normalizedX = dx / JOYSTICK_RADIUS;
    const normalizedY = dy / JOYSTICK_RADIUS;
    const nextX = Math.abs(normalizedX) < JOYSTICK_DEADZONE ? 0 : normalizedX;
    const nextY = Math.abs(normalizedY) < JOYSTICK_DEADZONE ? 0 : normalizedY;

    setStickPosition({ x: dx, y: dy });
    onMove?.(nextX, nextY);
  }, [onMove]);

  const resetStick = useCallback(() => {
    activePointerIdRef.current = null;
    setIsDragging(false);
    setStickPosition({ x: 0, y: 0 });
    onMoveEnd?.();
  }, [onMoveEnd]);

  useEffect(() => resetStick, [resetStick]);

  return (
    <div className="runtime-mobileHud">
      {showRotateHint && (
        <div className="runtime-rotateHint runtime-rotateHint--mobile">
          <div className="runtime-rotateHint__phone">
            <div className="runtime-rotateHint__screen" />
          </div>
          <div className="runtime-rotateHint__arrow">↻</div>
          <div className="runtime-rotateHint__text">
            <strong>Rotate your device</strong>
            <span>Runtime feels better in landscape</span>
          </div>
        </div>
      )}

      <div className="runtime-mobileHud__bar">
        <div className="runtime-mobileHud__cluster runtime-mobileHud__cluster--left">
          <div
            ref={baseRef}
            className={
              "runtime-mobileHud__joystick" +
              (isDragging ? " is-active" : "")
            }
            onPointerDown={(event) => {
              activePointerIdRef.current = event.pointerId;
              setIsDragging(true);
              event.preventDefault();
              event.currentTarget.setPointerCapture?.(event.pointerId);
              applyPointerPosition(event.clientX, event.clientY);
            }}
            onPointerMove={(event) => {
              if (activePointerIdRef.current !== event.pointerId) return;
              event.preventDefault();
              applyPointerPosition(event.clientX, event.clientY);
            }}
            onPointerUp={(event) => {
              if (activePointerIdRef.current !== event.pointerId) return;
              event.currentTarget.releasePointerCapture?.(event.pointerId);
              resetStick();
            }}
            onPointerCancel={(event) => {
              if (activePointerIdRef.current !== event.pointerId) return;
              resetStick();
            }}
          >
            <div className="runtime-mobileHud__joystickHalo" />
            <div className="runtime-mobileHud__joystickRing" />
            <div
              className="runtime-mobileHud__joystickThumb"
              style={{
                transform: `translate(-50%, -50%) translate(${stickPosition.x}px, ${stickPosition.y}px)`,
              }}
            />
          </div>

          <div className="runtime-mobileHud__caption">
            <span className="runtime-mobileHud__captionLabel">Move</span>
            <span className="runtime-mobileHud__captionValue">Left stick</span>
          </div>
        </div>

        <div className="runtime-mobileHud__cluster runtime-mobileHud__cluster--right">
          <button
            type="button"
            className="runtime-mobileHud__actionBtn runtime-mobileHud__actionBtn--jump"
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => onJump?.()}
            aria-label="Jump"
          >
            <span className="runtime-mobileHud__actionEyebrow">Action</span>
            <span className="runtime-mobileHud__actionLabel">Jump</span>
          </button>

          <button
            type="button"
            className={
              "runtime-mobileHud__actionBtn runtime-mobileHud__actionBtn--run" +
              (autoRunEnabled ? " is-active" : "")
            }
            onPointerDown={(event) => event.preventDefault()}
            onClick={() => onToggleAutoRun?.()}
            aria-pressed={autoRunEnabled}
            aria-label={autoRunEnabled ? "Disable auto run" : "Enable auto run"}
          >
            <span className="runtime-mobileHud__actionEyebrow">
              {autoRunEnabled ? "Running" : "Movement"}
            </span>
            <span className="runtime-mobileHud__actionLabel">Auto Run</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RuntimeHUD({
  layout = "wasd",
  cursorLocked = true,
  showRotateHint = false,
  mobileMode = false,
  autoRunEnabled = false,
  onMove,
  onMoveEnd,
  onJump,
  onToggleAutoRun,
}) {
  return (
    <div className="runtime-hud">
      {!mobileMode && showRotateHint && (
        <div className="runtime-rotateHint">
          <div className="runtime-rotateHint__phone">
            <div className="runtime-rotateHint__screen" />
          </div>
          <div className="runtime-rotateHint__arrow">↻</div>
          <div className="runtime-rotateHint__text">
            <strong>Rotate your device</strong>
            <span>Runtime feels better in landscape mode</span>
          </div>
        </div>
      )}

      {mobileMode ? (
        <MobileRuntimeHUD
          showRotateHint={showRotateHint}
          autoRunEnabled={autoRunEnabled}
          onMove={onMove}
          onMoveEnd={onMoveEnd}
          onJump={onJump}
          onToggleAutoRun={onToggleAutoRun}
        />
      ) : (
        <>
          <div className="hud-top-left">
            <div className="hud-hint">
              <HudKey>ESC</HudKey>
              <span>Stop</span>
            </div>
            <div className="hud-hint">
              <HudKey>TAB</HudKey>
              <span>{cursorLocked ? "Release cursor" : "Click to capture cursor"}</span>
            </div>
          </div>

          <div className="hud-bottom">
            <div className="hud-bottom-left">
              <WasdKeys active={layout === "wasd"} />
              <div className="hud-keys-divider" />
              <ZqsdKeys active={layout === "zqsd"} />
            </div>

            <div className="hud-bottom-center">
              <HudKey wide>SPACE</HudKey>
              <div className="hud-key-label">Jump</div>
            </div>

            <div className="hud-bottom-right">
              <ArrowKeys />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
