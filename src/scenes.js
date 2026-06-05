import { loadStateFromFile, loadStateFromUrl } from "./state.js";

export const DEFAULT_SCENE = "memory.json";
export const SCENES_BASE = "./scenes/";

export function sceneUrl(name) {
  return `${SCENES_BASE}${name}`;
}

export async function loadSceneByName(name, ctx) {
  return loadStateFromUrl(sceneUrl(name), ctx);
}

export async function loadDefaultScene(ctx) {
  return loadSceneByName(DEFAULT_SCENE, ctx);
}

export function supportsDirectoryPicker() {
  return typeof window.showDirectoryPicker === "function";
}

/** List `.json` files in a directory handle (File System Access API). */
export async function listJsonFiles(dirHandle) {
  const files = [];
  for await (const entry of dirHandle.values()) {
    if (entry.kind === "file" && entry.name.endsWith(".json")) {
      files.push(entry);
    }
  }
  return files.sort((a, b) => a.name.localeCompare(b.name));
}

/** Prompt the user to pick the scenes folder; returns a handle or null. */
export async function pickScenesFolder() {
  if (!supportsDirectoryPicker()) return null;
  return window.showDirectoryPicker({ mode: "read" });
}

/** Ensure read permission on a previously granted directory handle. */
export async function ensureDirPermission(dirHandle) {
  const opts = { mode: "read" };
  if ((await dirHandle.queryPermission(opts)) === "granted") return true;
  return (await dirHandle.requestPermission(opts)) === "granted";
}

export async function loadSceneFromHandle(fileHandle, ctx) {
  const file = await fileHandle.getFile();
  return loadStateFromFile(file, ctx);
}
