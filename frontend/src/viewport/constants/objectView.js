export const OBJECT_VIEW_REFERENCE_SIZE = 1;

export function getObjectViewScale(size) {
  return Math.max(1, size / OBJECT_VIEW_REFERENCE_SIZE);
}

export const OBJECT_VIEW_CAMERA_DISTANCE = 1.8;
export const OBJECT_VIEW_CAMERA_HEIGHT_OFFSET = 0.5;
