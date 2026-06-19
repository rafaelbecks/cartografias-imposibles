import { orderedDitherParams } from "./orderedDitherParams.js";

export function setupOrderedDitherUI(pane, postProcessing, stereoEffects) {
  const folder = pane.addFolder({ title: "Ordered dither (GPU)", expanded: false });

  folder.addBinding(orderedDitherParams, "enabled", { label: "enabled" });

  const settingsFolder = folder.addFolder({ title: "Dither settings", expanded: true });

  settingsFolder.addBinding(orderedDitherParams, "mapSize", {
    label: "matrix size",
    options: {
      "2×2": 2,
      "4×4": 4,
      "8×8": 8,
    },
  });

  settingsFolder.addBinding(orderedDitherParams, "scale", {
    label: "scale",
    min: 0.5,
    max: 8,
    step: 0.5,
  });

  function refresh() {
    const stereoActive = stereoEffects?.isActive?.() ?? false;
    settingsFolder.hidden = !orderedDitherParams.enabled;
    folder.disabled = stereoActive;
    postProcessing?.sync();
  }

  folder.on("change", refresh);
  settingsFolder.on("change", refresh);
  refresh();

  return { refresh };
}
