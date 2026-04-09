let _prevW = 0;
let _prevH = 0;

export function resizeRendererToCanvas(renderer, camera, canvas) {
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  if (!w || !h) return;
  if (w === _prevW && h === _prevH) return;

  _prevW = w;
  _prevH = h;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}