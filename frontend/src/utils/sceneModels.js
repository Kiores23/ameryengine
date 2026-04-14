const BASIC_SHAPE_MODELS = new Set([
  "box",
  "sphere",
  "cylinder",
  "cone",
  "plane",
  "disc",
  "tetrahedron",
  "octahedron",
  "icosahedron",
  "dodecahedron",
  "pyramid",
  "tri_prism",
  "hex_prism",
  "pillar",
  "spike",
  "truncated_cone",
  "torus",
  "torus_thick",
  "ring",
  "arc_half",
  "arc_quarter",
  "crystal",
  "ramp",
]);

const LIGHT_MODELS = new Set([
  "point_light",
  "point_light_warm",
  "point_light_cool",
  "directional_light",
  "directional_light_warm",
  "directional_light_cool",
  "spot_light",
  "spot_light_warm",
  "spot_light_cool",
  "hemisphere_light",
  "ambient_light",
  "ambient_light_warm",
  "ambient_light_cool",
]);

const EDITOR_HELPER_MODELS = new Set([
  "navmesh",
]);

function normalizeModelName(model) {
  return String(model ?? "").trim();
}

export function isBasicShapeModel(model) {
  const normalized = normalizeModelName(model);
  return normalized ? BASIC_SHAPE_MODELS.has(normalized) : false;
}

export function isLightModel(model) {
  const normalized = normalizeModelName(model);
  return normalized ? LIGHT_MODELS.has(normalized) : false;
}

export function isEditorHelperModel(model) {
  const normalized = normalizeModelName(model);
  return normalized ? EDITOR_HELPER_MODELS.has(normalized) : false;
}

export function isImportedSceneModel(model) {
  const normalized = normalizeModelName(model);
  if (!normalized) return false;

  return !(
    isBasicShapeModel(normalized) ||
    isLightModel(normalized) ||
    isEditorHelperModel(normalized)
  );
}

export function supportsLiteAlwaysRender(model) {
  return isImportedSceneModel(model);
}

export function shouldRenderSceneObjectInLite(model, liteOptions = {}) {
  if (!isImportedSceneModel(model)) {
    return true;
  }

  return liteOptions?.alwaysRender === true;
}
