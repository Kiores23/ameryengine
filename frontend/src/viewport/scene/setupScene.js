import * as THREE from "three";

function createGridHelper() {
  // Créer une grille groupée avec deux niveaux de détail
  const gridGroup = new THREE.Group();
  gridGroup.name = "GridHelper";

  // Grille fine 1×1 (peu opaque)
  const fineGrid = new THREE.GridHelper(100, 100, 0x888888, 0x444444);
  fineGrid.material.opacity = 0.15;
  fineGrid.material.transparent = true;
  fineGrid.position.z = 0;

  // Grille grosse 10×10 (un peu plus opaque)
  const coarseGrid = new THREE.GridHelper(100, 10, 0xaaaaaa, 0x666666);
  coarseGrid.material.opacity = 0.35;
  coarseGrid.material.transparent = true;
  coarseGrid.position.z = 0.01; // Légèrement décalée pour éviter les z-fighting

  gridGroup.add(fineGrid);
  gridGroup.add(coarseGrid);

  return gridGroup;
}

export async function setupScene({ scene }) {
  // Fog is managed dynamically by createViewportEngine (_applyFogMode)

  // Ajouter la grille de sol
  const gridHelper = createGridHelper();
  scene.add(gridHelper);
}
