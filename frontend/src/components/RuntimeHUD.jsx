import "../styles/RuntimeHUD.css";

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

export default function RuntimeHUD({ layout = "wasd", cursorLocked = true }) {
  return (
    <div className="runtime-hud">
      {/* Top-left: meta controls */}
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

      {/* Bottom: three-column grid */}
      <div className="hud-bottom">
        {/* Left: WASD + ZQSD */}
        <div className="hud-bottom-left">
          <WasdKeys active={layout === "wasd"} />
          <div className="hud-keys-divider" />
          <ZqsdKeys active={layout === "zqsd"} />
        </div>

        {/* Center: space bar */}
        <div className="hud-bottom-center">
          <HudKey wide>SPACE</HudKey>
          <div className="hud-key-label">Jump</div>
        </div>

        {/* Right: arrow keys */}
        <div className="hud-bottom-right">
          <ArrowKeys />
        </div>
      </div>
    </div>
  );
}
