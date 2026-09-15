import assert from "node:assert/strict";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";

const root = new URL("../", import.meta.url);
const bootstrap = readFileSync(new URL("index.html", root), "utf8");
assert.match(bootstrap, /legacy\.html/);
assert.match(bootstrap, /cartao-agradecimento\.js/);

const legacyCheck = readFileSync(new URL("modernization-legacy.mjs", import.meta.url), "utf8")
  .replace('new URL("index.html", root)', 'new URL("legacy.html", root)');
const generated = new URL(".modernization-generated.mjs", import.meta.url);
writeFileSync(generated, legacyCheck);
try {
  await import(`${generated.href}?t=${Date.now()}`);
} finally {
  unlinkSync(generated);
}
