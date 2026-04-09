import { useMemo, useState } from "react";
import { ASSET_LIBRARY_FOLDERS } from "../data/assetLibraryRegistry";

/* ─────────────────────────────────────────────
   ICÔNE DOSSIER — SVG inline, style Windows/Unreal
───────────────────────────────────────────── */
const FOLDER_COLORS = {
  pink:   { tab: "#c84fb0", body: "#7a2a6a", border: "rgba(200,79,176,0.6)" },
  yellow: { tab: "#c8a020", body: "#6a5010", border: "rgba(200,160,30,0.6)" },
  blue:   { tab: "#2878c8", body: "#1a3a7a", border: "rgba(40,120,200,0.6)" },
  green:  { tab: "#28a855", body: "#1a5a30", border: "rgba(40,168,85,0.6)"  },
  orange: { tab: "#c86420", body: "#6a3010", border: "rgba(200,100,30,0.6)" },
  gray:   { tab: "#606070", body: "#303040", border: "rgba(100,100,130,0.5)"},
};

function FolderIcon({ color = "pink" }) {
  const c = FOLDER_COLORS[color] ?? FOLDER_COLORS.pink;
  return (
    <svg
      className="alFolderSvg"
      viewBox="0 0 56 46"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Onglet haut gauche */}
      <rect x="0" y="0" width="22" height="10" rx="4" fill={c.tab} opacity="0.85" />
      {/* Corps principal */}
      <rect x="0" y="8" width="56" height="38" rx="6" fill={c.body} opacity="0.8" />
      <rect x="0" y="8" width="56" height="38" rx="6" stroke={c.border} strokeWidth="1.2" />
      {/* Reflet haut */}
      <rect x="4" y="12" width="48" height="12" rx="3" fill="rgba(255,255,255,0.10)" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   ICÔNES PRIMITIVES — SVG inline par model
───────────────────────────────────────────── */
function PrimitiveIcon({ model }) {
  const acc  = "rgba(255,79,216,0.55)";
  const fill = "rgba(255,79,216,0.28)";
  const dark = "rgba(180,30,160,0.22)";
  const W = 52, H = 52;

  const svgProps = {
    width: W, height: H,
    viewBox: `0 0 ${W} ${H}`,
    fill: "none",
    "aria-hidden": "true",
  };

  if (model === "sphere") return (
    <svg {...svgProps}>
      <circle cx="26" cy="26" r="18" fill={fill} stroke={acc} strokeWidth="1.2" />
      <ellipse cx="26" cy="26" rx="18" ry="6" fill="none" stroke={acc} strokeWidth="0.7" opacity="0.5" />
      <ellipse cx="26" cy="26" rx="6" ry="18" fill="none" stroke={acc} strokeWidth="0.7" opacity="0.5" />
      <ellipse cx="20" cy="20" rx="5" ry="3" fill="rgba(255,255,255,0.12)" />
    </svg>
  );

  if (model === "cylinder" || model === "truncated_cone" || model === "pillar") return (
    <svg {...svgProps}>
      <ellipse cx="26" cy="14" rx="14" ry="5" fill={dark} stroke={acc} strokeWidth="1.2" />
      <rect x="12" y="14" width="28" height="24" fill={fill} />
      <ellipse cx="26" cy="38" rx="14" ry="5" fill={fill} stroke={acc} strokeWidth="1.2" />
      <line x1="12" y1="14" x2="12" y2="38" stroke={acc} strokeWidth="1.2" />
      <line x1="40" y1="14" x2="40" y2="38" stroke={acc} strokeWidth="1.2" />
    </svg>
  );

  if (model === "cone") return (
    <svg {...svgProps}>
      <path d="M26 6 L44 44 L8 44Z" fill={fill} stroke={acc} strokeWidth="1.2" strokeLinejoin="round" />
      <ellipse cx="26" cy="44" rx="18" ry="5" fill={dark} stroke={acc} strokeWidth="1" />
    </svg>
  );

  if (model === "plane") return (
    <svg {...svgProps}>
      <path d="M6 36 L26 24 L46 36 L26 48Z" fill={fill} stroke={acc} strokeWidth="1.2" strokeLinejoin="round" />
      <line x1="6"  y1="36" x2="46" y2="36" stroke={acc} strokeWidth="0.7" opacity="0.4" />
      <line x1="26" y1="24" x2="26" y2="48" stroke={acc} strokeWidth="0.7" opacity="0.4" />
      <line x1="16" y1="30" x2="36" y2="42" stroke={acc} strokeWidth="0.6" opacity="0.3" />
    </svg>
  );

  if (model === "torus" || model === "torus_thick" || model === "ring") return (
    <svg {...svgProps}>
      <ellipse cx="26" cy="30" rx="17" ry="7" fill="none" stroke={acc} strokeWidth="8" opacity="0.30" />
      <ellipse cx="26" cy="30" rx="17" ry="7" fill="none" stroke={acc} strokeWidth="8"
        strokeDasharray="32 26" strokeDashoffset="0" opacity="0.65" />
    </svg>
  );

  if (model === "pyramid") return (
    <svg {...svgProps}>
      <path d="M26 6 L44 44 L26 44Z" fill={dark} stroke={acc} strokeWidth="1" />
      <path d="M26 6 L8 44 L44 44Z" fill={fill} stroke={acc} strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );

  if (model === "tri_prism" || model === "hex_prism") return (
    <svg {...svgProps}>
      <path d="M26 10 L42 40 L10 40Z" fill={dark} stroke={acc} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M26 18 L42 48 L10 48Z" fill={fill} stroke={acc} strokeWidth="1.2" strokeLinejoin="round" />
      <line x1="26" y1="10" x2="26" y2="18" stroke={acc} strokeWidth="1" />
      <line x1="42" y1="40" x2="42" y2="48" stroke={acc} strokeWidth="1" />
      <line x1="10" y1="40" x2="10" y2="48" stroke={acc} strokeWidth="1" />
    </svg>
  );

  if (model === "arc_half" || model === "arc_quarter") return (
    <svg {...svgProps}>
      <path d="M8 38 A20 20 0 0 1 44 38" fill="none" stroke={acc} strokeWidth="9" opacity="0.28" />
      <path d="M8 38 A20 20 0 0 1 44 38" fill="none" stroke={acc} strokeWidth="9"
        strokeDasharray="24 120" opacity="0.65" strokeLinecap="round" />
      <ellipse cx="26" cy="38" rx="11" ry="4" fill={dark} stroke={acc} strokeWidth="0.8" opacity="0.6" />
    </svg>
  );

  if (model === "disc") return (
    <svg {...svgProps}>
      <ellipse cx="26" cy="30" rx="18" ry="6" fill={fill} stroke={acc} strokeWidth="1.2" />
      <ellipse cx="26" cy="28" rx="18" ry="6" fill={dark} stroke={acc} strokeWidth="1.2" />
      <ellipse cx="26" cy="28" rx="8"  ry="2.5" fill="rgba(255,79,216,0.15)" stroke={acc} strokeWidth="0.8" />
    </svg>
  );

  if (model === "icosahedron" || model === "octahedron" || model === "tetrahedron" || model === "dodecahedron") return (
    <svg {...svgProps}>
      <polygon points="26,6 46,36 6,36" fill={fill} stroke={acc} strokeWidth="1.2" />
      <polygon points="26,46 46,16 6,16" fill={dark} stroke={acc} strokeWidth="1.2" />
    </svg>
  );

  if (model === "crystal") return (
    <svg {...svgProps}>
      <polygon points="26,4 40,16 36,42 16,42 12,16" fill={fill} stroke={acc} strokeWidth="1.2" />
      <line x1="26" y1="4" x2="16" y2="42" stroke={acc} strokeWidth="0.7" opacity="0.5" />
      <line x1="26" y1="4" x2="36" y2="42" stroke={acc} strokeWidth="0.7" opacity="0.5" />
      <line x1="12" y1="22" x2="40" y2="22" stroke={acc} strokeWidth="0.6" opacity="0.4" />
    </svg>
  );

  if (model === "spike") return (
    <svg {...svgProps}>
      <path d="M26 4 L34 44 L18 44Z" fill={fill} stroke={acc} strokeWidth="1.2" strokeLinejoin="round" />
      <ellipse cx="26" cy="44" rx="10" ry="3.5" fill={dark} stroke={acc} strokeWidth="0.8" />
    </svg>
  );

  if (model === "ramp") return (
    <svg {...svgProps}>
      <path d="M8 44 L44 14 L44 44Z" fill={fill} stroke={acc} strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8 44 L44 14 L44 44Z" fill={dark} clipPath="url(#shadow)" />
    </svg>
  );

  /* Lumières */
  if (model?.includes("light")) {
    const ya = "rgba(255,220,50,0.7)";
    const yb = "rgba(255,220,50,0.35)";
    const rays = [0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
      const r = (angle * Math.PI) / 180;
      return (
        <line key={i}
          x1={26 + Math.cos(r) * 13} y1={20 + Math.sin(r) * 13}
          x2={26 + Math.cos(r) * 19} y2={20 + Math.sin(r) * 19}
          stroke={ya} strokeWidth="1.5" strokeLinecap="round"
        />
      );
    });
    return (
      <svg {...svgProps}>
        <circle cx="26" cy="20" r="10" fill="rgba(255,230,60,0.35)" stroke={ya} strokeWidth="1.2" />
        <circle cx="26" cy="20" r="5"  fill="rgba(255,240,120,0.75)" />
        {rays}
        <rect x="20" y="30" width="12" height="14" rx="2" fill={yb} stroke={ya} strokeWidth="1" />
      </svg>
    );
  }

  /* Fallback — cube générique */
  return (
    <svg {...svgProps}>
      <rect x="10" y="16" width="26" height="26" rx="4" fill={fill} stroke={acc} strokeWidth="1.2" />
      <path d="M10 16 L18 8 L44 8 L36 16Z" fill={dark} stroke={acc} strokeWidth="1" />
      <path d="M36 16 L44 8 L44 34 L36 42Z" fill="rgba(255,79,216,0.15)" stroke={acc} strokeWidth="1" />
    </svg>
  );
}

/* ─────────────────────────────────────────────
   COMPOSANT PRINCIPAL
───────────────────────────────────────────── */
export default function AssetLibrary({ onClose }) {
  const [currentFolderId, setCurrentFolderId] = useState(null);

  const folders = useMemo(() => ASSET_LIBRARY_FOLDERS, []);
  const currentFolder = folders.find((f) => f.id === currentFolderId) ?? null;

  function handleAssetDragStart(event, asset) {
    const payload = {
      kind: "scene-asset",
      source: "asset-library",
      asset: {
        id: asset.id,
        label: asset.id,
        model: asset.model,
        material: { color: 0xffffff, roughness: 0.4, metalness: 0.1 },
      },
    };
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData("application/x-scene-asset", JSON.stringify(payload));
    event.dataTransfer.setData("text/plain", asset.id);
  }

  return (
    <section className="alPanel" role="region" aria-label="Asset Library">

      {/* ── Barre de titre — même style que detailsPanelTitle ── */}
      <div className="alPanelTitle">
        <div className="alPanelTitle__label">
          <svg width="16" height="13" viewBox="0 0 56 46" fill="none" aria-hidden="true" style={{ flexShrink: 0, marginRight: 6 }}>
            <rect x="0" y="0" width="22" height="10" rx="3" fill="rgba(255,79,216,0.7)" />
            <rect x="0" y="8" width="56" height="38" rx="5" fill="rgba(255,79,216,0.22)" stroke="rgba(255,79,216,0.5)" strokeWidth="1.5" />
          </svg>
          {currentFolder ? `Asset Library — ${currentFolder.label}` : "Asset Library"}
        </div>

        <div className="alPanelTitle__nav">
          <button
            type="button"
            className="alNavBtn"
            onClick={() => setCurrentFolderId(null)}
            disabled={!currentFolder}
            title="Retour aux dossiers"
            aria-label="Retour"
          >
            ←
          </button>
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Close
          </button>
        </div>
      </div>

      <div className="alInlineHint">
        {currentFolder ? (
          <>
            <strong>Drag & Drop</strong> — Drag an asset into the scene
          </>
        ) : (
          <>
            Select a folder and then drag an asset into the scene.
          </>
        )}
      </div>

      {/* ── Body scrollable ── */}
      <div className="alBody">
        {!currentFolder ? (
          <div className="alFoldersGrid">
            {folders.map((folder) => (
              <button
                key={folder.id}
                type="button"
                className="alFolderCard"
                onClick={() => setCurrentFolderId(folder.id)}
              >
                <FolderIcon color={folder.color ?? "pink"} />
                <span className="alFolderCard__label">{folder.label}</span>
                <span className="alFolderCard__count">{folder.items.length} assets</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="alAssetsGrid">
            {currentFolder.items.map((asset) => (
              <div
                key={asset.id}
                className="alAssetCard"
                draggable
                onDragStart={(e) => handleAssetDragStart(e, asset)}
                title={`Drag ${asset.label} to scene`}
                role="button"
                tabIndex={0}
              >
                <PrimitiveIcon model={asset.model} />
                <span className="alAssetCard__label">{asset.label}</span>
                <span className="alAssetCard__dragHint" aria-hidden="true">⠿</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}