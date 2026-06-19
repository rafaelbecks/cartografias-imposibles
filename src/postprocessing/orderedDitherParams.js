export const ORDERED_DITHER_PARAM_KEYS = ["enabled", "mapSize", "scale"];

export const orderedDitherParams = {
  enabled: false,
  /** Bayer matrix size: 2, 4, or 8 */
  mapSize: 4,
  /** Locked to 0.5 increments by the shader */
  scale: 4,
};

export function clampOrderedDitherParams() {
  const sizes = [2, 4, 8];
  if (!sizes.includes(orderedDitherParams.mapSize)) {
    orderedDitherParams.mapSize = 4;
  }
  orderedDitherParams.scale = Math.max(0.5, Math.round(orderedDitherParams.scale * 2) / 2);
}

/** Voice-triggered preset bundled with the SVG dither cycle. */
export function activateOrderedDitherVoice() {
  clampOrderedDitherParams();
  orderedDitherParams.enabled = true;
  orderedDitherParams.mapSize = 2;
  orderedDitherParams.scale = 4;
}

export function deactivateOrderedDitherVoice() {
  orderedDitherParams.enabled = false;
}
