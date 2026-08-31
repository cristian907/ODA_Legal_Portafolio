/**
 * Export an A4 sheet element to a single-page PDF.
 * Ports the legacy downloadCvAsPdf() exactly: strips transform/border/shadow
 * (which distort html2canvas capture and cause a blank 2nd page) and lifts the
 * viewport's overflow clip, then restores everything afterwards.
 *
 * html2pdf.js (with jsPDF + html2canvas) is ~500kB, so it is dynamically
 * imported only when a PDF is actually requested — keeping the admin bundle lean.
 */
export function usePdfExport() {
  async function exportSheet(sheet: HTMLElement | null, filename: string): Promise<void> {
    if (!sheet) return
    const { default: html2pdf } = await import('html2pdf.js')

    const saved = {
      transform: sheet.style.transform,
      boxShadow: sheet.style.boxShadow,
      border: sheet.style.border,
    }
    const viewport = sheet.closest<HTMLElement>('.cv-preview-viewport')
    const savedOverflow = viewport ? viewport.style.overflow : null
    if (viewport) viewport.style.overflow = 'visible'

    sheet.style.transform = 'none'
    sheet.style.boxShadow = 'none'
    sheet.style.border = 'none'

    const restore = (): void => {
      sheet.style.transform = saved.transform
      sheet.style.boxShadow = saved.boxShadow
      sheet.style.border = saved.border
      if (viewport) viewport.style.overflow = savedOverflow || ''
    }

    try {
      await html2pdf()
        .set({
          margin: 0,
          filename,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, logging: false },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
        })
        .from(sheet)
        .toPdf()
        .get('pdf')
        .then((pdf) => {
          while (pdf.internal.getNumberOfPages() > 1) {
            pdf.deletePage(pdf.internal.getNumberOfPages())
          }
        })
        .save()
    } finally {
      restore()
    }
  }

  return { exportSheet }
}
