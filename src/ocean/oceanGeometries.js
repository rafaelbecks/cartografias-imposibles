import * as THREE from "three";
import { createPerlin2D, sampleFbm2 } from "../math/perlin.js";

export const OCEAN_SHAPES = ["plane", "circle", "oval", "noise", "sphere", "torus", "torusknot"];

export const FLAT_SHAPES = new Set(["plane", "circle", "oval", "noise"]);
export const ENVELOPE_SHAPES = new Set(["sphere", "torus", "torusknot"]);
export const DEFORMABLE_ENVELOPE_SHAPES = new Set(["torus", "torusknot"]);

function sampleEdgeNoise(noise2d, angle, noiseScale, octaves) {
  const dirX = Math.cos(angle) * noiseScale;
  const dirY = Math.sin(angle) * noiseScale;
  return sampleFbm2(noise2d, dirX, dirY, octaves);
}

function createNoiseDiscGeometry(radius, segments, { noiseScale, noiseAmplitude, noiseSeed }) {
  const noise2d = createPerlin2D(noiseSeed);
  const shape = new THREE.Shape();
  const points = [];

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const n = sampleEdgeNoise(noise2d, angle, noiseScale, 3);
    const r = radius * (1 + n * noiseAmplitude);
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    points.push(new THREE.Vector2(x, y));
  }

  shape.setFromPoints(points);
  return new THREE.ShapeGeometry(shape, segments);
}

/**
 * @param {string} shape
 * @param {number} extent — diameter / span for flat shapes; reference size for envelopes
 * @param {object} params — oceanParams subset
 */
export function createOceanGeometry(shape, extent, params) {
  const segments = Math.max(16, Math.floor(params.shapeSegments));
  const radius = extent * 0.5;

  switch (shape) {
    case "circle":
      return new THREE.CircleGeometry(radius, segments);

    case "oval": {
      const rx = radius * params.ovalRatio;
      const rz = radius / params.ovalRatio;
      const geo = new THREE.CircleGeometry(1, segments);
      geo.scale(rx, rz, 1);
      return geo;
    }

    case "noise":
      return createNoiseDiscGeometry(radius, segments, params);

    case "sphere": {
      const r = extent * params.envelopeRadius * 0.5;
      return new THREE.SphereGeometry(r, segments, Math.max(8, Math.floor(segments * 0.75)));
    }

    case "torus": {
      const major = extent * params.envelopeRadius * 0.5;
      const tube = major * params.torusTube;
      return new THREE.TorusGeometry(
        major,
        tube,
        Math.max(8, Math.floor(segments * 0.5)),
        segments
      );
    }

    case "torusknot": {
      const scale = extent * params.envelopeRadius * 0.5;
      return new THREE.TorusKnotGeometry(
        scale * params.torusKnotRadius,
        scale * params.torusKnotTube,
        Math.max(3, Math.floor(params.torusKnotTubularSegments)),
        Math.max(3, Math.floor(params.torusKnotRadialSegments)),
        Math.max(1, Math.floor(params.torusKnotP)),
        Math.max(1, Math.floor(params.torusKnotQ))
      );
    }

    case "plane":
    default:
      return new THREE.PlaneGeometry(extent, extent, 1, 1);
  }
}

export function getOceanExtent(bounds, sizeScale) {
  if (!bounds) return 500 * sizeScale;
  const span = Math.max(bounds.size.x, bounds.size.z);
  return Math.max(span * sizeScale, 50);
}

export function getEnvelopeBoundsRadius(bounds) {
  if (!bounds) return 250;
  return bounds.size.length() * 0.5;
}
