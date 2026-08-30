/// <reference lib="webworker" />

interface AssembleRequest {
  type: "assemble-pptx";
  urls: string[];
}

const workerScope = self as unknown as DedicatedWorkerGlobalScope;

workerScope.addEventListener("message", async (event: MessageEvent<AssembleRequest>) => {
  if (event.data.type !== "assemble-pptx") return;

  try {
    const responses = await Promise.all(event.data.urls.map((url) => fetch(url)));
    const failed = responses.find((response) => !response.ok);
    if (failed) throw new Error(`Parte ausente: HTTP ${failed.status}`);

    const parts = await Promise.all(responses.map((response) => response.arrayBuffer()));
    const totalBytes = parts.reduce((total, part) => total + part.byteLength, 0);
    const merged = new Uint8Array(totalBytes);
    let offset = 0;
    for (const part of parts) {
      merged.set(new Uint8Array(part), offset);
      offset += part.byteLength;
    }

    workerScope.postMessage({ ok: true, buffer: merged.buffer }, [merged.buffer]);
  } catch (error) {
    workerScope.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : "Falha desconhecida ao montar o PowerPoint.",
    });
  }
});

export {};
