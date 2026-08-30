import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(fileURLToPath(new URL("../", import.meta.url)));
const buildRoot = path.join(repoRoot, "dist-modern");
const entries = await readdir(buildRoot, { withFileTypes: true });

for (const entry of entries) {
  const source = path.join(buildRoot, entry.name);
  const destination = path.join(repoRoot, entry.name);
  if (!destination.startsWith(repoRoot + path.sep)) {
    throw new Error(`Destino de build inválido: ${destination}`);
  }
  if (entry.isDirectory()) {
    await rm(destination, { recursive: true, force: true });
    await mkdir(destination, { recursive: true });
    await cp(source, destination, { recursive: true });
  } else {
    await cp(source, destination);
  }
}

console.log(`Build moderno sincronizado: ${entries.length} entradas.`);
