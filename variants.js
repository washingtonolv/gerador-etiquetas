// Variantes do editor, escolhidas por ?variant=<nome> na URL do legacy.html.
// Sem parâmetro (ou com nome desconhecido) vale a variante padrão.
(() => {
  const DEFAULT_VARIANT = {
    name: "default",
    makeLabel: "Placa de Acrílico",
    storageKeys: { labels: "dd-etiquetas-v2", labelsLegacy: "dd-etiquetas-v1" },
    makeColumnMm: null,
    colorChoice: false,
    css: "",
  };

  const VARIANTS = {
    "placa-48x30": {
      name: "placa-48x30",
      makeLabel: "Placa acrilico 4,8 x 3 cm",
      storageKeys: { labels: "dd-etiquetas-acrilico-48x30-v2", labelsLegacy: "dd-etiquetas-acrilico-48x30-v1" },
      makeColumnMm: 48,
      colorChoice: true,
      css: [
        ".g-make .fold-label { aspect-ratio:48 / 30; }",
        "@media print { .g-make > .fold-label { width:48mm !important; height:30mm !important; } }",
        ".pp .g-make > .fold-label { width:48mm !important; height:30mm !important; }",
      ].join("\n"),
    },
  };

  const requested = new URLSearchParams(location.search).get("variant");
  const variant = { ...DEFAULT_VARIANT, ...(VARIANTS[requested] || {}) };
  // Mesmo CSS, empacotado como <style> para os documentos de impressão em iframe.
  variant.printStyleTag = variant.css ? "<style>\n" + variant.css + "\n</style>" : "";
  window.DD_VARIANT = Object.freeze(variant);

  if (variant.makeColumnMm) {
    document.documentElement.style.setProperty("--make-col-mm", variant.makeColumnMm + "mm");
  }
  if (variant.css) {
    const style = document.createElement("style");
    style.textContent = "\n" + variant.css + "\n";
    document.currentScript.insertAdjacentElement("afterend", style);
  }
})();
