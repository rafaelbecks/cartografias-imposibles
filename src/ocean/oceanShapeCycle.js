import { oceanParams } from "./oceanParams.js";

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

function ensureOceanEnabled() {
  if (!oceanParams.enabled) oceanParams.enabled = true;
}

/** manglar → torus with procedural noise */
export function applyOceanTorusNoise(oceanSystem) {
  ensureOceanEnabled();
  oceanParams.shape = "torus";
  applyRandomTorusNoise();
  applyRandomEnvelopeRotation();
  oceanParams.envelopeRadius = oceanParams.envelopeRadius === 30 ? 30 : 4.5;
  oceanSystem.sync();
  oceanSystem.snapTorusNoiseMix?.(1);
}

/** cienaga → sphere */
export function applyOceanSphere(oceanSystem) {
  ensureOceanEnabled();
  oceanParams.shape = "sphere";
  disableTorusNoise(oceanSystem);
  clearEnvelopeRotation();
  oceanSystem.sync();
}

/** humedal → flat noise shape */
export function applyOceanFlatNoise(oceanSystem) {
  ensureOceanEnabled();
  oceanParams.shape = "noise";
  disableTorusNoise(oceanSystem);
  clearEnvelopeRotation();
  oceanSystem.sync();
}

/** No-op kept for scene load compatibility. */
export function resetOceanShapeCycle() {}
