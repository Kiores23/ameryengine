import * as THREE from "three";
import {
  DEFAULT_SHADOW_MAP_SIZE,
  MAX_SHADOW_LIGHTS,
} from "../../../constants/lights.js";
export { MAX_SHADOW_LIGHTS };

/**
 * Configure shadow properties for lights that support it.
 */

function enableShadow(light) {
  if (!light.shadow) return light;
  light.castShadow = true;
  light.shadow.mapSize.width = DEFAULT_SHADOW_MAP_SIZE;
  light.shadow.mapSize.height = DEFAULT_SHADOW_MAP_SIZE;
  light.shadow.bias = 0;
  light.shadow.normalBias = 0.05;
  // Soft area for DirectionalLight / SpotLight
  if (light.shadow.camera) {
    const cam = light.shadow.camera;
    if (cam.left !== undefined) {
      // DirectionalLight – orthographic frustum
      cam.left = -10;
      cam.right = 10;
      cam.top = 10;
      cam.bottom = -10;
      cam.near = 0.5;
      cam.far = 30;
    }
    if (light.shadow.radius !== undefined) {
      light.shadow.radius = 3; // PCFSoftShadowMap blur
    }
  }
  return light;
}

/**
 * Creates light objects for the scene
 * @param {string} model - The light type (e.g., "point_light", "directional_light", etc.)
 * @returns {THREE.Light|null} - The created light or null if model type not found
 */
export function createLight(model) {
  switch (model) {
    case "point_light":
      return enableShadow(new THREE.PointLight(0xffffff, 1, 100));

    case "point_light_warm":
      return enableShadow(new THREE.PointLight(0xffd699, 1, 100));

    case "point_light_cool":
      return enableShadow(new THREE.PointLight(0x99d7ff, 1, 100));

    case "directional_light":
      return enableShadow(new THREE.DirectionalLight(0xffffff, 0.8));

    case "directional_light_warm":
      return enableShadow(new THREE.DirectionalLight(0xffd699, 0.8));

    case "directional_light_cool":
      return enableShadow(new THREE.DirectionalLight(0x99d7ff, 0.8));

    case "spot_light":
      return enableShadow(new THREE.SpotLight(0xffffff, 1, 100, Math.PI / 4, 0.5, 2));

    case "spot_light_warm":
      return enableShadow(new THREE.SpotLight(0xffd699, 1, 100, Math.PI / 4, 0.5, 2));

    case "spot_light_cool":
      return enableShadow(new THREE.SpotLight(0x99d7ff, 1, 100, Math.PI / 4, 0.5, 2));

    case "hemisphere_light":
      return new THREE.HemisphereLight(0x87ceeb, 0x1a1a1a, 0.6);

    case "ambient_light":
      return new THREE.AmbientLight(0xffffff, 0.5);

    case "ambient_light_warm":
      return new THREE.AmbientLight(0xffd699, 0.5);

    case "ambient_light_cool":
      return new THREE.AmbientLight(0x99d7ff, 0.5);

    default:
      return null;
  }
}
