import { LitElement, css, html, nothing } from "lit";

type RuntimeStatus = "loading" | "ready" | "error";

interface RuntimeStatusDetail {
  status: RuntimeStatus;
  message?: string;
}

export class DdAppShell extends LitElement {
  static styles = css`
    :host {
      display: block;
      min-height: 100%;
    }

    .status {
      position: fixed;
      inset: auto 16px 16px 16px;
      z-index: 2147483000;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      max-width: 460px;
      margin-inline: auto;
      padding: 12px 16px;
      border: 1px solid #cbd5d9;
      border-radius: 14px;
      background: rgba(255, 255, 255, 0.96);
      color: #263737;
      box-shadow: 0 12px 34px rgba(38, 55, 55, 0.16);
      font: 700 13px/1.4 Inter, Archivo, system-ui, sans-serif;
      backdrop-filter: blur(12px);
    }

    .status[data-kind="error"] {
      border-color: #f0cad3;
      color: #922844;
      background: rgba(255, 248, 249, 0.98);
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #b8d8d6;
      border-top-color: #006b67;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    @media print {
      .status { display: none !important; }
    }
  `;

  private runtimeStatus: RuntimeStatus = "loading";
  private runtimeMessage = "Preparando o gerador…";

  private readonly handleRuntimeStatus = (event: Event): void => {
    const detail = (event as CustomEvent<RuntimeStatusDetail>).detail;
    this.runtimeStatus = detail.status;
    this.runtimeMessage = detail.message ?? this.runtimeMessage;
    this.requestUpdate();
  };

  connectedCallback(): void {
    super.connectedCallback();
    window.addEventListener("dd-runtime-status", this.handleRuntimeStatus);
    if (document.getElementById("dc-root")) this.runtimeStatus = "ready";
  }

  disconnectedCallback(): void {
    window.removeEventListener("dd-runtime-status", this.handleRuntimeStatus);
    super.disconnectedCallback();
  }

  protected render() {
    return html`
      <slot></slot>
      ${this.runtimeStatus === "ready"
        ? nothing
        : html`
            <div
              class="status"
              data-kind=${this.runtimeStatus}
              role=${this.runtimeStatus === "error" ? "alert" : "status"}
              aria-live="polite"
            >
              ${this.runtimeStatus === "loading" ? html`<span class="spinner" aria-hidden="true"></span>` : nothing}
              <span>${this.runtimeMessage}</span>
            </div>
          `}
    `;
  }
}

if (!customElements.get("dd-app-shell")) {
  customElements.define("dd-app-shell", DdAppShell);
}
