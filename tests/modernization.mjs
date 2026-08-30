import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const html = readFileSync(new URL("index.html", root), "utf8");
const packageJson = JSON.parse(readFileSync(new URL("package.json", root), "utf8"));

assert.match(html, /<script type="module" src="\.\/modern-app\.js"><\/script>/);
assert.doesNotMatch(html, /<script src="\.\/support\.js"><\/script>/);
assert.match(html, /<dd-app-shell>[\s\S]*<x-dc>/);
assert.equal(packageJson.dependencies.lit, "^3.3.3");
assert.equal(packageJson.devDependencies.vite, "^8.2.2");
assert.ok(existsSync(new URL("src/main.ts", root)));
assert.ok(existsSync(new URL("src/workers/pptx.worker.ts", root)));
assert.ok(existsSync(new URL("vite.config.ts", root)));

console.log("Modernization checks passed.");
