import { FLAT_SHAPES } from "./oceanGeometries.js";
import { OCEAN_PARAM_KEYS, oceanParams } from "./oceanParams.js";

let planeBaseline = null;
let sphereAfterTorus = false;

function snapshotOceanParams() {
  return Object.fromEntries(OCEAN_PARAM_KEYS.map((key) => [key, oceanParams[key]]));
}

function restoreOceanParams(snapshot) {
  for (const key of OCEAN_PARAM_KEYS) {
    if (snapshot[key] !== undefined) oceanParams[key] = snapshot[key];
  }
}

function randomAboveHalf(min, max) {
  const mid = (min + max) * 0.5;
  return mid + Math.random() * (max - mid);
}

function applyRandomTorusNoise() {
  oceanParams.torusNoiseEnabled = true;
  oceanParams.torusNoiseAmplitude = randomAboveHalf(0.5, 1);
  oceanParams.torusNoiseScale = randomAboveHalf(0.5, 6);
  oceanParams.torusNoiseOctaves = Math.floor(randomAboveHalf(1, 5));
  oceanParams.torusNoiseSeed = Math.floor(Math.random() * 10000);
}

function applyRandomEnvelopeRotation() {
  oceanParams.envelopeRotationX = Math.random() * Math.PI * 2;
  oceanParams.envelopeRotationY = Math.random() * Math.PI * 2;
  oceanParams.envelopeRotationZ = Math.random() * Math.PI * 2;
}

function clearEnvelopeRotation() {
  oceanParams.envelopeRotationX = 0;
  oceanParams.envelopeRotationY = 0;
  oceanParams.envelopeRotationZ = 0;
}

function disableTorusNoise(oceanSystem) {
  oceanParams.torusNoiseEnabled = false;
  oceanSystem?.snapTorusNoiseMix?.(0);
}

function isCycleShape(shape) {
  return FLAT_SHAPES.has(shape) || shape === "sphere" || shape === "torus";
}

function ensureOceanEnabled() {
  if (!oceanParams.enabled) oceanParams.enabled = true;
}

/** flat/plane → sphere → torus (noised) → sphere → flat (restore baseline) */
export function advanceOceanShapeCycle(oceanSystem) {
  if (!isCycleShape(oceanParams.shape)) return false;

  ensureOceanEnabled();

  const { shape } = oceanParams;

  if (FLAT_SHAPES.has(shape)) {
    planeBaseline = snapshotOceanParams();
    sphereAfterTorus = false;
    oceanParams.shape = "sphere";
    disableTorusNoise(oceanSystem);
    clearEnvelopeRotation();
    oceanParams.envelopeRadius = 30
    oceanSystem.sync();
    return true;
  }

  if (shape === "sphere") {
    if (planeBaseline && sphereAfterTorus) {
      restoreOceanParams(planeBaseline);
      planeBaseline = null;
      sphereAfterTorus = false;
      disableTorusNoise(oceanSystem);
      oceanSystem.sync();
      return true;
    } 

    oceanParams.shape = "torus";
    applyRandomTorusNoise();
    applyRandomEnvelopeRotation();
    oceanParams.envelopeRadius = planeBaseline ? 30 : 4.5;
    oceanSystem.sync();
    oceanSystem.snapTorusNoiseMix?.(1);
    return true;
  }

  if (shape === "torus") {
    oceanParams.shape = "sphere";
    sphereAfterTorus = true;
    disableTorusNoise(oceanSystem);
    clearEnvelopeRotation();
    oceanSystem.sync();
    return true;
  }

  return false;
}

export function resetOceanShapeCycle() {
  planeBaseline = null;
  sphereAfterTorus = false;
}

export function isOceanShapeCycleActive() {
  return planeBaseline !== null || sphereAfterTorus;
}
