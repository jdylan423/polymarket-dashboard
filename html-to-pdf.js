#!/usr/bin/env node

// Quick script to convert HTML to PDF using Playwright
const { chromium } = require('playwright');
const path = require('path');

async function convertHtmlToPdf(htmlFile, pdfFile) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  const htmlPath = path.resolve(htmlFile);
  await page.goto(`file://${htmlPath}`);
  
  await page.pdf({
    path: pdfFile,
    format: 'Letter',
    margin: {
      top: '0.5in',
      right: '0.5in',
      bottom: '0.5in',
      left: '0.5in'
    },
    printBackground: true
  });
  
  await browser.close();
  console.log(`✅ PDF created: ${pdfFile}`);
}

const htmlFile = process.argv[2] || 'laundromat-report-week1.html';
const pdfFile = process.argv[3] || htmlFile.replace('.html', '.pdf');

convertHtmlToPdf(htmlFile, pdfFile).catch(console.error);
