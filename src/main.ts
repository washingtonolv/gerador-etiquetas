import * as React from "react";
import * as ReactDOM from "react-dom/client";
import "./shell/dd-app-shell";
import { downloadBlitzPowerPoint, downloadCsvTemplate } from "./modules/downloads";

interface DDEtiquetasApi {
  downloadBlitzPowerPoint: typeof downloadBlitzPowerPoint;
  downloadCsvTemplate: typeof downloadCsvTemplate;
}

declare global {
  interface Window {
    React: typeof React;
    ReactDOM: typeof ReactDOM;
    DDEtiquetas: DDEtiquetasApi;
  }
}

window.React = React;
window.ReactDOM = ReactDOM;
window.DDEtiquetas = Object.freeze({ downloadBlitzPowerPoint, downloadCsvTemplate });

function emitRuntimeStatus(status: "loading" | "ready" | "error", message?: string): void {
  window.dispatchEvent(new CustomEvent("dd-runtime-status", { detail: { status, message } }));
}

function waitForRuntimeRoot(timeoutMs = 10_000): Promise<void> {
  if (document.getElementById("dc-root")) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const observer = new MutationObserver(() => {
      if (!document.getElementById("dc-root")) return;
      window.clearTimeout(timeout);
      observer.disconnect();
      resolve();
    });
    const timeout = window.setTimeout(() => {
      observer.disconnect();
      reject(new Error("O gerador demorou mais que o esperado para iniciar."));
    }, timeoutMs);
    observer.observe(document.documentElement, { childList: true, subtree: true });
  });
}

async function loadLegacyRuntime(): Promise<void> {
  emitRuntimeStatus("loading", "Preparando o gerador…");
  const script = document.createElement("script");
  script.src = new URL("support.js", document.baseURI).href;
  script.async = false;
  script.dataset.ddRuntime = "legacy-compat";

  const loaded = new Promise<void>((resolve, reject) => {
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Não foi possível carregar o motor do gerador.")), { once: true });
  });
  document.head.appendChild(script);
  await loaded;
  await waitForRuntimeRoot();
  emitRuntimeStatus("ready");
}

void loadLegacyRuntime().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Falha ao iniciar o gerador.";
  console.error("[gerador-etiquetas]", error);
  emitRuntimeStatus("error", message);
});
