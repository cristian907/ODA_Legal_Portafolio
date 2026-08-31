/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

// html2pdf.js ships no type definitions. Its fluent worker is chainable and
// thenable; this covers the exact chain used by usePdfExport.
declare module 'html2pdf.js' {
  interface Html2PdfDoc {
    internal: { getNumberOfPages: () => number }
    deletePage: (n: number) => void
  }
  interface Html2PdfWorker {
    set: (opt: Record<string, unknown>) => Html2PdfWorker
    from: (el: HTMLElement) => Html2PdfWorker
    toPdf: () => Html2PdfWorker
    get: (key: 'pdf') => Html2PdfWorker
    then: (cb: (pdf: Html2PdfDoc) => void) => Html2PdfWorker
    save: () => Promise<void>
  }
  export default function html2pdf(): Html2PdfWorker
}
