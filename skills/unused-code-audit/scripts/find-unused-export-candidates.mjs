#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const scanRoot = path.resolve(root, process.argv[2] ?? '.');
const searchRoots = (process.argv[3] ? process.argv[3].split(',') : ['.'])
  .map((entry) => path.resolve(root, entry));
const ignoredDirs = new Set([
  '.next',
  '.turbo',
  'build',
  'coverage',
  'dist',
  'node_modules',
]);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith('.')) continue;
      if (!ignoredDirs.has(entry.name)) walk(fullPath, out);
      continue;
    }

    if (/\.(tsx?|jsx?)$/.test(entry.name)) out.push(fullPath);
  }

  return out;
}

function relative(filePath) {
  return path.relative(root, filePath).replaceAll(path.sep, '/');
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isSimpleIndexBarrelFor(name, source, file) {
  const baseName = path.basename(file);
  if (baseName !== 'index.ts' && baseName !== 'index.tsx') return false;

  const escaped = escapeRegExp(name);
  const namedExport = new RegExp(`export\\s+(?:type\\s+)?\\{[^}]*\\b${escaped}\\b[^}]*\\}\\s+from`);
  const starExport = /export\s+(?:type\s+)?\*\s+from/.test(source);
  return namedExport.test(source) || starExport;
}

function collectExportedSymbols(source) {
  const symbols = [];
  const seen = new Set();

  const add = (name, kind) => {
    if (name === 'default') return;
    const key = `${name}:${kind}`;
    if (seen.has(key)) return;
    seen.add(key);
    symbols.push({ name, kind });
  };

  for (const match of source.matchAll(
    /export\s+(async\s+)?function\s+([A-Za-z_$][\w$]*)\b/g
  )) {
    add(match[2], 'function');
  }

  for (const match of source.matchAll(/export\s+class\s+([A-Za-z_$][\w$]*)\b/g)) {
    add(match[1], 'class');
  }

  for (const match of source.matchAll(
    /export\s+const\s+([A-Za-z_$][\w$]*)\b/g
  )) {
    add(match[1], /^[A-Z]/.test(match[1]) ? 'component-or-constant' : 'constant');
  }

  for (const match of source.matchAll(
    /export\s+(?:interface|type)\s+([A-Za-z_$][\w$]*)\b/g
  )) {
    add(match[1], 'type');
  }

  for (const match of source.matchAll(/export\s+\{([^}]+)\}/g)) {
    for (const rawPart of match[1].split(',')) {
      const part = rawPart.trim();
      if (!part || part.startsWith('type ')) continue;
      const aliasMatch = part.match(/\bas\s+([A-Za-z_$][\w$]*)$/);
      const directMatch = part.match(/^([A-Za-z_$][\w$]*)$/);
      const name = aliasMatch?.[1] ?? directMatch?.[1];
      if (name) add(name, 're-export-or-alias');
    }
  }

  return symbols;
}

const allFiles = searchRoots.flatMap((dir) => walk(dir));
const scannedFiles = walk(scanRoot);
const candidates = [];

for (const file of scannedFiles) {
  const source = fs.readFileSync(file, 'utf8');
  const exportedSymbols = collectExportedSymbols(source);

  for (const symbol of exportedSymbols) {
    const referencePattern = new RegExp(`\\b${escapeRegExp(symbol.name)}\\b`);
    const hits = [];

    for (const candidateFile of allFiles) {
      if (path.resolve(candidateFile) === path.resolve(file)) continue;

      const candidateSource = fs.readFileSync(candidateFile, 'utf8');
      if (!referencePattern.test(candidateSource)) continue;
      if (isSimpleIndexBarrelFor(symbol.name, candidateSource, candidateFile)) continue;

      hits.push(relative(candidateFile));
    }

    if (hits.length === 0) {
      candidates.push({ ...symbol, file: relative(file) });
    }
  }
}

console.log(
  JSON.stringify(
    candidates.sort((a, b) => a.file.localeCompare(b.file) || a.name.localeCompare(b.name)),
    null,
    2
  )
);
