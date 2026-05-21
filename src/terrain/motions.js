import * as THREE from "three";
import { seededRandom } from "./layerSelection.js";

const _offset = new THREE.Vector3();
const _euler = new THREE.Euler();

/** Smooth organic easing — avoids linear robotic motion. */
function organicWave(t) {
  return Math.sin(t) * 0.72 + Math.sin(t * 0.47 + 0.6) * 0.28;
}

function layeredNoise(seed, index, time) {
  const a = seededRandom(seed, index * 3.1);
  const b = seededRandom(seed + 7, index * 5.7);
  return (
    Math.sin(time * (0.7 + a * 0.6) + index * 0.41 + b * 6.28) * 0.55 +
    Math.sin(time * (1.3 + b * 0.4) + index * 0.17) * 0.3 +
    Math.cos(time * 0.35 + a * 4) * 0.15
  );
}

/**
 * @param {import('three').Mesh} mesh
 * @param {number} time
 * @param {object} params
 * @param {number} layerJitter
 */
export function applyMotion(mesh, time, params, layerJitter = 0) {
  const meta = mesh.userData.terrainLayer;
  if (!meta?.selected) return;

  const {
    motionType,
    amplitude,
    frequency,
    speed,
    axisX,
    axisY,
    axisZ,
    randomness,
  } = params;

  const phase = meta.phase + layerJitter;
  const t = time * speed * frequency + phase;
  const amp = amplitude * (1 + (layerJitter - 0.5) * randomness * 0.5);
  const ax = axisX;
  const ay = axisY;
  const az = axisZ;

  _offset.set(0, 0, 0);
  _euler.set(0, 0, 0);

  const wave = organicWave(t);
  const wave2 = organicWave(t * 1.618 + meta.normalizedIndex * 2.1);
  const drift = Math.sin(t * 0.23 + meta.normalizedIndex * 1.7) * 0.4 + wave * 0.6;

  switch (motionType) {
    case "sine":
      _offset.set(wave * amp * ax, wave2 * amp * ay, wave * amp * az * 0.5);
      break;

    case "harmonic": {
      const h1 = organicWave(t);
      const h2 = organicWave(t * 2.03 + 1.2) * 0.45;
      const h3 = organicWave(t * 0.51 - 0.8) * 0.3;
      const combined = (h1 + h2 + h3) / 1.75;
      _offset.set(
        combined * amp * ax,
        (h1 * 0.6 + h2 * 0.4) * amp * ay,
        combined * amp * az * 0.35
      );
      _euler.z = h2 * amp * 0.08 * ax;
      break;
    }

    case "verticalDrift": {
      const slow = Math.sin(t * 0.31 + meta.normalizedIndex * 3.14) * amp * ay;
      const breathe = organicWave(t * 0.85) * amp * ay * 0.35;
      _offset.set(drift * amp * ax * 0.25, slow + breathe, drift * amp * az * 0.2);
      break;
    }

    case "tectonic": {
      const shear = organicWave(t + meta.normalizedIndex);
      const lateral = Math.sin(t * 0.62 + phase * 0.3) * amp;
      const radialDir = meta.center.clone().normalize();
      if (radialDir.lengthSq() < 1e-6) radialDir.set(1, 0, 0);
      _offset.set(
        radialDir.x * lateral * ax + shear * amp * ax * 0.3,
        organicWave(t * 0.4) * amp * ay * 0.15,
        radialDir.z * lateral * az + shear * amp * az * 0.3
      );
      _euler.y = shear * amp * 0.12;
      _euler.x = organicWave(t * 0.55) * amp * 0.04;
      break;
    }

    case "dissolve": {
      const falloff = 0.5 + 0.5 * Math.sin(t * 0.5 + meta.normalizedIndex * Math.PI);
      const lift = (1 - falloff) * amp * ay * 2;
      const spread = organicWave(t + phase) * amp;
      _offset.set(spread * ax, lift + spread * ay * 0.3, spread * az);
      const scale = 1 - (1 - falloff) * amp * 0.35;
      mesh.scale.copy(meta.originalScale).multiplyScalar(
        THREE.MathUtils.clamp(scale, 0.55, 1)
      );
      break;
    }

    case "noiseOscillation":
    default: {
      const n = layeredNoise(params.seed, meta.index, t);
      const n2 = layeredNoise(params.seed + 99, meta.index, t * 0.73);
      _offset.set(n * amp * ax, n2 * amp * ay, n * amp * az * 0.6);
      _euler.x = n2 * amp * 0.03;
      _euler.z = n * amp * 0.025;
      break;
    }
  }

  mesh.position.copy(meta.originalPosition).add(_offset);
  mesh.rotation.copy(meta.originalRotation);
  mesh.rotation.x += _euler.x;
  mesh.rotation.y += _euler.y;
  mesh.rotation.z += _euler.z;

  if (motionType !== "dissolve") {
    mesh.scale.copy(meta.originalScale);
  }
}
