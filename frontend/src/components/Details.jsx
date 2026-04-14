import { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks";
import { OUTLINER_TYPES, OUTLINER_SECTIONS } from "../data/types";

function normalizeValue(v) {
  return String(v ?? "").trim().toLowerCase();
}

function buildTypeMeta(typesConfig = OUTLINER_TYPES) {
  const map = new Map();

  (typesConfig || []).forEach((t, index) => {
    if (!t) return;

    map.set(String(t.key ?? ""), {
      key: String(t.key ?? ""),
      label: t.label || t.key || "",
      order: Number.isFinite(t.order) ? t.order : index,
    });
  });

  return map;
}

function buildSectionMeta(sectionsConfig = OUTLINER_SECTIONS) {
  const map = new Map();

  (sectionsConfig || []).forEach((s, index) => {
    if (!s) return;

    const typeKey = String(s.type ?? "");
    if (!typeKey) return;

    if (!map.has(typeKey)) map.set(typeKey, new Map());

    map.get(typeKey).set(String(s.key ?? ""), {
      key: String(s.key ?? ""),
      label: s.label || s.key || "",
      order: Number.isFinite(s.order) ? s.order : index,
    });
  });

  return map;
}

function resolveTagToNode(tag, byId, byLabel) {
  if (!tag) return null;

  if (typeof tag === "string") {
    return byId.get(tag) || byLabel.get(normalizeValue(tag)) || null;
  }

  if (typeof tag === "object") {
    if (tag.id && byId.get(tag.id)) return byId.get(tag.id);
    if (tag.target && byId.get(tag.target)) return byId.get(tag.target);
    if (tag.label && byLabel.get(normalizeValue(tag.label))) {
      return byLabel.get(normalizeValue(tag.label));
    }
  }

  return null;
}

function getTagDisplayLabel(tag) {
  if (typeof tag === "string") return tag;
  return tag?.label || tag?.id || tag?.target || "Unknown";
}

export default function Details({
  node,
  nodes = [],
  onSelect,
  onFocus,
  onOpenDemo,
  editorMode,
  editorAvailable = true,
  onOpenEdit,
  onBack,
  onForward,
  canGoBack = false,
  canGoForward = false,
  typesConfig = OUTLINER_TYPES,
}) {
  const groupedTags = useMemo(() => {
    if (!node?.tags?.length) return [];

    const byId = new Map();
    const byLabel = new Map();
    const typeMeta = buildTypeMeta(typesConfig);
    const sectionMeta = buildSectionMeta(OUTLINER_SECTIONS);

    for (const n of nodes) {
      if (!n) continue;
      byId.set(n.id, n);
      byLabel.set(normalizeValue(n.label), n);
    }

    const groups = new Map();

    for (const rawTag of node.tags) {
      const resolvedNode = resolveTagToNode(rawTag, byId, byLabel);
      const displayLabel = getTagDisplayLabel(rawTag);

      const typeKey = resolvedNode?.type || "__ungrouped__";
      const sectionKey = resolvedNode?.section || "";

      const typeLabel = resolvedNode?.type
        ? (typeMeta.get(String(resolvedNode.type))?.label || resolvedNode.type)
        : "Tags";

      const sectionCfg = resolvedNode?.type
        ? sectionMeta.get(String(resolvedNode.type))?.get(String(sectionKey))
        : null;

      const sectionLabel = sectionCfg?.label || sectionKey;
      const sectionOrder = sectionCfg?.order ?? 9999;

      const groupLabel =
        resolvedNode?.type
          ? (sectionKey ? sectionLabel : typeLabel)
          : "Tags";

      const groupOrder =
        resolvedNode?.type
          ? (typeMeta.get(String(resolvedNode.type))?.order ?? 9999)
          : 99999;

      const compositeGroupKey = `${typeKey}::${sectionKey || "__root__"}`;

      if (!groups.has(compositeGroupKey)) {
        groups.set(compositeGroupKey, {
          key: compositeGroupKey,
          label: groupLabel,
          order: groupOrder,
          sectionOrder,
          items: [],
        });
      }

      groups.get(compositeGroupKey).items.push({
        key: resolvedNode?.id || `${compositeGroupKey}:${displayLabel}`,
        label: displayLabel,
        nodeId: resolvedNode?.id || null,
      });
    }

    return Array.from(groups.values()).sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      if (a.sectionOrder !== b.sectionOrder) return a.sectionOrder - b.sectionOrder;
      return 0;
    });
  }, [node, nodes, typesConfig]);

  return (
    <>
      <div className="panel__title detailsPanelTitle">
        <div className="detailsPanelTitle__label">Details</div>
      
        <div className="detailsPanelTitle__nav">
          <button
            type="button"
            className="detailsNavBtn"
            onClick={onBack}
            disabled={!canGoBack}
            title="Revenir en arrière"
            aria-label="Revenir en arrière"
          >
            ←
          </button>
      
          <button
            type="button"
            className="detailsNavBtn"
            onClick={onForward}
            disabled={!canGoForward}
            title="Aller en avant"
            aria-label="Aller en avant"
          >
            →
          </button>
        </div>
      </div>

      <div className="panel__body">
        {!node ? (
          <p className="hint">Sélectionne un élément dans l’Outliner ou Projects.</p>
        ) : (
          <div className="detailsCard">
            <div className="details__header">
              <div className="details__headerMain">
                <span className="details__eyebrow">Portfolio Overview</span>
                <h3 className="details__title">{node.label}</h3>
              </div>

              <span className="details__type">{node.type}</span>
            </div>

            <div className="details__hero" key={node.id}>
              <div className="details__heroHighlight" />

              <ReactMarkdown remarkPlugins={[remarkBreaks]}>
                {node.description || ""}
              </ReactMarkdown>
            </div>

            {!!groupedTags.length && (
              <div className="tagsPanel">
                {groupedTags.map((group) => (
                  <div key={group.key} className="tagGroup">
                    <div className="tagGroup__label">{group.label}</div>

                    <div className="tagGroup__list">
                      {group.items.map((tag) => {
                        const clickable = !!tag.nodeId;

                        return (
                          <button
                            key={tag.key}
                            type="button"
                            className={
                              "tag tag--interactive" + (clickable ? "" : " tag--disabled")
                            }
                            onClick={() => clickable && onSelect?.(tag.nodeId)}
                            disabled={!clickable}
                            title={
                              clickable
                                ? `Open ${tag.label}`
                                : `${tag.label} n'est pas encore relié à un élément`
                            }
                          >
                            {tag.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="actions">
              <button className="btn btn--ghost" onClick={onFocus}>
                Focus
              </button>

              {editorMode && (
                <button className="btn btn--ghost" onClick={onOpenEdit}>
                  Edit
                </button>
              )}
            </div>

            {!editorMode && editorAvailable && (
              <p className="hint">
                Tip: Activate <b>Editor Mode</b> to manipulate the object if needed.
              </p>
            )}

            {!editorMode && !editorAvailable && (
              <p className="hint">
                Lite mode is active, so the editor is hidden for this view.
              </p>
            )}
          </div>
        )}  
      </div>
    </>
  );
}
