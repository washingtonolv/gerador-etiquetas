import assert from "node:assert/strict";
import { readFileSync, writeFileSync, unlinkSync } from "node:fs";

const root = new URL("../", import.meta.url);
const bootstrap = readFileSync(new URL("index.html", root), "utf8");
const whatsappModel = readFileSync(new URL("cartao-agradecimento.js", root), "utf8");

assert.match(bootstrap, /fetch\("\.\/legacy\.html"/);
assert.match(bootstrap, /cartao-agradecimento\.js/);
assert.match(whatsappModel, /Cartão Agradecimento WhatsApp/);
assert.match(whatsappModel, /#12/);
assert.match(whatsappModel, /DEFAULT_COUNT = 4/);
assert.match(whatsappModel, /A4 portrait/);
assert.match(whatsappModel, /97\.8154mm/);
assert.match(whatsappModel, /137\.7696mm/);

const legacyTest = readFileSync(new URL("smoke-legacy.mjs", import.meta.url), "utf8")
  .replace('new URL("../index.html", import.meta.url)', 'new URL("../legacy.html", import.meta.url)');
const generated = new URL(".smoke-generated.mjs", import.meta.url);
writeFileSync(generated, legacyTest);
try {
  await import(`${generated.href}?t=${Date.now()}`);
} finally {
  unlinkSync(generated);
}
