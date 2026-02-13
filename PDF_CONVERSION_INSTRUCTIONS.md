# PDF Conversion Instructions

The comprehensive slot game mechanics report has been created as:
- **Markdown:** `slot-game-mechanics-report.md`
- **HTML:** `slot-game-mechanics-report.html`

## Option 1: Convert using Browser (Easiest)

1. Open `slot-game-mechanics-report.html` in your web browser (Chrome, Safari, Firefox)
2. Press `Cmd+P` (Mac) or `Ctrl+P` (Windows) to open Print dialog
3. Choose "Save as PDF" as the destination
4. Save the file as `slot-game-mechanics-report.pdf`

This will create a well-formatted PDF with clickable table of contents.

## Option 2: Use Pandoc (If LaTeX installed)

If you have LaTeX installed (MacTeX, MiKTeX, or TeX Live):

```bash
pandoc slot-game-mechanics-report.md -o slot-game-mechanics-report.pdf \
  --pdf-engine=xelatex \
  -V geometry:margin=1in \
  -V fontsize=11pt \
  --toc \
  --toc-depth=2
```

## Option 3: Use md-to-pdf (Node.js)

```bash
npm install -g md-to-pdf
md-to-pdf slot-game-mechanics-report.md
```

## Option 4: Use Online Converter

Upload the markdown or HTML file to:
- https://markdown-to-pdf.com/
- https://cloudconvert.com/md-to-pdf
- https://www.markdowntopdf.com/

## Current Status

An automated PDF conversion is being attempted using md-to-pdf.
If you see `slot-game-mechanics-report.pdf` in this folder, it was successful.
Otherwise, use one of the methods above.
