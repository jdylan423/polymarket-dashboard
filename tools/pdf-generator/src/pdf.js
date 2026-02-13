import path from 'node:path';
import { chromium } from 'playwright';

export async function htmlToPdf({
  html,
  outputPath,
  title,
  dateStr,
  baseDir,
  printBackground = true
}) {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    baseURL: 'file://' + baseDir.replace(/\\/g, '/') + '/',
  });

  const page = await context.newPage();

  // Load HTML and wait for all resources (including remote images/scripts) to finish.
  await page.setContent(html, { waitUntil: 'networkidle' });

  // Ensure fonts settle
  await page.evaluate(async () => {
    // @ts-ignore
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
  });

  const headerTemplate = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Inter, Roboto, Helvetica, Arial, sans-serif;
                font-size: 8.5pt; color: #6b7280; width: 100%;
                padding: 0 22px;">
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%; border-bottom:1px solid #e5e7eb; padding-bottom:6px;">
        <div style="max-width:70%; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(title)}</div>
        <div>${escapeHtml(dateStr)}</div>
      </div>
    </div>
  `;

  const footerTemplate = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Inter, Roboto, Helvetica, Arial, sans-serif;
                font-size: 8.5pt; color: #6b7280; width: 100%;
                padding: 0 22px;">
      <div style="display:flex; justify-content:space-between; align-items:center; width:100%; border-top:1px solid #e5e7eb; padding-top:6px;">
        <div></div>
        <div>Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>
      </div>
    </div>
  `;

  await page.pdf({
    path: outputPath,
    format: 'A4',
    printBackground,
    displayHeaderFooter: true,
    headerTemplate,
    footerTemplate,
    margin: {
      top: '70px',
      bottom: '65px',
      left: '58px',
      right: '58px'
    }
  });

  await context.close();
  await browser.close();

  return outputPath;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
