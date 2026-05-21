import * as THREE from "three";

const _box = new THREE.Box3();
const _center = new THREE.Vector3();
const _size = new THREE.Vector3();

/**
 * Traverse a loaded model and collect mesh layers with spatial metadata.
 * @returns {{ layers: THREE.Mesh[], terrainCenter: THREE.Vector3, maxDistance: number }}
 */
export function analyzeTerrainLayers(root) {
  const meshes = [];
  root.traverse((child) => {
    if (child.isMesh) meshes.push(child);
  });

  if (meshes.length === 0) {
    return {
      layers: [],
      terrainCenter: new THREE.Vector3(),
      maxDistance: 1,
      maxHeight: 1,
    };
  }

  _box.makeEmpty();
  for (const mesh of meshes) {
    _box.expandByObject(mesh);
  }
  const terrainCenter = _box.getCenter(new THREE.Vector3());
  const terrainSize = _box.getSize(new THREE.Vector3());
  const maxHeight = Math.max(terrainSize.y, 0.001);

  const layerData = meshes.map((mesh, index) => {
    const localBox = new THREE.Box3().setFromObject(mesh);
    const center = localBox.getCenter(new THREE.Vector3());
    const size = localBox.getSize(new THREE.Vector3());
    const distance = center.distanceTo(terrainCenter);

    return {
      mesh,
      index,
      name: mesh.name || `layer_${index}`,
      center,
      height: size.y,
      distance,
      centerY: center.y,
    };
  });

  layerData.sort((a, b) => a.centerY - b.centerY);

  const maxDistance = Math.max(
    ...layerData.map((d) => d.distance),
    0.001
  );
  const count = layerData.length;

  const layers = layerData.map((data, sortedIndex) => {
    const { mesh } = data;
    const normalizedIndex = count > 1 ? sortedIndex / (count - 1) : 0;

    mesh.userData.terrainLayer = {
      index: sortedIndex,
      originalIndex: data.index,
      name: data.name,
      originalPosition: mesh.position.clone(),
      originalRotation: mesh.rotation.clone(),
      originalScale: mesh.scale.clone(),
      boundingBox: new THREE.Box3().setFromObject(mesh),
      center: data.center.clone(),
      height: data.height,
      distanceFromCenter: data.distance,
      normalizedIndex,
      normalizedHeight: data.centerY / (terrainCenter.y + maxHeight * 0.5 + 0.001),
      phase: 0,
      selected: true,
    };

    return mesh;
  });

  return { layers, terrainCenter, maxDistance, maxHeight };
}
