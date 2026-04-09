import { loadSceneFromData, serializeScene } from "../scene/sceneRuntime";
import {
  loadSceneJsonFromUrl,
  loadSceneJsonFromFile,
  downloadSceneJson,
} from "../scene/scenePersistence";
import { DEFAULT_SCENE_URL } from "../../constants/appConstants";
import { resetEditorState } from "./sceneState";

export async function replaceSceneFromData(state, sceneData, onProgress) {
  resetEditorState(state);
  await loadSceneFromData(state.scene, state.objectsByName, sceneData, onProgress);
  resetEditorState(state);
}

export async function loadSceneFromUrlIntoState(state, url, onProgress) {
  onProgress?.({ phase: "Fetching scene data…", loaded: 2, total: 5 });
  const sceneData = await loadSceneJsonFromUrl(url);
  onProgress?.({ phase: "Scene data ready…", loaded: 3, total: 5 });
  await replaceSceneFromData(state, sceneData, onProgress);
}

export async function loadSceneFromFileIntoState(state, file, onProgress) {
  console.log("[engine] loading scene from file:", file?.name);
  onProgress?.({ phase: "Reading file…", loaded: 2, total: 5 });
  const sceneData = await loadSceneJsonFromFile(file);
  console.log("[engine] loaded objects:", sceneData?.objects?.length);
  onProgress?.({ phase: "Scene data ready…", loaded: 3, total: 5 });
  await replaceSceneFromData(state, sceneData, onProgress);
}

export async function resetSceneToDefault(state) {
  const defaultSceneData = await loadSceneJsonFromUrl(DEFAULT_SCENE_URL);
  await replaceSceneFromData(state, defaultSceneData);
}

export function saveSceneFromState(state) {
  return serializeScene(state.objectsByName);
}

export function exportSceneFromState(state, filename = "scene.json") {
  const data = serializeScene(state.objectsByName);
  downloadSceneJson(data, filename);
}
