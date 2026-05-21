import { grainParams } from "./grainParams.js";

export function setupGrainUI(pane, grainOverlay) {
  const folder = pane.addFolder({ title: "Grain overlay", expanded: false });

  folder.addBinding(grainParams, "enabled", { label: "enabled" });
  folder.addBinding(grainParams, "animate", { label: "animated" });
  folder.addBinding(grainParams, "grainOpacity", {
    label: "opacity",
    min: 0,
    max: 0.35,
    step: 0.005,
  });
  folder.addBinding(grainParams, "grainDensity", {
    min: 1,
    max: 4,
    step: 1,
  });
  folder.addBinding(grainParams, "grainChaos", {
    label: "chaos (s)",
    min: 0.1,
    max: 3,
    step: 0.05,
  });
  folder.addBinding(grainParams, "grainSpeed", {
    label: "speed (steps)",
    min: 1,
    max: 60,
    step: 1,
  });

  const advanced = folder.addFolder({ title: "Pattern", expanded: false });
  advanced.addBinding(grainParams, "patternWidth", { min: 50, max: 400, step: 10 });
  advanced.addBinding(grainParams, "patternHeight", { min: 50, max: 400, step: 10 });
  advanced.addBinding(grainParams, "grainWidth", { min: 1, max: 4, step: 1 });
  advanced.addBinding(grainParams, "grainHeight", { min: 1, max: 4, step: 1 });

  const sync = () => grainOverlay.sync();
  folder.on("change", sync);
  advanced.on("change", sync);
}
