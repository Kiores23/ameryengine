function inferPhaseProgress(phase) {
  const label = String(phase || "").toLowerCase();

  if (!label) return 0;
  if (label.includes("initializing")) return 12;
  if (label.includes("viewport ready")) return 24;
  if (label.includes("connecting")) return 32;
  if (label.includes("fetching")) return 38;
  if (label.includes("reading")) return 38;
  if (label.includes("loading")) return 46;
  if (label.includes("building")) return 88;
  if (label.includes("ready")) return 100;
  return 20;
}

export default function LoadingScreen({ progress, className = "" }) {
  if (!progress) return null;

  const { phase, loaded, total } = progress;
  const pct = total > 0
    ? Math.max(Math.round((loaded / total) * 100), loaded > 0 ? 6 : 0)
    : inferPhaseProgress(phase);

  return (
    <div className={`loadingScreen${className ? ` ${className}` : ""}`}>
      <div className="loadingScreen__content">
        <div className="loadingScreen__spinner" />

        <div className="loadingScreen__barWrap">
          <div
            className="loadingScreen__barFill"
            style={{ width: `${pct}%` }}
          />
        </div>

        {total > 0 && (
          <span className="loadingScreen__pct">{pct}%</span>
        )}

        <span className="loadingScreen__phase">{phase}</span>
      </div>
    </div>
  );
}
