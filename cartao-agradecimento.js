(() => {
  "use strict";

  const MODEL_ID = "agradecimento-whatsapp";
  const WORKSPACE_ID = "dd-whatsapp-workspace";
  const STORAGE_KEY = "dd-cartao-agradecimento-whatsapp-v1";
  const DEFAULT_CARD = Object.freeze({ store: "[Nome da Loja]", phone: "(21) 0000-0000" });
  const DEFAULT_COUNT = 4;

  const cloneDefault = () => ({ ...DEFAULT_CARD });
  const clampText = (value, max) => String(value ?? "").slice(0, max);
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  function loadCards() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("empty");
      return parsed.slice(0, 100).map((item) => ({
        store: clampText(item?.store || DEFAULT_CARD.store, 80),
        phone: clampText(item?.phone || DEFAULT_CARD.phone, 40),
      }));
    } catch {
      return Array.from({ length: DEFAULT_COUNT }, cloneDefault);
    }
  }

  let cards = loadCards();

  function saveCards() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cards));
    } catch {
      // A prévia continua funcionando mesmo se o armazenamento estiver indisponível.
    }
  }

  function ensureStyles() {
    if (document.getElementById("dd-whatsapp-model-style")) return;
    const style = document.createElement("style");
    style.id = "dd-whatsapp-model-style";
    style.textContent = `
      #${WORKSPACE_ID}{position:fixed;inset:0;z-index:2147483000;background:#f4f8f8;color:#172222;font-family:Axiforma,Inter,Arial,sans-serif;display:none;overflow:auto}
      #${WORKSPACE_ID}.is-open{display:block}
      .ddwa-toolbar{position:sticky;top:0;z-index:5;display:flex;align-items:center;gap:12px;padding:12px 18px;background:#fff;border-bottom:1px solid #d4dfdf;box-shadow:0 3px 14px rgba(0,0,0,.06)}
      .ddwa-toolbar h1{font-size:18px;margin:0;flex:1;color:#463273}.ddwa-toolbar small{display:block;color:#657575;font-size:11px;font-weight:500;margin-top:2px}
      .ddwa-btn{border:1px solid #c9d6d6;border-radius:12px;background:#fff;color:#174c49;padding:9px 13px;font-weight:700;cursor:pointer}
      .ddwa-btn:hover{background:#f0f8f7}.ddwa-btn-primary{background:#a72f50;color:#fff;border-color:#a72f50}.ddwa-btn-primary:hover{background:#922844}
      .ddwa-layout{display:grid;grid-template-columns:minmax(300px,380px) minmax(0,1fr);min-height:calc(100vh - 66px)}
      .ddwa-editor{padding:18px;background:#fff;border-right:1px solid #d4dfdf;overflow:auto}.ddwa-editor-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:14px}.ddwa-editor-head h2{font-size:14px;margin:0;color:#005451}
      .ddwa-editor-list{display:flex;flex-direction:column;gap:12px}.ddwa-item{border:1px solid #d4dfdf;border-radius:16px;padding:12px;background:#fff;box-shadow:0 5px 16px rgba(70,50,115,.05)}
      .ddwa-item-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px;font-size:12px;font-weight:800;color:#463273}.ddwa-mini-actions{display:flex;gap:6px}.ddwa-icon-btn{border:0;border-radius:8px;background:#eef5f5;color:#005451;padding:5px 8px;cursor:pointer;font-size:11px;font-weight:700}
      .ddwa-field{display:block;margin-top:8px}.ddwa-field span{display:block;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#657575;margin-bottom:4px}.ddwa-field input{width:100%;border:1px solid #cbd5d9;border-radius:10px;padding:9px 10px;font:13px Axiforma,Inter,Arial,sans-serif;color:#1a1d21;background:#fff}.ddwa-field input:focus{outline:3px solid rgba(15,133,128,.15);border-color:#0f8580}
      .ddwa-help{margin:14px 0 0;padding:11px 12px;background:#e7f6f5;border-radius:12px;color:#375f5d;font-size:11px;line-height:1.45}
      .ddwa-preview{padding:24px;overflow:auto}.ddwa-pages{display:flex;flex-direction:column;align-items:center;gap:24px}.ddwa-sheet{box-sizing:border-box;width:min(100%,794px);aspect-ratio:210/297;background:#fff;box-shadow:0 10px 28px rgba(0,0,0,.12);padding:2.515% 2.137% 2.916% 2.249%;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:1fr 1fr;column-gap:2.455%;row-gap:1.796%;overflow:hidden}
      .ddwa-card{position:relative;overflow:hidden;background:#159d98 url("assets/cartao-agradecimento.png") center/100% 100% no-repeat;font-family:Axiforma,Inter,Arial,sans-serif}
      .ddwa-store,.ddwa-phone{position:absolute;left:11.48%;width:75.35%;height:7.72%;display:flex;align-items:center;justify-content:center}
      .ddwa-store{top:41.05%}.ddwa-phone{top:59.59%}
      .ddwa-dynamic{display:block;width:100%;padding:0 3%;box-sizing:border-box;text-align:center;color:#cd4964;font-family:Axiforma,Inter,Arial,sans-serif;font-weight:400;font-size:clamp(12px,1.67vw,21.33px);line-height:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .ddwa-empty{padding:30px;text-align:center;color:#657575}.ddwa-model-thumb{background:linear-gradient(145deg,#159d98 0 68%,#d83d64 68% 100%)!important}
      @media(max-width:860px){.ddwa-layout{grid-template-columns:1fr}.ddwa-editor{border-right:0;border-bottom:1px solid #d4dfdf}.ddwa-preview{padding:14px}.ddwa-sheet{width:min(100%,650px)}.ddwa-toolbar{flex-wrap:wrap}}
      @media print{
        body.dd-whatsapp-print{margin:0!important;background:#fff!important}
        body.dd-whatsapp-print>*:not(#${WORKSPACE_ID}){display:none!important}
        body.dd-whatsapp-print #${WORKSPACE_ID}{display:block!important;position:static!important;inset:auto!important;background:#fff!important;overflow:visible!important}
        body.dd-whatsapp-print .ddwa-toolbar,body.dd-whatsapp-print .ddwa-editor{display:none!important}
        body.dd-whatsapp-print .ddwa-layout{display:block!important;min-height:0!important}
        body.dd-whatsapp-print .ddwa-preview{padding:0!important;overflow:visible!important}
        body.dd-whatsapp-print .ddwa-pages{display:block!important}
        body.dd-whatsapp-print .ddwa-sheet{box-shadow:none!important;width:210mm!important;height:297mm!important;aspect-ratio:auto!important;padding:7.4676mm 4.4886mm 8.6592mm 4.7244mm!important;grid-template-columns:97.8154mm 97.8154mm!important;grid-template-rows:137.7696mm 137.7696mm!important;column-gap:5.1562mm!important;row-gap:5.334mm!important;break-after:page!important;page-break-after:always!important}
        body.dd-whatsapp-print .ddwa-sheet:last-child{break-after:auto!important;page-break-after:auto!important}
        body.dd-whatsapp-print .ddwa-card{width:97.8154mm!important;height:137.7696mm!important;break-inside:avoid!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
        body.dd-whatsapp-print .ddwa-dynamic{font-size:16pt!important}
      }
    `;
    document.head.appendChild(style);
  }

  function renderCard(card) {
    return `
      <article class="ddwa-card">
        <div class="ddwa-store"><span class="ddwa-dynamic">${escapeHtml(card.store)}</span></div>
        <div class="ddwa-phone"><span class="ddwa-dynamic">${escapeHtml(card.phone)}</span></div>
      </article>`;
  }

  function chunk(items, size) {
    const pages = [];
    for (let i = 0; i < items.length; i += size) pages.push(items.slice(i, i + size));
    return pages;
  }

  function renderWorkspace() {
    const workspace = document.getElementById(WORKSPACE_ID);
    if (!workspace) return;
    const pages = chunk(cards, 4);
    const editor = cards.map((card, index) => `
      <section class="ddwa-item" data-index="${index}">
        <div class="ddwa-item-head"><span>Cartão ${index + 1}</span><span class="ddwa-mini-actions"><button class="ddwa-icon-btn" data-action="duplicate" data-index="${index}">Duplicar</button><button class="ddwa-icon-btn" data-action="remove" data-index="${index}" ${cards.length === 1 ? "disabled" : ""}>Remover</button></span></div>
        <label class="ddwa-field"><span>Nome da loja</span><input data-field="store" data-index="${index}" maxlength="80" value="${escapeHtml(card.store)}"></label>
        <label class="ddwa-field"><span>WhatsApp / telefone</span><input data-field="phone" data-index="${index}" maxlength="40" value="${escapeHtml(card.phone)}"></label>
      </section>`).join("");
    const preview = pages.map((page) => `<section class="ddwa-sheet">${page.map(renderCard).join("")}</section>`).join("");
    workspace.innerHTML = `
      <header class="ddwa-toolbar">
        <button class="ddwa-btn" data-action="close">← Voltar ao gerador</button>
        <h1>Cartão de Agradecimento WhatsApp<small>Modelo #12 · A4 vertical · 4 cartões por folha</small></h1>
        <button class="ddwa-btn" data-action="add">+ Novo cartão</button>
        <button class="ddwa-btn ddwa-btn-primary" data-action="print">Imprimir</button>
      </header>
      <div class="ddwa-layout">
        <aside class="ddwa-editor">
          <div class="ddwa-editor-head"><h2>Editar cartões</h2><span>${cards.length} ${cards.length === 1 ? "cartão" : "cartões"}</span></div>
          <div class="ddwa-editor-list">${editor}</div>
          <p class="ddwa-help">A impressão preserva o tamanho do arquivo de referência: quatro cartões em uma folha A4 vertical. Use escala 100% / tamanho real na janela da impressora.</p>
        </aside>
        <main class="ddwa-preview"><div class="ddwa-pages">${preview || '<div class="ddwa-empty">Nenhum cartão.</div>'}</div></main>
      </div>`;
  }

  function openWorkspace() {
    ensureStyles();
    let workspace = document.getElementById(WORKSPACE_ID);
    if (!workspace) {
      workspace = document.createElement("div");
      workspace.id = WORKSPACE_ID;
      document.body.appendChild(workspace);
      workspace.addEventListener("input", handleInput);
      workspace.addEventListener("click", handleClick);
    }
    renderWorkspace();
    workspace.classList.add("is-open");
    document.documentElement.style.overflow = "hidden";
  }

  function closeWorkspace() {
    document.getElementById(WORKSPACE_ID)?.classList.remove("is-open");
    document.documentElement.style.overflow = "";
  }

  function handleInput(event) {
    const input = event.target.closest?.("input[data-field]");
    if (!input) return;
    const index = Number(input.dataset.index);
    if (!Number.isInteger(index) || !cards[index]) return;
    const field = input.dataset.field;
    if (field !== "store" && field !== "phone") return;
    cards[index] = { ...cards[index], [field]: clampText(input.value, field === "store" ? 80 : 40) };
    saveCards();
    const pageIndex = Math.floor(index / 4);
    const cardIndex = index % 4;
    const previewCard = document.querySelectorAll(".ddwa-sheet")[pageIndex]?.querySelectorAll(".ddwa-card")[cardIndex];
    if (previewCard) previewCard.querySelector(field === "store" ? ".ddwa-store .ddwa-dynamic" : ".ddwa-phone .ddwa-dynamic").textContent = cards[index][field];
  }

  function addCard(source = null) {
    cards.push(source ? { ...source } : cloneDefault());
    saveCards();
    renderWorkspace();
  }

  function removeCard(index) {
    if (cards.length <= 1) return;
    cards.splice(index, 1);
    saveCards();
    renderWorkspace();
  }

  function printCards() {
    const pageStyle = document.createElement("style");
    pageStyle.id = "dd-whatsapp-print-page";
    pageStyle.textContent = "@page { size: A4 portrait; margin: 0; }";
    document.head.appendChild(pageStyle);
    document.body.classList.add("dd-whatsapp-print");
    const cleanup = () => {
      document.body.classList.remove("dd-whatsapp-print");
      pageStyle.remove();
      window.removeEventListener("afterprint", cleanup);
    };
    window.addEventListener("afterprint", cleanup);
    requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
    setTimeout(() => {
      if (document.body.classList.contains("dd-whatsapp-print")) cleanup();
    }, 30000);
  }

  function handleClick(event) {
    const button = event.target.closest?.("button[data-action]");
    if (!button) return;
    const action = button.dataset.action;
    const index = Number(button.dataset.index);
    if (action === "close") closeWorkspace();
    if (action === "add") addCard();
    if (action === "duplicate" && cards[index]) addCard(cards[index]);
    if (action === "remove" && cards[index]) removeCard(index);
    if (action === "print") printCards();
  }

  function modelButton() {
    const button = document.createElement("button");
    button.type = "button";
    button.id = "dd-whatsapp-model-button";
    button.className = "model-item";
    button.setAttribute("aria-label", "Cartão de Agradecimento WhatsApp");
    button.innerHTML = '<span class="model-thumb ddwa-model-thumb"></span><span class="model-n">#12</span><span>Cartão Agradecimento WhatsApp</span>';
    button.addEventListener("click", openWorkspace);
    return button;
  }

  function ensureModelButton() {
    ensureStyles();
    const rail = document.querySelector(".model-rail");
    if (!rail || rail.querySelector("#dd-whatsapp-model-button")) return;
    rail.appendChild(modelButton());
  }

  function boot() {
    ensureStyles();
    ensureModelButton();
    const observer = new MutationObserver(() => ensureModelButton());
    observer.observe(document.documentElement, { childList: true, subtree: true });
    window.addEventListener("dd-runtime-status", (event) => {
      if (event?.detail?.status === "ready") ensureModelButton();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
  else boot();
})();
