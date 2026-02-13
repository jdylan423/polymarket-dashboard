#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import chokidar from 'chokidar';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { fileURLToPath } from 'node:url';

import { renderInputToHtml } from './render.js';
import { htmlToPdf } from './pdf.js';

function nowDateString() {
  const d = new Date();
  // Example: 2026-02-06
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function defaultOutputPath(inputPath) {
  const dir = path.dirname(inputPath);
  const base = path.basename(inputPath, path.extname(inputPath));
  return path.join(dir, `${base}.pdf`);
}

async function generateOnce({ inputFile, outputFile, title, includeToc }) {
  const inputPath = path.resolve(inputFile);
  const outputPath = path.resolve(outputFile || defaultOutputPath(inputPath));
  const inputExt = path.extname(inputPath).toLowerCase();

  const inputText = await fs.readFile(inputPath, 'utf8');
  const dateStr = nowDateString();
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const assetsDir = path.resolve(__dirname, '../assets');

  const { html, title: resolvedTitle } = await renderInputToHtml({
    inputPath,
    inputText,
    inputExt,
    title,
    dateStr,
    includeToc,
    assetsDir
  });

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  await htmlToPdf({
    html,
    outputPath,
    title: resolvedTitle,
    dateStr,
    baseDir: path.dirname(inputPath)
  });

  return outputPath;
}

const argv = yargs(hideBin(process.argv))
  .scriptName('pdf-gen')
  .usage('$0 <input-file> [output-file]')
  .positional('input-file', {
    describe: 'Input .md or .html file',
    type: 'string'
  })
  .positional('output-file', {
    describe: 'Output .pdf path (default: alongside input)',
    type: 'string'
  })
  .option('title', {
    describe: 'Override report title (default: first H1 in Markdown, else file name)',
    type: 'string'
  })
  .option('no-toc', {
    describe: 'Disable table of contents',
    type: 'boolean',
    default: false
  })
  .option('watch', {
    alias: 'w',
    describe: 'Watch input file and regenerate on changes',
    type: 'boolean',
    default: false
  })
  .demandCommand(1)
  .help()
  .parseSync();

const [inputFile, outputFile] = argv._;

if (!inputFile) {
  process.stderr.write('Missing input file.\n');
  process.exit(2);
}

const includeToc = !argv['no-toc'];

async function run() {
  const out = await generateOnce({
    inputFile: String(inputFile),
    outputFile: outputFile ? String(outputFile) : undefined,
    title: argv.title,
    includeToc
  });

  process.stdout.write(`Wrote ${out}\n`);
}

async function runWatch() {
  const inputPath = path.resolve(String(inputFile));
  const outPath = outputFile ? path.resolve(String(outputFile)) : defaultOutputPath(inputPath);

  let running = false;
  let queued = false;

  const trigger = async () => {
    if (running) {
      queued = true;
      return;
    }
    running = true;
    try {
      const out = await generateOnce({
        inputFile: inputPath,
        outputFile: outPath,
        title: argv.title,
        includeToc
      });
      process.stdout.write(`[pdf-gen] ${new Date().toLocaleTimeString()} wrote ${out}\n`);
    } catch (err) {
      process.stderr.write(`[pdf-gen] ERROR: ${err?.stack || err}\n`);
    } finally {
      running = false;
      if (queued) {
        queued = false;
        await trigger();
      }
    }
  };

  await trigger();

  const watcher = chokidar.watch(inputPath, { ignoreInitial: true });
  watcher.on('change', trigger);
  watcher.on('error', (e) => process.stderr.write(`[pdf-gen] watcher error: ${e}\n`));

  process.stdout.write(`[pdf-gen] watching ${inputPath}\n`);
}

if (argv.watch) {
  runWatch();
} else {
  run().catch((err) => {
    process.stderr.write(String(err?.stack || err) + '\n');
    process.exit(1);
  });
}
