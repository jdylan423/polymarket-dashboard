import fs from 'node:fs/promises';
import path from 'node:path';
import MarkdownIt from 'markdown-it';
import anchor from 'markdown-it-anchor';
import toc from 'markdown-it-table-of-contents';

function guessTitleFromMarkdown(mdText, fallbackTitle) {
  const lines = mdText.split(/\r?\n/);
  for (const line of lines) {
    const m = /^#\s+(.+?)\s*$/.exec(line);
    if (m) return m[1];
  }
  return fallbackTitle;
}

export async function loadTemplateAssets(assetsDir) {
  const [css, template] = await Promise.all([
    fs.readFile(path.join(assetsDir, 'report.css'), 'utf8'),
    fs.readFile(path.join(assetsDir, 'template.html'), 'utf8')
  ]);
  return { css, template };
}

export function buildMarkdownRenderer({ includeToc = true } = {}) {
  const md = new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true
  });

  md.use(anchor, {
    permalink: anchor.permalink.ariaHidden({
      placement: 'before',
      symbol: '#'
    }),
    slugify: (s) =>
      encodeURIComponent(
        s
          .trim()
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w\-\u00C0-\u024f%]+/g, '')
      )
  });

  if (includeToc) {
    md.use(toc, {
      includeLevel: [1, 2, 3],
      markerPattern: /^\[\[toc\]\]$/im
    });
  }

  return md;
}

export async function renderInputToHtml({
  inputPath,
  inputText,
  inputExt,
  title,
  dateStr,
  includeToc,
  assetsDir
}) {
  const { css, template } = await loadTemplateAssets(assetsDir);

  let contentHtml = '';
  let finalTitle = title;

  if (inputExt === '.html' || inputExt === '.htm') {
    // If the input looks like a full HTML document, use it as-is but inject our CSS.
    // Otherwise treat it as a fragment and wrap in the report template.
    const looksLikeDoc = /<html[\s>]/i.test(inputText) || /<!doctype\s+html/i.test(inputText);

    if (looksLikeDoc) {
      const injected = injectCssIntoHtmlDocument(inputText, css);
      finalTitle = finalTitle || extractTitleFromHtml(injected) || path.basename(inputPath);
      return { html: injected, title: finalTitle };
    }

    contentHtml = inputText;
    finalTitle = finalTitle || path.basename(inputPath);
  } else {
    const md = buildMarkdownRenderer({ includeToc });
    finalTitle = finalTitle || guessTitleFromMarkdown(inputText, path.basename(inputPath));

    // Ensure TOC marker exists near the top if enabled and user didn't include it.
    let mdText = inputText;
    if (includeToc && !/^\s*\[\[toc\]\]\s*$/im.test(mdText)) {
      mdText = `[[toc]]\n\n${mdText}`;
    }

    contentHtml = md.render(mdText);
  }

  // If TOC is enabled, markdown-it-table-of-contents injects a <nav class="table-of-contents">...
  // We wrap it in our styled TOC box by post-processing.
  if (includeToc) {
    contentHtml = contentHtml.replace(
      /<nav class="table-of-contents">([\s\S]*?)<\/nav>/,
      `<section class="toc"><div class="toc-title">Table of Contents</div><nav class="table-of-contents">$1</nav></section>`
    );
  }

  const html = template
    .replaceAll('{{TITLE}}', escapeHtml(finalTitle))
    .replace('{{DATE}}', escapeHtml(dateStr))
    .replace('{{CSS}}', css)
    .replace('{{TOC}}', '')
    .replace('{{CONTENT}}', contentHtml);

  return { html, title: finalTitle };
}

function escapeHtml(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function extractTitleFromHtml(html) {
  const m = /<title>\s*([^<]*?)\s*<\/title>/i.exec(html);
  return m ? m[1].trim() : null;
}

function injectCssIntoHtmlDocument(html, css) {
  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `<style>\n${css}\n</style>\n</head>`);
  }
  // Fallback: prepend a <style> block at top.
  return `<style>\n${css}\n</style>\n${html}`;
}
