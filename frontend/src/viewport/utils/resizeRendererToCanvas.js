export function resizeRendererToCanvas(renderer, camera, canvas) {
  const w = Math.round(canvas.clientWidth);
  const h = Math.round(canvas.clientHeight);
  if (!w || !h) return;

  const pixelRatio = renderer.getPixelRatio?.() ?? 1;
  const targetWidth = Math.round(w * pixelRatio);
  const targetHeight = Math.round(h * pixelRatio);
  const needsResize =
    canvas.width !== targetWidth ||
    canvas.height !== targetHeight;
  const nextAspect = w / h;

  if (needsResize) {
    renderer.setSize(w, h, false);
  }

  if (needsResize || Math.abs(camera.aspect - nextAspect) > 0.0001) {
    camera.aspect = nextAspect;
    camera.updateProjectionMatrix();
  }
}
