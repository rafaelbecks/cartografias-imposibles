/** Seeded pseudo-random in [0, 1). */
export function seededRandom(seed, index) {
  const x = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * @param {import('three').Mesh[]} layers
 * @param {object} config
 * @returns {boolean[]}
 */
export function computeLayerSelection(layers, config) {
  const n = layers.length;
  const selected = new Array(n).fill(false);

  if (n === 0) return selected;

  const {
    selectionMode,
    percentage,
    seed,
    nthStep,
    invertSelection,
  } = config;

  const pct = THREE_CLAMP(percentage / 100, 0, 1);
  const step = Math.max(1, Math.floor(nthStep));

  switch (selectionMode) {
    case "all":
      selected.fill(true);
      break;

    case "percentage": {
      const count = Math.max(1, Math.round(n * pct));
      for (let i = 0; i < count; i++) selected[i] = true;
      break;
    }

    case "random": {
      const count = Math.max(1, Math.round(n * pct));
      const order = layers
        .map((layer, i) => ({
          i,
          r: seededRandom(seed, layer.userData.terrainLayer.index + i * 17),
        }))
        .sort((a, b) => a.r - b.r);
      for (let k = 0; k < count; k++) selected[order[k].i] = true;
      break;
    }

    case "outsideToInside": {
      const ranked = layers
        .map((layer, i) => ({
          i,
          d: layer.userData.terrainLayer.distanceFromCenter,
        }))
        .sort((a, b) => b.d - a.d);
      const count = Math.max(1, Math.round(n * pct));
      for (let k = 0; k < count; k++) selected[ranked[k].i] = true;
      break;
    }

    case "insideToOutside": {
      const ranked = layers
        .map((layer, i) => ({
          i,
          d: layer.userData.terrainLayer.distanceFromCenter,
        }))
        .sort((a, b) => a.d - b.d);
      const count = Math.max(1, Math.round(n * pct));
      for (let k = 0; k < count; k++) selected[ranked[k].i] = true;
      break;
    }

    case "everyNth":
      for (let i = 0; i < n; i++) {
        if (i % step === 0) selected[i] = true;
      }
      break;

    default:
      selected.fill(true);
  }

  if (invertSelection) {
    for (let i = 0; i < n; i++) selected[i] = !selected[i];
  }

  return selected;
}

function THREE_CLAMP(v, min, max) {
  return Math.max(min, Math.min(max, v));
}
