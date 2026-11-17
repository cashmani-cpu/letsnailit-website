// Adds ?v=<content hash> to every assets/css and assets/js link in the HTML.
// /assets/* is served with a one-year immutable cache (_headers), so a file
// that keeps the same URL is never re-fetched by returning visitors. The hash
// changes only when the file changes. Run after build:css (part of `npm run build`).
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const skip = new Set(['node_modules', '.git', '.npm-cache', 'portal']);

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    if (skip.has(name)) return [];
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return htmlFiles(full);
    return name.endsWith('.html') ? [full] : [];
  });
}

const hashes = new Map();
function hashFor(file) {
  if (!hashes.has(file)) {
    hashes.set(file, createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 10));
  }
  return hashes.get(file);
}

const ref = /((?:href|src)=")([^"]*?assets\/(?:css|js)\/[^"?#]+)(?:\?v=[^"]*)?(")/g;
let changed = 0;

for (const html of htmlFiles(root)) {
  const before = readFileSync(html, 'utf8');
  const after = before.replace(ref, (_, open, path, close) => {
    const target = path.startsWith('/') ? join(root, path) : resolve(dirname(html), path);
    return `${open}${path}?v=${hashFor(target)}${close}`;
  });
  if (after !== before) {
    writeFileSync(html, after);
    changed += 1;
    console.log(`versioned ${relative(root, html)}`);
  }
}

console.log(`Asset versions up to date (${changed} file${changed === 1 ? '' : 's'} changed)`);
