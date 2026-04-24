import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const htmlFiles = [
  'index.html',
  'blog/index.html',
  'blog/how-murder-mystery-dinner-works.html',
  'blog/what-to-expect-murder-mystery-dinner.html',
  'blog/corporate-team-building-bangalore.html',
  'blog/unique-date-night-ideas-bangalore.html'
];
const widths = [480, 768, 1200];
const generatedDir = path.join(root, 'assets', 'img');
const seen = new Map();

async function resetGeneratedDir() {
  await fs.mkdir(generatedDir, { recursive: true });
  const entries = await fs.readdir(generatedDir);
  await Promise.all(
    entries
      .filter((entry) => entry.endsWith('.webp'))
      .map((entry) => fs.unlink(path.join(generatedDir, entry)))
  );
}

function normalizeSrc(src) {
  if (!src || src.startsWith('http') || src.startsWith('data:') || src.includes('facebook.com/tr')) return null;
  return src.replace(/^\//, '');
}

function relForHtml(htmlFile, assetPath) {
  const from = path.dirname(path.join(root, htmlFile));
  return path.relative(from, path.join(root, assetPath)).split(path.sep).join('/');
}

async function generateFor(src) {
  const normalized = normalizeSrc(src);
  if (!normalized) return null;
  const abs = path.join(root, normalized);
  try {
    await fs.access(abs);
  } catch {
    return null;
  }
  if (seen.has(normalized)) return seen.get(normalized);

  const sourceBuffer = await fs.readFile(abs);
  const hash = createHash('sha256').update(sourceBuffer).digest('hex').slice(0, 8);
  const meta = await sharp(abs).metadata();
  const base = normalized.replace(/\.[^.]+$/, '').replace(/[\/\\]/g, '-');
  const candidates = widths.filter((w) => w < meta.width);
  if (!candidates.includes(meta.width)) candidates.push(meta.width);

  const outputs = [];
  for (const width of candidates) {
    const rel = path.posix.join('assets/img', `${base}-${hash}-${width}.webp`);
    const out = path.join(root, rel);
    await sharp(abs)
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78, effort: 5 })
      .toFile(out);
    outputs.push({ width, rel });
  }

  const result = { width: meta.width, height: meta.height, outputs };
  seen.set(normalized, result);
  return result;
}

await resetGeneratedDir();

for (const htmlFile of htmlFiles) {
  let html = await fs.readFile(path.join(root, htmlFile), 'utf8');
  const imgTags = [...html.matchAll(/<img\b[^>]*>/g)];
  for (const match of imgTags) {
    const [tag] = match;
    const originalMatch = tag.match(/\bdata-original-src=["']([^"']+)["']/);
    const srcMatch = tag.match(/\bsrc=["']([^"']+)["']/);
    const src = originalMatch?.[1] || srcMatch?.[1];
    if (!src || src.includes('facebook.com/tr')) continue;
    const data = await generateFor(src);
    if (!data) continue;

    const srcset = data.outputs
      .map((item) => `${relForHtml(htmlFile, item.rel)} ${item.width}w`)
      .join(', ');
    const largest = data.outputs[data.outputs.length - 1];
    const sizeHint = tag.match(/\bdata-image-sizes=["']([^"']+)["']/)?.[1] || '(max-width: 768px) 100vw, 50vw';
    const priority = tag.includes('data-image-priority="high"');
    if (priority) {
      html = html.replace(
        /<link rel="preload" as="image" href="[^"]+" imagesrcset="[^"]+" imagesizes="[^"]+">/,
        `<link rel="preload" as="image" href="${relForHtml(htmlFile, data.outputs[0].rel)}" imagesrcset="${srcset}" imagesizes="${sizeHint}">`
      );
    }
    let next = tag;
    next = next.replace(/\swidth=["'][^"']*["']/g, '');
    next = next.replace(/\sheight=["'][^"']*["']/g, '');
    next = next.replace(/\sdecoding=["'][^"']*["']/g, '');
    next = next.replace(/\sloading=["'][^"']*["']/g, '');
    next = next.replace(/\sfetchpriority=["'][^"']*["']/g, '');
    next = next.replace(/\sdata-original-src=["'][^"']*["']/g, '');
    next = next.replace(/\ssrcset=["'][^"']*["']/g, '');
    next = next.replace(/\ssizes=["'][^"']*["']/g, '');
    next = next.replace(/\bsrc=["'][^"']+["']/, `src="${relForHtml(htmlFile, largest.rel)}"`);
    next = next.replace(/<img\b/, `<img width="${data.width}" height="${data.height}" decoding="async" loading="${priority ? 'eager' : 'lazy'}"${priority ? ' fetchpriority="high"' : ''} data-original-src="${src}"`);
    next = next.replace(/\s*\/?>$/, ` srcset="${srcset}" sizes="${sizeHint}">`);
    html = html.replace(tag, next);
  }
  await fs.writeFile(path.join(root, htmlFile), html);
}

console.log(`Optimized ${seen.size} source images into ${path.relative(root, generatedDir)}`);
