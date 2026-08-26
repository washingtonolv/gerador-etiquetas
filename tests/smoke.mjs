import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const scriptMatch = html.match(/<script type="text\/x-dc" data-dc-script>([\s\S]*?)<\/script>/);
assert.ok(scriptMatch, "O script principal deve existir no index.html");

let storageWrites = 0;
let appendedPrintStyle = null;
const printStyles = {
  "dd-print-page-default": { id: "dd-print-page-default", media: "print" },
  "dd-print-page-pais6": { id: "dd-print-page-pais6", media: "not all" },
  "dd-print-page-blitz": { id: "dd-print-page-blitz", media: "not all" },
  "dd-print-page-blitzpreco": { id: "dd-print-page-blitzpreco", media: "not all" },
};
const localStorage = {
  getItem: () => null,
  setItem: () => { storageWrites += 1; },
};
const documentStub = {
  addEventListener() {},
  removeEventListener() {},
  getElementById: id => printStyles[id] || null,
  head: { appendChild(element) { appendedPrintStyle = element; } },
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => ({ click() {}, id: "", media: "", textContent: "" }),
};
const context = {
  console,
  Blob,
  URL,
  Date,
  setTimeout,
  clearTimeout,
  localStorage,
  document: documentStub,
  requestAnimationFrame: callback => callback(),
  window: {
    alert() {},
    confirm: () => true,
    print() {},
    scrollTo() {},
  },
};
context.globalThis = context;
vm.createContext(context);
vm.runInContext(`
  class DCLogic {
    setState(update) {
      const patch = typeof update === "function" ? update(this.state) : update;
      if (patch) this.state = { ...this.state, ...patch };
    }
  }
  ${scriptMatch[1]}
  globalThis.ComponentUnderTest = Component;
`, context);

const Component = context.ComponentUnderTest;
const component = new Component();
const modelNames = ["placa", "pcr", "prec", "make", "make2", "make3", "pais", "pais6", "blitz", "blitzpreco"];

assert.equal(component.splitPrice("99,9").centavos, "90");
assert.equal(component.fmtPrice("129990"), "1299,90");
assert.equal(component.normalizePriceField("R$ 56,9"), "56,90");
assert.equal(component.clampQty(0), 1);
assert.equal(component.clampQty(5000), 999);
assert.equal(component.clampQty("invalido"), 1);
component.applyPrintPage("blitz");
assert.equal(printStyles["dd-print-page-blitz"].media, "print");
assert.equal(printStyles["dd-print-page-default"].media, "not all");
assert.equal(appendedPrintStyle.id, "dd-print-page-blitz");
component.applyPrintPage("placa");
assert.equal(printStyles["dd-print-page-default"].media, "print");
assert.equal(printStyles["dd-print-page-blitz"].media, "not all");
component.applyPrintPage("blitzpreco");
assert.equal(printStyles["dd-print-page-blitzpreco"].media, "print");
assert.equal(printStyles["dd-print-page-default"].media, "not all");
assert.equal(appendedPrintStyle.id, "dd-print-page-blitzpreco");

for (const model of modelNames) {
  const meta = component.getModelMeta(model);
  assert.equal(component.listKey(model), meta.key);
  assert.equal(component.activeKeyFor(meta.key), meta.activeKey);
  component.state.model = model;
  const before = component.state[meta.key].length;
  component.addCurrentItem();
  assert.equal(component.state[meta.key].length, before + 1, `Adicionar deve funcionar em ${model}`);
  const rendered = component.renderVals();
  assert.equal(rendered.printModel, meta.label);
  const firstItem = rendered[meta.key][0];
  for (const handler of ["setBrand", "setName", "setDe", "setPor", "setQty", "dup", "remove", "removePreview"]) {
    assert.equal(typeof firstItem[handler], "function", `${handler} deve existir em ${model}`);
  }
  if (model === "blitz") assert.equal(typeof firstItem.setDesc, "function", "A descrição do BLITZ deve ser editável");
}

for (const brand of component.paisArt) {
  assert.ok(existsSync(`${repoRoot}assets/pais/${brand}.png`), `Arte de impressão ausente: pais/${brand}`);
  assert.ok(existsSync(`${repoRoot}assets/pais-preview/${brand}.webp`), `Prévia ausente: pais/${brand}`);
}
for (const brand of component.pais6Art) {
  assert.ok(existsSync(`${repoRoot}assets/pais6/${brand}.png`), `Arte de impressão ausente: pais6/${brand}`);
  assert.ok(existsSync(`${repoRoot}assets/pais6-preview/${brand}.webp`), `Prévia ausente: pais6/${brand}`);
  assert.ok(existsSync(`${repoRoot}assets/blitz/${brand}.jpg`), `Arte ausente: blitz/${brand}`);
}
for (const brand of component.blitzPrecoArt) {
  assert.ok(existsSync(`${repoRoot}assets/blitz-preco/${brand}.webp`), `Arte ausente: blitz-preco/${brand}`);
}
assert.ok(existsSync(`${repoRoot}uploads/BLITZ-A5-web.pptx`), "PowerPoint BLITZ corrigido deve estar disponível");
const blitzPptx = readFileSync(`${repoRoot}uploads/BLITZ-A5-web.pptx`);
const blitzParts = Array.from({ length: 21 }, (_, i) =>
  readFileSync(`${repoRoot}uploads/blitz-a5-parts/part-${String(i + 1).padStart(2, "0")}.bin`),
);
assert.ok(Buffer.concat(blitzParts).equals(blitzPptx), "As partes publicadas devem recompor exatamente o PowerPoint corrigido");
for (const { key } of component.placaBrands.filter(brand => brand.key !== "semmarca")) {
  assert.ok(existsSync(`${repoRoot}assets/placa/marcas/${key}.png`), `Logo de marca ausente: ${key}`);
}

component.state.model = "make";
component.state.mks = [{ brand: "semmarca", name: "Teste", dePrice: "", porPrice: "10,00", qty: 1000000 }];
let values = component.renderVals();
assert.equal(values.mks[0].qty, 999, "A quantidade renderizada deve ser limitada");
assert.equal(values.mksGrid.length, 999, "A expansão da grade deve respeitar o limite");
values.mks[0].setQty({ target: { value: "5000" } });
assert.equal(component.state.mks[0].qty, 999, "A digitação manual deve ser limitada");

component.state.model = "pais6";
component.importText("Perfume Importado;1.299,90;;Lattafa");
const imported = component.state.pss6.at(-1);
assert.equal(imported.brand, "lattafa", "Marcas exclusivas do A6 devem ser reconhecidas");
assert.equal(imported.porPrice, "1.299,90", "Preços com milhar devem ser importados");

component.state.model = "blitz";
component.state.blitzs = [{ brand: "avon", name: "Teste", desc: "", dePrice: "", porPrice: "10,00", qty: 3 }];
values = component.renderVals();
assert.equal(values.blitzPages.length, 2, "Três etiquetas BLITZ devem ocupar duas folhas");
assert.deepEqual(JSON.parse(JSON.stringify(values.blitzPages.map(page => page.items.length))), [2, 1], "Cada folha BLITZ deve receber no máximo dois A5");

component.state.model = "blitzpreco";
component.state.blitzPrecos = [{ brand: "avon", name: "Teste", dePrice: "15,00", porPrice: "10,00", qty: 9 }];
values = component.renderVals();
assert.equal(values.blitzPrecoPages.length, 2, "Nove preçários BLITZ devem ocupar duas folhas");
assert.deepEqual(JSON.parse(JSON.stringify(values.blitzPrecoPages.map(page => page.items.length))), [8, 1], "Cada folha deve receber no máximo oito preçários BLITZ");
assert.equal(values.printOrientation, "Paisagem", "O Preçário BLITZ deve imprimir em A4 paisagem");
assert.equal(values.printMargins, "Nenhuma", "O Preçário BLITZ deve imprimir sem margens do navegador");

const sanitized = component.sanitizeList([{ brand: null, name: 123, dePrice: null, porPrice: 45, qty: 10000 }]);
assert.deepEqual(
  JSON.parse(JSON.stringify(sanitized[0])),
  { brand: "semmarca", name: "123", desc: "", dePrice: "", porPrice: "45", qty: 999 },
);

const restoreComponent = new Component();
const backupLists = Object.fromEntries(
  Object.values(restoreComponent.modelMeta).map(meta => [meta.key, [{ ...meta.create(), qty: 5000 }]]),
);
restoreComponent.restoreBackup(JSON.stringify({ format: "dd-etiquetas", version: 2, etiquetas: backupLists }));
assert.equal(restoreComponent.state.pss6[0].qty, 999, "Backups também devem limitar quantidades inválidas");
assert.equal(restoreComponent.state.blitzs[0].qty, 999, "O BLITZ deve ser restaurado no backup");
assert.equal(restoreComponent.state.blitzPrecos[0].qty, 999, "O Preçário BLITZ deve ser restaurado no backup");

storageWrites = 0;
const previousUiState = { ...component.state, zoom: 1 };
component.state = { ...component.state, zoom: 2 };
component.componentDidUpdate(null, previousUiState);
assert.equal(storageWrites, 0, "Mudanças apenas visuais não devem regravar todas as etiquetas");

const previousDataState = component.state;
component.state = { ...component.state, pss6: [...component.state.pss6] };
component.componentDidUpdate(null, previousDataState);
assert.equal(storageWrites, 1, "Mudanças de dados devem ser persistidas");

assert.equal((html.match(/type="number" min="1" max="999"/g) || []).length, 10);
assert.match(html, /id="dd-print-page-blitz" media="not all">@page \{ size: 297mm 210mm; margin: 0; \}<\/style>/);
assert.match(html, /id="dd-print-page-blitzpreco" media="not all">@page \{ size: A4 landscape; margin: 0; \}<\/style>/);
assert.match(html, /class="sheet blitz-sheet"/);
assert.match(html, /class="sheet blitz-preco-sheet"/);
assert.match(html, /id="dd-print-page-default" media="print"/);
assert.match(html, /Orientação: <b>\{\{ printOrientation \}\}<\/b>/);
assert.match(html, /async printBlitzDocument\(\)/);
assert.match(html, /async printBlitzPrecoDocument\(\)/);
assert.match(html, /id="dd-blitz-isolated-print"/);
assert.match(html, /id="dd-blitz-preco-isolated-print"/);
assert.match(html, /@page \{ size: A4 landscape; margin: 0; \}/);
assert.match(html, /<body class="blitz-page pp">/);
assert.match(html, /if \(model === "blitz"\) \{\s+await this\.printBlitzDocument\(\);/);
assert.match(html, /if \(model === "blitzpreco"\) \{\s+await this\.printBlitzPrecoDocument\(\);/);
assert.match(html, /grid-template-columns:148mm 148mm !important/);
assert.match(html, /grid-template-columns:repeat\(4, 53mm\) !important/);
assert.match(html, /grid-template-rows:repeat\(2, 52mm\) !important/);
assert.match(html, /width: 148mm/);
assert.match(html, /aria-label="Mais opções"/);
assert.doesNotMatch(html, /renderVals\(\)\.addCurrent/);

const template = html.slice(html.indexOf("<x-dc>"), html.indexOf('<script type="text/x-dc" data-dc-script>'));
const localAliases = new Set(["g", "pl", "b", "bp", "true", "false"]);
const placeholderRoots = new Set([...template.matchAll(/\{\{\s*([A-Za-z_$][\w$]*)/g)].map(match => match[1]));
const renderedValues = component.renderVals();
assert.equal(typeof renderedValues.downloadBlitzPptx, "function", "O download recomposto do PowerPoint deve estar disponível");
for (const name of placeholderRoots) {
  if (!localAliases.has(name)) assert.ok(name in renderedValues, `Valor de template ausente: ${name}`);
}

console.log("Smoke tests passed for 10 models.");