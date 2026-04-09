import * as THREE from "three";

export function getDropPositionAtClient(dom, camera, clientX, clientY) {
  if (!dom || !camera) return null;

  const rect = dom.getBoundingClientRect();
  const x = ((clientX - rect.left) / rect.width) * 2 - 1;
  const y = -(((clientY - rect.top) / rect.height) * 2 - 1);

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera({ x, y }, camera);

  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const hit = new THREE.Vector3();

  const ok = raycaster.ray.intersectPlane(groundPlane, hit);
  if (!ok) return null;

  return {
    x: hit.x,
    y: Math.max(hit.y, 0),
    z: hit.z,
  };
}