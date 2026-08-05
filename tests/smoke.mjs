import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const repoRoot = fileURLToPath(new URL("../", import.meta.url));
const scriptMatch = html.match(/<script type="text\/x-dc" data-dc-script>([\s\S]*?)<\/script>/);
assert.ok(scriptMatch, "O script principal deve existir no index.html");

let storageWrites = 0;
const localStorage = {
  getItem: () => null,
  setItem: () => { storageWrites += 1; },
};
const documentStub = {
  addEventListener() {},
  removeEventListener() {},
  querySelector: () => null,
  querySelectorAll: () => [],
  createElement: () => ({ click() {} }),
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
const modelNames = ["placa", "pcr", "prec", "make", "make2", "make3", "pais", "pais6"];

assert.equal(component.splitPrice("99,9").centavos, "90");
assert.equal(component.fmtPrice("129990"), "1299,90");
assert.equal(component.normalizePriceField("R$ 56,9"), "56,90");
assert.equal(component.clampQty(0), 1);
assert.equal(component.clampQty(5000), 999);
assert.equal(component.clampQty("invalido"), 1);

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
}

for (const brand of component.paisArt) {
  assert.ok(existsSync(`${repoRoot}assets/pais/${brand}.png`), `Arte de impressão ausente: pais/${brand}`);
  assert.ok(existsSync(`${repoRoot}assets/pais-preview/${brand}.webp`), `Prévia ausente: pais/${brand}`);
}
for (const brand of component.pais6Art) {
  assert.ok(existsSync(`${repoRoot}assets/pais6/${brand}.png`), `Arte de impressão ausente: pais6/${brand}`);
  assert.ok(existsSync(`${repoRoot}assets/pais6-preview/${brand}.webp`), `Prévia ausente: pais6/${brand}`);
}
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

const sanitized = component.sanitizeList([{ brand: null, name: 123, dePrice: null, porPrice: 45, qty: 10000 }]);
assert.deepEqual(
  JSON.parse(JSON.stringify(sanitized[0])),
  { brand: "semmarca", name: "123", dePrice: "", porPrice: "45", qty: 999 },
);

const restoreComponent = new Component();
const backupLists = Object.fromEntries(
  Object.values(restoreComponent.modelMeta).map(meta => [meta.key, [{ ...meta.create(), qty: 5000 }]]),
);
restoreComponent.restoreBackup(JSON.stringify({ format: "dd-etiquetas", version: 2, etiquetas: backupLists }));
assert.equal(restoreComponent.state.pss6[0].qty, 999, "Backups também devem limitar quantidades inválidas");

storageWrites = 0;
const previousUiState = { ...component.state, zoom: 1 };
component.state = { ...component.state, zoom: 2 };
component.componentDidUpdate(null, previousUiState);
assert.equal(storageWrites, 0, "Mudanças apenas visuais não devem regravar todas as etiquetas");

const previousDataState = component.state;
component.state = { ...component.state, pss6: [...component.state.pss6] };
component.componentDidUpdate(null, previousDataState);
assert.equal(storageWrites, 1, "Mudanças de dados devem ser persistidas");

assert.equal((html.match(/type="number" min="1" max="999"/g) || []).length, 8);
assert.match(html, /aria-label="Mais opções"/);
assert.doesNotMatch(html, /renderVals\(\)\.addCurrent/);

const template = html.slice(html.indexOf("<x-dc>"), html.indexOf('<script type="text/x-dc" data-dc-script>'));
const localAliases = new Set(["g", "pl", "b", "true", "false"]);
const placeholderRoots = new Set([...template.matchAll(/\{\{\s*([A-Za-z_$][\w$]*)/g)].map(match => match[1]));
const renderedValues = component.renderVals();
for (const name of placeholderRoots) {
  if (!localAliases.has(name)) assert.ok(name in renderedValues, `Valor de template ausente: ${name}`);
}

console.log("Smoke tests passed for 8 models.");
