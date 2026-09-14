/**
 * Export A4 sheet pages to a multi-page PDF.
 *
 * Strategy: render each .cv-paper-page INDIVIDUALLY via dom-to-image-more → jsPDF.
 * We use dom-to-image-more because html2canvas has fundamental bugs with font metrics 
 * (ascent/descent calculation) that cause text to shift downwards by several pixels
 * depending on line-height and font-family combinations. dom-to-image-more uses
 * SVG <foreignObject> to render the DOM using the browser's own native rendering engine,
 * which guarantees pixel-perfect accuracy for text positioning.
 */
export function usePdfExport() {
  async function exportSheet(sheet: HTMLElement | null, filename: string): Promise<void> {
    if (!sheet) return

    // Dynamic imports
    const [{ default: domtoimage }, { default: jsPDF }] = await Promise.all([
      import('dom-to-image-more'),
      import('jspdf'),
    ])

    // Wait for webfonts
    if (document.fonts) {
      await document.fonts.ready
    }

    const pageEls = Array.from(sheet.querySelectorAll<HTMLElement>('.cv-paper-page'))
    if (pageEls.length === 0) return

    // Save & prepare the viewport so nothing is clipped
    const viewport = sheet.closest<HTMLElement>('.cv-preview-viewport')
    const saved = {
      sheetTransform: sheet.style.transform,
      viewportOverflow: viewport?.style.overflow ?? '',
      viewportScrollTop: viewport?.scrollTop ?? 0,
    }

    sheet.style.transform = 'none'
    if (viewport) {
      viewport.style.overflow = 'visible'
      viewport.scrollTop = 0
    }

    try {
      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
      const pdfW = 210
      const pdfH = 297

      for (let i = 0; i < pageEls.length; i++) {
        const pageEl = pageEls[i]

        if (i > 0) pdf.addPage()

        // Render this single page element with dom-to-image-more.
        // It uses native browser rendering via SVG, avoiding the html2canvas text shift bug.
        // We scale by 2 for higher resolution (Retina-like quality).
        const scale = 2
        const imgData = await domtoimage.toJpeg(pageEl, {
          quality: 0.98,
          width: 794 * scale,
          height: 1122 * scale,
          style: {
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
            width: '794px',
            height: '1122px',
          },
          bgcolor: '#ffffff',
          cacheBust: true, // Prevents issues with cached fonts/images across renders
        })

        pdf.addImage(imgData, 'JPEG', 0, 0, pdfW, pdfH, `page_${i}`, 'FAST')
      }

      pdf.save(filename)
    } finally {
      // Restore viewport
      sheet.style.transform = saved.sheetTransform
      if (viewport) {
        viewport.style.overflow = saved.viewportOverflow
        viewport.scrollTop = saved.viewportScrollTop
      }
    }
  }

  return { exportSheet }
}
