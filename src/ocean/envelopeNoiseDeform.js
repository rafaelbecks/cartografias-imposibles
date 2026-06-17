import * as THREE from "three";
import { createPerlin3D, sampleFbm3 } from "../math/perlin.js";

const _point = new THREE.Vector3();
const noiseCache = new Map();

function getNoise3d(seed) {
  const key = Math.floor(seed);
  if (!noiseCache.has(key)) noiseCache.set(key, createPerlin3D(key));
  return noiseCache.get(key);
}

/** Store rest pose positions and normals for runtime morphing. */
export function captureEnvelopeBaseGeometry(geometry) {
  const position = geometry.attributes.position;
  geometry.userData.oceanBasePosition = new Float32Array(position.array);
  geometry.computeVertexNormals();
  geometry.userData.oceanBaseNormal = new Float32Array(geometry.attributes.normal.array);
}

/**
 * Morph envelope vertices from base shape toward a noise-displaced surface.
 * @param {number} mix — 0 = regular, 1 = full deformation
 */
export function applyEnvelopeNoiseDeform(geometry, params, mix) {
  const basePos = geometry.userData.oceanBasePosition;
  const baseNorm = geometry.userData.oceanBaseNormal;
  if (!basePos || !baseNorm) return;

  const position = geometry.attributes.position;
  const normal = geometry.attributes.normal;

  if (mix <= 0.0001) {
    position.array.set(basePos);
    normal.array.set(baseNorm);
    position.needsUpdate = true;
    normal.needsUpdate = true;
    return;
  }

  if (!geometry.boundingSphere) geometry.computeBoundingSphere();
  const displacementScale = geometry.boundingSphere.radius * params.torusNoiseAmplitude;

  const noise3d = getNoise3d(params.torusNoiseSeed);
  const freq = params.torusNoiseScale * 0.08;
  const octaves = Math.max(1, Math.floor(params.torusNoiseOctaves));

  for (let i = 0; i < position.count; i++) {
    const i3 = i * 3;
    _point.set(basePos[i3], basePos[i3 + 1], basePos[i3 + 2]);

    const n = sampleFbm3(noise3d, _point.x * freq, _point.y * freq, _point.z * freq, octaves);
    const offset = n * displacementScale * mix;

    position.array[i3] = basePos[i3] + baseNorm[i3] * offset;
    position.array[i3 + 1] = basePos[i3 + 1] + baseNorm[i3 + 1] * offset;
    position.array[i3 + 2] = basePos[i3 + 2] + baseNorm[i3 + 2] * offset;
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
}
