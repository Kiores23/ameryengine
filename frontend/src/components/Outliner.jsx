import React, { useMemo, useState, useEffect } from "react";
import { Icon } from "./Icon";
import { OUTLINER_TYPES, OUTLINER_SECTIONS } from "../data/types";
import { ASSET_LIBRARY_FOLDERS } from "../data/assetLibraryRegistry";

function normalizeValue(v) {
  if (v == null) return "";
  return String(v).trim();
}

function nodeSort(a, b) {
  const oa = Number.isFinite(a?.order) ? a.order : 999999;
  const ob = Number.isFinite(b?.order) ? b.order : 999999;

  if (oa !== ob) return oa - ob;

  const la = String(a?.label ?? "");
  const lb = String(b?.label ?? "");
  const c = la.localeCompare(lb, undefined, { sensitivity: "base" });
  if (c !== 0) return c;

  return String(a?.id ?? "").localeCompare(String(b?.id ?? ""), undefined, {
    sensitivity: "base",
  });
}

function buildTypeConfigMap(typesConfig = []) {
  const map = new Map();

  for (const t of typesConfig || []) {
    if (!t) continue;

    const key = String(t.key ?? "");
    if (!key) continue;

    map.set(key, t);
  }

  return map;
}

function buildSectionConfigMap(sectionsConfig = []) {
  const map = new Map();

  for (const s of sectionsConfig || []) {
    if (!s) continue;

    const typeKey = String(s.type ?? "");
    if (!typeKey) continue;

    if (!map.has(typeKey)) map.set(typeKey, new Map());
    map.get(typeKey).set(String(s.key ?? ""), s);
  }

  return map;
}

export default function Outliner({
  nodes,
  sceneObjects = [],
  selectedId,
  selectedSceneObjectName,
  onSelect,
  onSelectSceneObject,
  editorMode,
  typesConfig = OUTLINER_TYPES,
  sectionsConfig = OUTLINER_SECTIONS,
}) {
  const {
    rootNodes,
    orderedTypeKeys,
    groupedByType,
    typeCfgMap,
    sectionCfgMap,
    sceneObjectsByModel,
    sceneObjectsCount,
  } = useMemo(() => {
    const rootNodes = [];
    const groupedByType = new Map();
  
    for (const n of nodes || []) {
      if (!n) continue;
  
      const typeKey = normalizeValue(n.type);
  
      if (!typeKey) {
        rootNodes.push(n);
        continue;
      }
  
      if (!groupedByType.has(typeKey)) {
        groupedByType.set(typeKey, {
          directNodes: [],
          sections: new Map(),
        });
      }
  
      const typeEntry = groupedByType.get(typeKey);
      const sectionKey = normalizeValue(n.section);
  
      if (!sectionKey) {
        typeEntry.directNodes.push(n);
      } else {
        if (!typeEntry.sections.has(sectionKey)) {
          typeEntry.sections.set(sectionKey, []);
        }
        typeEntry.sections.get(sectionKey).push(n);
      }
    }
  
    rootNodes.sort(nodeSort);
  
    for (const [, typeEntry] of groupedByType) {
      typeEntry.directNodes.sort(nodeSort);
      for (const [, arr] of typeEntry.sections) {
        arr.sort(nodeSort);
      }
    }
  
    const typeCfgMap = buildTypeConfigMap(typesConfig);
    const sectionCfgMap = buildSectionConfigMap(sectionsConfig);
  
    const presentTypes = Array.from(groupedByType.keys());
  
    const configuredPresent = presentTypes
      .filter((k) => typeCfgMap.has(k))
      .sort((a, b) => {
        const oa = Number(typeCfgMap.get(a)?.order ?? 9999);
        const ob = Number(typeCfgMap.get(b)?.order ?? 9999);
        if (oa !== ob) return oa - ob;
        return a.localeCompare(b, undefined, { sensitivity: "base" });
      });
  
    const unconfiguredPresent = presentTypes
      .filter((k) => !typeCfgMap.has(k))
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
  
    const orderedTypeKeys = [...configuredPresent, ...unconfiguredPresent];

    // -------- objets de scène runtime --------
    const assignedTargets = new Set(
      (nodes || [])
        .map((n) => normalizeValue(n?.target))
        .filter(Boolean)
    );
    
    const unassignedSceneObjects = (sceneObjects || []).filter((obj) => {
      const objectName = normalizeValue(obj?.name);
      if (!objectName) return false;
      return !assignedTargets.has(objectName);
    });
  
    const sceneObjectsByModel = new Map();
  
    for (const obj of unassignedSceneObjects) {
      const modelKey = normalizeValue(obj?.model) || "unknown";
  
      if (!sceneObjectsByModel.has(modelKey)) {
        sceneObjectsByModel.set(modelKey, []);
      }
  
      sceneObjectsByModel.get(modelKey).push(obj);
    }
  
    for (const [, arr] of sceneObjectsByModel) {
      arr.sort((a, b) =>
        String(a?.name ?? "").localeCompare(String(b?.name ?? ""), undefined, {
          sensitivity: "base",
        })
      );
    }
  
    return {
      rootNodes,
      orderedTypeKeys,
      groupedByType,
      typeCfgMap,
      sectionCfgMap,
      sceneObjectsByModel,
      sceneObjectsCount: unassignedSceneObjects.length,
    };
  }, [nodes, sceneObjects, typesConfig, sectionsConfig]);

  // Créer un mapping modèle -> groupe d'asset
  const buildModelToFolderMap = () => {
    const map = new Map();
    for (const folder of ASSET_LIBRARY_FOLDERS) {
      for (const item of folder.items || []) {
        map.set(normalizeValue(item.model), {
          folderId: folder.id,
          folderLabel: folder.label,
        });
      }
    }
    return map;
  };

  const modelToFolderMap = useMemo(() => buildModelToFolderMap(), []);

  // Réorganiser les sceneObjects par folder puis par model
  const sceneObjectsByFolderAndModel = useMemo(() => {
    const map = new Map();

    for (const [modelKey, objects] of sceneObjectsByModel) {
      const folderInfo = modelToFolderMap.get(modelKey) || {
        folderId: "uncategorized",
        folderLabel: "Other",
      };

      if (!map.has(folderInfo.folderId)) {
        map.set(folderInfo.folderId, {
          label: folderInfo.folderLabel,
          models: new Map(),
        });
      }

      map.get(folderInfo.folderId).models.set(modelKey, objects);
    }

    return map;
  }, [sceneObjectsByModel, modelToFolderMap]);

  const [open, setOpen] = useState(() => {
    const init = {};
  
    for (const typeKey of orderedTypeKeys) {
      init[`type:${typeKey}`] = !!typeCfgMap.get(typeKey)?.open;
  
      const typeSections = groupedByType.get(typeKey)?.sections;
      if (typeSections) {
        const cfgForType = sectionCfgMap.get(typeKey) || new Map();
  
        for (const sectionKey of typeSections.keys()) {
          init[`section:${typeKey}:${sectionKey}`] = !!cfgForType.get(sectionKey)?.open;
        }
      }
    }
  
    init["sceneObjects"] = false;
  
    for (const folderId of sceneObjectsByFolderAndModel.keys()) {
      init[`sceneObjects:folder:${folderId}`] = false;

      const folderEntry = sceneObjectsByFolderAndModel.get(folderId);
      for (const modelKey of folderEntry.models.keys()) {
        init[`sceneObjects:folder:${folderId}:model:${modelKey}`] = false;
      }
    }
  
    return init;
  });

  useEffect(() => {
    setOpen((prev) => {
      const next = { ...prev };
  
      for (const typeKey of orderedTypeKeys) {
        const typeOpenKey = `type:${typeKey}`;
        if (next[typeOpenKey] === undefined) {
          next[typeOpenKey] = !!typeCfgMap.get(typeKey)?.open;
        }
  
        const typeSections = groupedByType.get(typeKey)?.sections;
        const cfgForType = sectionCfgMap.get(typeKey) || new Map();
  
        if (typeSections) {
          for (const sectionKey of typeSections.keys()) {
            const sectionOpenKey = `section:${typeKey}:${sectionKey}`;
            if (next[sectionOpenKey] === undefined) {
              next[sectionOpenKey] = !!cfgForType.get(sectionKey)?.open;
            }
          }
        }
      }
  
      if (next["sceneObjects"] === undefined) {
        next["sceneObjects"] = false;
      }
  
      for (const folderId of sceneObjectsByFolderAndModel.keys()) {
        const folderKey = `sceneObjects:folder:${folderId}`;
        if (next[folderKey] === undefined) {
          next[folderKey] = false;
        }

        const folderEntry = sceneObjectsByFolderAndModel.get(folderId);
        for (const modelKey of folderEntry.models.keys()) {
          const modelKey_full = `sceneObjects:folder:${folderId}:model:${modelKey}`;
          if (next[modelKey_full] === undefined) {
            next[modelKey_full] = false;
          }
        }
      }
  
      return next;
    });
  }, [orderedTypeKeys, groupedByType, typeCfgMap, sectionCfgMap, sceneObjectsByFolderAndModel]);

  const toggle = (key) => {
    setOpen((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const getTypeLabel = (typeKey) => {
    return typeCfgMap.get(typeKey)?.label || typeKey;
  };

  const getSectionMeta = (typeKey, sectionKey) => {
    const cfg = sectionCfgMap.get(typeKey)?.get(sectionKey);
    return {
      label: cfg?.label || sectionKey,
      order: Number.isFinite(cfg?.order) ? cfg.order : 9999,
    };
  };

  const hasSceneObjectSelection = !!selectedSceneObjectName;

  return (
    <div className="outliner">
      {rootNodes.length > 0 && (
        <div className="rootBlock">
          {rootNodes.map((n) => (
            <NodeItem
              key={n.id}
              node={n}
              active={!hasSceneObjectSelection && n.id === selectedId}
              onClick={() => onSelect(n.id)}
            />
          ))}
        </div>
      )}

      {orderedTypeKeys.map((typeKey) => {
        const typeEntry = groupedByType.get(typeKey);
        if (!typeEntry) return null;

        const directNodes = typeEntry.directNodes || [];
        const sectionsMap = typeEntry.sections || new Map();

        const orderedSections = Array.from(sectionsMap.keys()).sort((a, b) => {
          const sa = getSectionMeta(typeKey, a);
          const sb = getSectionMeta(typeKey, b);
          if (sa.order !== sb.order) return sa.order - sb.order;
          return sa.label.localeCompare(sb.label, undefined, { sensitivity: "base" });
        });

        const totalCount =
          directNodes.length +
          orderedSections.reduce(
            (sum, sectionKey) => sum + (sectionsMap.get(sectionKey)?.length || 0),
            0
          );

        if (totalCount === 0) return null;

        const typeOpenKey = `type:${typeKey}`;

        return (
          <Group
            key={typeKey}
            title={getTypeLabel(typeKey)}
            count={totalCount}
            open={!!open[typeOpenKey]}
            onToggle={() => toggle(typeOpenKey)}
          >
            {orderedSections.map((sectionKey) => {
              const sectionNodes = sectionsMap.get(sectionKey) || [];
              if (sectionNodes.length === 0) return null;

              const sectionOpenKey = `section:${typeKey}:${sectionKey}`;
              const sectionMeta = getSectionMeta(typeKey, sectionKey);

              return (
                <SubGroup
                  key={`${typeKey}:${sectionKey}`}
                  title={sectionMeta.label}
                  count={sectionNodes.length}
                  open={!!open[sectionOpenKey]}
                  onToggle={() => toggle(sectionOpenKey)}
                >
                  {sectionNodes.map((n) => (
                    <NodeItem
                      key={n.id}
                      node={n}
                      active={!hasSceneObjectSelection && n.id === selectedId}
                      onClick={() => onSelect(n.id)}
                      nested
                    />
                  ))}
                </SubGroup>
              );
            })}

            {directNodes.map((n) => (
              <NodeItem
                key={n.id}
                node={n}
                active={!hasSceneObjectSelection && n.id === selectedId}
                onClick={() => onSelect(n.id)}
              />
            ))}
          </Group>
        );
      })}

      {editorMode && sceneObjectsCount > 0 && (
        <Group
          title="Scene Objects"
          count={sceneObjectsCount}
          open={!!open["sceneObjects"]}
          onToggle={() => toggle("sceneObjects")}
          variant="scene"
        >
          {Array.from(sceneObjectsByFolderAndModel.keys())
            .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
            .map((folderId) => {
              const folderEntry = sceneObjectsByFolderAndModel.get(folderId);
              const folderOpenKey = `sceneObjects:folder:${folderId}`;
              const totalCount = Array.from(folderEntry.models.values()).reduce(
                (sum, objects) => sum + objects.length,
                0
              );

              return (
                <SubGroup
                  key={folderId}
                  title={folderEntry.label}
                  count={totalCount}
                  open={!!open[folderOpenKey]}
                  onToggle={() => toggle(folderOpenKey)}
                  variant="scene"
                >
                  {Array.from(folderEntry.models.keys())
                    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
                    .map((modelKey) => {
                      const objects = folderEntry.models.get(modelKey) || [];
                      if (!objects.length) return null;

                      const modelOpenKey = `sceneObjects:folder:${folderId}:model:${modelKey}`;

                      return (
                        <SubGroup
                          key={`${folderId}:${modelKey}`}
                          title={modelKey}
                          count={objects.length}
                          open={!!open[modelOpenKey]}
                          onToggle={() => toggle(modelOpenKey)}
                          variant="scene"
                          nested
                        >
                          {objects.map((obj) => (
                            <SceneObjectItem
                              key={obj.name}
                              object={obj}
                              active={selectedSceneObjectName === obj.name}
                              onClick={() => onSelectSceneObject?.(obj.name)}
                            />
                          ))}
                        </SubGroup>
                      );
                    })}
                </SubGroup>
              );
            })}
        </Group>
      )}
    </div>
  );
}

function Group({ title, count, open, onToggle, children, variant = "default" }) {
  return (
    <div className={"ogroup" + (variant === "scene" ? " ogroup--scene" : "")}>
      <button
        className={"orow oheader" + (open ? " isOpen" : "") + (variant === "scene" ? " oheader--scene" : "")}
        onClick={onToggle}
        type="button"
      >
        <span className="ogutter">
          <span className="ocaret" aria-hidden="true">
            {open ? "▾" : "▸"}
          </span>
        </span>

        <Icon name="folder" className="osvg" />
        <span className="otext">{title}</span>
        <span className="obadge">{count}</span>
      </button>

      {open && <div className="obody">{children}</div>}
    </div>
  );
}

function SubGroup({ title, count, open, onToggle, children, variant = "default", nested = false }) {
  return (
    <div className={"osubgroup" + (variant === "scene" ? " osubgroup--scene" : "") + (nested ? " osubgroup--nested" : "")}>
      <button
        className={"orow osubheader" + (open ? " isOpen" : "") + (variant === "scene" ? " osubheader--scene" : "") + (nested ? " osubheader--nested" : "")}
        onClick={onToggle}
        type="button"
      >
        <span className="ogutter">
          <span className="ocaret" aria-hidden="true">
            {open ? "▾" : "▸"}
          </span>
        </span>

        <Icon name="folder" className="osvg" />
        <span className="otext">{title}</span>
        <span className="obadge">{count}</span>
      </button>

      {open && <div className="osubbody">{children}</div>}
    </div>
  );
}

function NodeItem({ node, active, onClick, nested = false }) {
  const iconName = node.icon || "file";

  return (
    <button
      className={"orow onode" + (active ? " active" : "") + (nested ? " onode--nested" : "")}
      onClick={onClick}
      type="button"
    >
      <span className="ogutter">
        <span className="ocaret spacer" aria-hidden="true">
          ▸
        </span>
      </span>

      <Icon name={iconName} className="osvg" />
      <span className="otext">{node.label}</span>
    </button>
  );
}

function SceneObjectItem({ object, active, onClick }) {
  return (
    <button
      className={"orow onode onode--nested" + (active ? " active" : "")}
      type="button"
      onClick={onClick}
    >
      <span className="ogutter">
        <span className="ocaret spacer" aria-hidden="true">
          ▸
        </span>
      </span>

      <Icon name="file" className="osvg" />
      <span className="otext">{object.name}</span>
    </button>
  );
}