/** Conversão excedeu o tempo limite (ou foi cancelada por tempo). Mapear para HTTP 408. */
export class ConversionTimeoutError extends Error {
  constructor() {
    super("A conversão demorou mais que o esperado e foi interrompida.");
    this.name = "ConversionTimeoutError";
  }
}
