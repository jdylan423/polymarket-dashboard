# PDF Generator (pdf-gen)

Generate professional, print-ready PDF reports from **Markdown** or **HTML** using **Playwright (Chromium)**.

## Install

From this folder:

```bash
cd /Users/penn/.openclaw/workspace/tools/pdf-generator
npm install
```

Notes:
- The `postinstall` step runs: `playwright install chromium`

## Usage

```bash
pdf-gen <input-file> [output-file]
```

Examples:

### Markdown → PDF
```bash
pdf-gen ./report.md
pdf-gen ./report.md ./out/report.pdf
```

### HTML → PDF
```bash
pdf-gen ./report.html ./out/report.pdf
```

### Watch mode
```bash
pdf-gen ./report.md ./out/report.pdf --watch
```

### Disable Table of Contents
```bash
pdf-gen ./report.md ./out/report.pdf --no-toc
```

### Override title
```bash
pdf-gen ./report.md ./out/report.pdf --title "Weekly Ops Report"
```

## Markdown features supported

- Tables (GitHub-flavored style)
- Images (`![](path/to.png)`), including relative paths (resolved relative to the input file)
- Inline HTML inside Markdown
- Automatic **Table of Contents** (unless `--no-toc`)
  - If your Markdown already contains `[[toc]]`, it will be used.
  - Otherwise the tool injects a TOC at the top automatically.

## Styling

Business-report defaults:
- Serif body text, sans-serif headings
- Clean margins and spacing
- Header/footer with report title, date, and page numbers
- Avoid page breaks inside tables/figures/code blocks
- New page before each top-level section (`# Heading`)

To customize styling, edit:
- `assets/report.css`
- `assets/template.html`

## Test on laundromat report

```bash
cd /Users/penn/.openclaw/workspace/tools/pdf-generator
npm install
node ./src/cli.js ../../laundromat-report-week1.md ../../laundromat-report-week1.pdf
```
