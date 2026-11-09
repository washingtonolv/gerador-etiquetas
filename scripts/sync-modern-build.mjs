import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const buildRoot = path.join(repoRoot, "dist-modern");
const entries = await readdir(buildRoot, { withFileTypes: true });

// Keep the GitHub Pages bundle in sync.
for (const entry of entries) {
  const source = path.join(buildRoot, entry.name);
  const destination = path.join(repoRoot, entry.name);
  if (!destination.startsWith(repoRoot + path.sep)) throw new Error("Invalid build destination");
  if (entry.isDirectory()) {
    await rm(destination, { recursive: true, force: true });
    await mkdir(destination, { recursive: true });
    await cp(source, destination, { recursive: true });
  } else {
    await cp(source, destination);
  }
}

// Vercel deploys dist-modern, which must also contain the legacy HTML,
// scripts, and image assets needed by the editor.
const allowedDirs = new Set(["assets", "images", "img", "fonts", "icons", "public"]);
const allowedExts = new Set([
  ".html", ".htm", ".js", ".mjs", ".css", ".svg", ".png",
  ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".avif",
  ".woff", ".woff2", ".ttf", ".otf", ".json", ".txt", ".webmanifest"
]);
const rootEntries = await readdir(repoRoot, { withFileTypes: true });
let copied = 0;
for (const entry of rootEntries) {
  if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "dist-modern") continue;
  const from = path.join(repoRoot, entry.name);
  const into = path.join(buildRoot, entry.name);
  if (entry.isDirectory()) {
    if (!allowedDirs.has(entry.name)) continue;
    if (entry.name === "public") {
      await cp(from, buildRoot, { recursive: true });
    } else {
      await cp(from, into, { recursive: true, force: true });
    }
    copied++;
  } else if (entry.isFile() && allowedExts.has(path.extname(entry.name).toLowerCase())) {
    // Do not overwrite generated JS with stale root bundles.
    if (entry.name === "modern-app.js" || entry.name === "modern-app.css") continue;
    await cp(from, into);
    copied++;
  }
}
console.log("Vercel static bundle assembled:", copied, "root assets copied.");
