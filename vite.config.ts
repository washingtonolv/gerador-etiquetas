import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  build: {
    assetsDir: "modern-assets",
    emptyOutDir: true,
    outDir: "dist-modern",
    minify: "oxc",
    sourcemap: true,
    target: "es2022",
    lib: {
      entry: "src/main.ts",
      formats: ["es"],
      fileName: "modern-app",
      cssFileName: "modern-app",
    },
    rollupOptions: {
      output: {
        entryFileNames: "modern-app.js",
        chunkFileNames: "modern-assets/[name]-[hash].js",
        assetFileNames: "modern-assets/[name]-[hash][extname]",
      },
    },
  },
});
