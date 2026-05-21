import { seededRandom } from "./layerSelection.js";

/**
 * @param {import('three').Mesh[]} layers
 * @param {object} config
 * @param {{ maxDistance: number }} spatial
 */
export function computeLayerPhases(layers, config, spatial) {
  const { phaseMode, phaseSpread, seed, radialBias, heightBias } = config;
  const maxDist = Math.max(spatial.maxDistance, 0.001);
  const n = layers.length;

  for (let i = 0; i < n; i++) {
    const meta = layers[i].userData.terrainLayer;
    let phase = 0;

    switch (phaseMode) {
      case "random":
        phase = seededRandom(seed + 31, meta.index) * Math.PI * 2;
        break;
      case "radial": {
        const t = meta.distanceFromCenter / maxDist;
        phase = t * phaseSpread * n * radialBias;
        break;
      }
      case "height":
        phase = meta.normalizedIndex * phaseSpread * n * heightBias;
        break;
      case "index":
      default:
        phase = meta.index * phaseSpread;
    }

    meta.phase = phase;
  }
}
