import * as THREE from "three";
import { animationParams } from "./animationParams.js";
import { analyzeTerrainLayers } from "./layerAnalysis.js";
import { computeLayerSelection, seededRandom } from "./layerSelection.js";
import { computeLayerPhases } from "./phaseSystem.js";
import { applyMotion } from "./motions.js";

const _highlightColor = new THREE.Color(0x6ec8ff);
const _defaultEmissive = new THREE.Color();

/**
 * Layer animation orchestrator — runs in requestAnimationFrame, no per-mesh GSAP.
 */
export function createTerrainAnimation() {
  let layers = [];
  let spatial = { terrainCenter: new THREE.Vector3(), maxDistance: 1, maxHeight: 1 };
  let selectionCache = [];
  let debugMaterials = new Map();

  function refreshSelectionAndPhases() {
    if (layers.length === 0) return;

    selectionCache = computeLayerSelection(layers, animationParams);
    computeLayerPhases(layers, animationParams, spatial);

    for (let i = 0; i < layers.length; i++) {
      const meta = layers[i].userData.terrainLayer;
      meta.selected = selectionCache[i];
    }

    updateDebugHighlight();
  }

  function storeOriginalMaterialState(mesh) {
    const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
    debugMaterials.set(mesh, mats.map((m) => ({
      emissive: m.emissive?.clone(),
      emissiveIntensity: m.emissiveIntensity ?? 0,
    })));
  }

  function updateDebugHighlight() {
    const show = animationParams.showSelectedLayers;
    for (const mesh of layers) {
      const meta = mesh.userData.terrainLayer;
      if (!meta) continue;
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      const stored = debugMaterials.get(mesh);
      if (!stored) continue;

      mats.forEach((mat, i) => {
        if (!mat.emissive) return;
        if (show && meta.selected) {
          mat.emissive.copy(_highlightColor);
          mat.emissiveIntensity = 0.35;
        } else if (stored[i]) {
          if (stored[i].emissive) mat.emissive.copy(stored[i].emissive);
          else mat.emissive.copy(_defaultEmissive);
          mat.emissiveIntensity = stored[i].emissiveIntensity;
        }
      });
    }
  }

  function resetLayers() {
    for (const mesh of layers) {
      const meta = mesh.userData.terrainLayer;
      if (!meta) continue;
      mesh.position.copy(meta.originalPosition);
      mesh.rotation.copy(meta.originalRotation);
      mesh.scale.copy(meta.originalScale);
    }
    updateDebugHighlight();
  }

  function bindModel(root) {
    dispose();
    if (!root) {
      layers = [];
      return;
    }

    const analysis = analyzeTerrainLayers(root);
    layers = analysis.layers;
    spatial = {
      terrainCenter: analysis.terrainCenter,
      maxDistance: analysis.maxDistance,
      maxHeight: analysis.maxHeight,
    };

    debugMaterials.clear();
    for (const mesh of layers) {
      storeOriginalMaterialState(mesh);
    }

    refreshSelectionAndPhases();
    console.info(
      `[terrain] ${layers.length} layers detected`,
      layers.map((m) => m.userData.terrainLayer.name)
    );
  }

  function randomizeSelectionSeed() {
    animationParams.seed = Math.floor(Math.random() * 100000);
    refreshSelectionAndPhases();
  }

  function update(elapsed) {
    if (!animationParams.playing || layers.length === 0) return;

    const time = elapsed;
    const { randomness, seed } = animationParams;

    for (const mesh of layers) {
      const meta = mesh.userData.terrainLayer;
      if (!meta) continue;

      mesh.position.copy(meta.originalPosition);
      mesh.rotation.copy(meta.originalRotation);
      mesh.scale.copy(meta.originalScale);

      if (!meta.selected) continue;

      const jitter =
        randomness > 0
          ? seededRandom(seed, meta.index * 13) * randomness
          : 0;

      applyMotion(mesh, time, animationParams, jitter);
    }
  }

  function dispose() {
    resetLayers();
    layers = [];
    debugMaterials.clear();
  }

  return {
    bindModel,
    update,
    resetLayers,
    refreshSelectionAndPhases,
    randomizeSelectionSeed,
    dispose,
    getLayers: () => layers,
    getLayerCount: () => layers.length,
  };
}
