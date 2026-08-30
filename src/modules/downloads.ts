const CSV_TEMPLATE =
  "Nome do produto;Preço POR;Preço DE (opcional);Marca (opcional)\r\n" +
  "Pó Bronzer;56,90;75,00;Avon\r\n" +
  "Creme Renew Ultimate;99,90;174,90;Avon\r\n" +
  "Hid. Obsessão por Baunilha 400ml;39,90;;O Boticário\r\n" +
  "Batom Matte;29,90;;\r\n";

interface WorkerSuccess {
  ok: true;
  buffer: ArrayBuffer;
}

interface WorkerFailure {
  ok: false;
  error: string;
}

type WorkerResponse = WorkerSuccess | WorkerFailure;

function saveBlob(blob: Blob, filename: string): void {
  const anchor = document.createElement("a");
  anchor.href = URL.createObjectURL(blob);
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(anchor.href), 1_000);
}

export function downloadCsvTemplate(): void {
  saveBlob(new Blob(["\ufeff", CSV_TEMPLATE], { type: "text/csv;charset=utf-8" }), "modelo-importacao.csv");
}

export async function downloadBlitzPowerPoint(): Promise<void> {
  const urls = Array.from({ length: 21 }, (_, index) => {
    const part = String(index + 1).padStart(2, "0");
    return new URL(`uploads/blitz-a5-parts/part-${part}.bin`, document.baseURI).href;
  });

  const worker = new Worker(new URL("../workers/pptx.worker.ts", import.meta.url), { type: "module" });
  const response = await new Promise<WorkerResponse>((resolve, reject) => {
    const timeout = window.setTimeout(() => reject(new Error("Tempo limite excedido ao montar o PowerPoint.")), 60_000);
    worker.addEventListener("message", (event: MessageEvent<WorkerResponse>) => {
      window.clearTimeout(timeout);
      resolve(event.data);
    }, { once: true });
    worker.addEventListener("error", () => {
      window.clearTimeout(timeout);
      reject(new Error("O processo de montagem do PowerPoint falhou."));
    }, { once: true });
    worker.postMessage({ type: "assemble-pptx", urls });
  }).finally(() => worker.terminate());

  if (!response.ok) throw new Error(response.error);
  saveBlob(
    new Blob([response.buffer], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" }),
    "BLITZ-A5-corrigido.pptx",
  );
}
