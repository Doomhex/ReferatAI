// Smart A4 Multi-page distribution engine
import { formatHandwrittenContent, SeededRandom } from './realism.js';

export const A4_WIDTH_PX = 794;  // 210mm at 96 DPI
export const A4_HEIGHT_PX = 1123; // 297mm at 96 DPI

/**
 * Splits raw text into page contents.
 * Respects explicit page breaks '---' and auto-splits overflowing paragraphs.
 */
export function paginateText(rawText, options = {}) {
  const {
    fontSize = 18,
    lineHeight = 1.6,
    paddingTop = 60,
    paddingBottom = 60,
    headerHeight = 40,
    footerHeight = 40,
    maxLinesPerPage = null
  } = options;

  if (!rawText || rawText.trim() === '') {
    return [''];
  }

  // 1. First split by manual page dividers '---'
  const explicitSections = rawText.split(/\n\s*---\s*\n/g);
  const finalPages = [];

  // Calculate safe printable height
  const printableHeight = A4_HEIGHT_PX - paddingTop - paddingBottom - headerHeight - footerHeight;
  const lineSpacingPx = fontSize * lineHeight;
  
  // Safe line capacity per A4 page (usually ~28 to 36 lines depending on font size)
  const safeLinesPerPage = maxLinesPerPage || Math.max(16, Math.floor(printableHeight / lineSpacingPx));

  explicitSections.forEach((section) => {
    const rawParagraphs = section.split('\n');
    let currentPageParagraphs = [];
    let currentLineCount = 0;

    for (let i = 0; i < rawParagraphs.length; i++) {
      const p = rawParagraphs[i];
      
      // Estimate how many visual lines this paragraph will occupy
      // An A4 page width has ~60-80 Russian characters per line depending on font
      const approxCharsPerLine = Math.max(35, Math.floor(580 / (fontSize * 0.55)));
      const pLines = p.trim() === '' ? 1 : Math.max(1, Math.ceil(p.length / approxCharsPerLine));

      // If adding this paragraph exceeds page capacity
      if (currentLineCount + pLines > safeLinesPerPage && currentPageParagraphs.length > 0) {
        // Push current page
        finalPages.push(currentPageParagraphs.join('\n'));
        currentPageParagraphs = [p];
        currentLineCount = pLines;
      } else {
        currentPageParagraphs.push(p);
        currentLineCount += pLines;
      }
    }

    if (currentPageParagraphs.length > 0) {
      finalPages.push(currentPageParagraphs.join('\n'));
    }
  });

  return finalPages.length > 0 ? finalPages : [''];
}
