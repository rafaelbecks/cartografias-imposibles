import { Pane } from "tweakpane";
import {
  ENV_FORMAT_OPTIONS,
  getDefaultEnvId,
  getEnvOptions,
  getEnvPath,
  getEnvironments,
  MODEL_OPTIONS,
  params,
} from "./config.js";
import { captureState, downloadState, loadStateFromFile } from "./state.js";
import { setupAnimationUI } from "./terrain/animationUI.js";
import { setupGrainUI } from "./grain/grainUI.js";

export function createUI(ctx) {
  const {
    loadModel,
    loadEnvironment,
    scene,
    renderer,
    light,
    ambient,
    controls,
    modelLoader,
    input,
    camera,
    terrainAnimation,
    grainOverlay,
  } = ctx;

  const pane = new Pane({ title: "Controls" });

  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  if (isMobile) pane.expanded = false;

  const stateFolder = pane.addFolder({ title: "State", expanded: false });

  stateFolder.addButton({ title: "Export JSON" }).on("click", () => {
    downloadState(captureState({ scene, camera, controls }));
  });

  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.accept = "application/json,.json";
  fileInput.hidden = true;
  document.body.appendChild(fileInput);

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    fileInput.value = "";
    if (!file) return;
    try {
      await loadStateFromFile(file, {
        ...ctx,
        ui: { refresh },
        reloadEnvironment,
        loadModel,
      });
    } catch (err) {
      console.error(err);
      alert(`Failed to load state: ${err.message}`);
    }
  });

  stateFolder.addButton({ title: "Load JSON" }).on("click", () => {
    fileInput.click();
  });

  const tab = pane.addTab({
    pages: [{ title: "Scene" }, { title: "Animation" }],
  });

  const scenePage = tab.pages[0];
  const animationPage = tab.pages[1];

  let modelBlade;
  let envBinding;

  function reloadEnvironment() {
    const path = getEnvPath(params.environment, params.envFormat);
    if (path) loadEnvironment(path, params.envFormat);
  }

  function setupEnvironmentControl() {
    const environments = getEnvironments(params.envFormat);
    if (!environments[params.environment]) {
      params.environment = getDefaultEnvId(params.envFormat);
    }
    if (envBinding) envBinding.dispose();
    envBinding = scenePage
      .addBinding(params, "environment", { options: getEnvOptions(params.envFormat) })
      .on("change", reloadEnvironment);
  }

  function refresh() {
    pane.refresh();
    if (modelBlade) modelBlade.value = params.model;
    setupEnvironmentControl();
    grainOverlay.sync();
  }

  modelBlade = scenePage
    .addBlade({
      view: "list",
      label: "model",
      options: MODEL_OPTIONS,
      value: params.model,
    })
    .on("change", (e) => {
      params.model = e.value;
      loadModel(e.value);
    });

  scenePage
    .addBinding(params, "lightIntensity", { min: 0, max: 5 })
    .on("change", (e) => {
      light.intensity = e.value;
    });

  scenePage.addBinding(params, "ambient", { min: 0, max: 2 }).on("change", (e) => {
    ambient.intensity = e.value;
  });

  scenePage.addBinding(params, "exposure", { min: 0.1, max: 3 }).on("change", (e) => {
    renderer.toneMappingExposure = e.value;
  });

  scenePage.addBinding(params, "roughness", { min: 0, max: 1 }).on("change", (e) => {
    modelLoader.setRoughness(e.value);
  });

  scenePage
    .addBinding(params, "envFormat", { label: "env type", options: ENV_FORMAT_OPTIONS })
    .on("change", () => {
      setupEnvironmentControl();
      reloadEnvironment();
    });

  setupEnvironmentControl();

  scenePage.addBinding(scene, "environmentIntensity", {
    label: "env intensity",
    min: 0,
    max: 5,
    step: 0.01,
  });

  scenePage.addBinding(scene.environmentRotation, "y", {
    label: "env rotation Y",
    min: -Math.PI,
    max: Math.PI,
    step: 0.01,
  });

  scenePage
    .addBinding(params, "bgBlur", { min: 0, max: 1, step: 0.01 })
    .on("change", (e) => {
      scene.backgroundBlurriness = e.value;
    });

  scenePage.addBinding(params, "wireframe", { label: "Wireframe" }).on("change", (e) => {
    modelLoader.setWireframe(e.value);
  });

  scenePage.addBinding(params, "fpMove", { label: "First person" }).on("change", (e) => {
    if (!e.value) input.resetMoveState();
  });

  scenePage.addBinding(params, "moveSpeed", {
    label: "move speed",
    min: 1,
    max: 100,
    step: 1,
  });

  scenePage.addBinding(params, "autoRotate").on("change", (e) => {
    controls.autoRotate = e.value;
  });

  scenePage
    .addBinding(params, "rotateSpeed", { min: 0, max: 5, step: 0.1 })
    .on("change", (e) => {
      controls.autoRotateSpeed = e.value;
    });

  scenePage.addBinding(params, "debug", { label: "Show position" }).on("change", (e) => {
    document.getElementById("position").style.display = e.value ? "block" : "none";
  });

  setupAnimationUI(animationPage, terrainAnimation, pane);

  setupGrainUI(pane, grainOverlay);

  return { pane, refresh, reloadEnvironment };
}
