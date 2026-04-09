import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ command }) => ({
  base: command === "build" ? "./" : "/",
  envDir: "..",
  plugins: [react()],
  optimizeDeps: {
    include: [
      "three",
      "three/examples/jsm/controls/OrbitControls.js",
      "three/examples/jsm/controls/TransformControls.js",
    ],
  },
  resolve: {
    dedupe: ["three"],
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          three: [
            "three",
            "three/examples/jsm/controls/OrbitControls.js",
            "three/examples/jsm/controls/TransformControls.js",
          ],
          react: ["react", "react-dom"],
        },
      },
    },
  },
}));
