export function createEngineState() {
  return {
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    tControls: null,
    raf: 0,
    running: false,

    onTransformStart: null,
    onTransformEnd: null,
    onTransformChange: null,
    transformChangeListeners: new Set(),

    focusPos: null,
    focusLook: null,
    focusTarget: null,
    focusTrackedWorldPos: null,

    highlighted: null,
    originalEmissive: new Map(),
    objectsByName: new Map(),

    transformDragging: false,
    transformTargetName: null,

    // Snapping configuration
    translationSnap: 0.5, // Snap every 0.5 units for translation
    rotationSnap: 15, // Snap every 15 degrees for rotation
    scaleSnap: 0.1, // Snap every 0.1 units for scale

    // Precision mode (hold modifier for fine-grained snapping)
    precisionMode: false,
    precisionDivisor: 10, // snap values are divided by this in precision mode
  };
}
