import {
  DEFAULT_SCENE,
  ensureDirPermission,
  listJsonFiles,
  loadDefaultScene,
  loadSceneByName,
  loadSceneFromHandle,
  pickScenesFolder,
  supportsDirectoryPicker,
} from "../scenes.js";

/**
 * Scene picker controls inside the State folder.
 * @returns {{ currentScene: string, refreshSceneList: Function }}
 */
export function setupScenesUI(folder, ctx) {
  let currentScene = DEFAULT_SCENE;
  let dirHandle = null;
  let fileHandles = new Map();

  const sceneOptions = { [DEFAULT_SCENE]: DEFAULT_SCENE };
  let sceneBinding;

  function rebuildSceneBinding() {
    if (sceneBinding) sceneBinding.dispose();
    sceneBinding = folder
      .addBinding({ scene: currentScene }, "scene", {
        label: "scene",
        options: sceneOptions,
      })
      .on("change", async (e) => {
        await loadSelectedScene(e.value);
      });
  }

  async function loadSelectedScene(name) {
    try {
      const handle = fileHandles.get(name);
      if (handle) {
        await loadSceneFromHandle(handle, ctx);
      } else {
        await loadSceneByName(name, ctx);
      }
      currentScene = name;
      sceneBinding?.refresh();
    } catch (err) {
      console.error(err);
      alert(`Failed to load scene: ${err.message}`);
      sceneBinding?.refresh();
    }
  }

  async function refreshSceneList(handles) {
    fileHandles.clear();
    for (const key of Object.keys(sceneOptions)) {
      delete sceneOptions[key];
    }

    for (const handle of handles) {
      sceneOptions[handle.name] = handle.name;
      fileHandles.set(handle.name, handle);
    }

    if (!sceneOptions[currentScene]) {
      currentScene = handles[0]?.name ?? DEFAULT_SCENE;
      if (!sceneOptions[currentScene]) {
        sceneOptions[DEFAULT_SCENE] = DEFAULT_SCENE;
        currentScene = DEFAULT_SCENE;
      }
    }

    rebuildSceneBinding();
  }

  rebuildSceneBinding();

  folder.addButton({ title: "Reload scene" }).on("click", () => {
    loadSelectedScene(currentScene);
  });

  if (supportsDirectoryPicker()) {
    folder.addButton({ title: "Browse scenes folder" }).on("click", async () => {
      try {
        const picked = await pickScenesFolder();
        if (!picked) return;
        if (!(await ensureDirPermission(picked))) return;

        dirHandle = picked;
        const files = await listJsonFiles(dirHandle);
        if (files.length === 0) {
          alert("No JSON files found in that folder.");
          return;
        }
        await refreshSceneList(files);
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error(err);
        alert(`Failed to open scenes folder: ${err.message}`);
      }
    });
  }

  return {
    currentScene: () => currentScene,
    loadDefault: () => loadDefaultScene(ctx),
  };
}
