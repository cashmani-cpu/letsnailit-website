// Builds branded static assets from existing artwork (no watermarked photos):
//   share-card.jpg              1200x630 social/search share image
//   logo-mark-180.png / -512    raster copies of logo-mark.svg for icons
//   mystery-props-evidence.jpg  mystery-props.png cropped to the watch + envelope (no 'Blackwood' case file)
//   blog-mechanics-board.jpg    blog-mechanics.png cropped to the evidence board (hides the dossier text)
// Run: node scripts/build-brand-assets.mjs  (then npm run build:images)
import sharp from 'sharp';

const W = 1200, H = 630;
const ink = '#1c1b19', base = '#d2c7b3', accent = '#6b1111';

const portrait = (file) =>
  sharp(file)
    .resize(250, 330, { fit: 'cover', position: 'top' })
    .modulate({ saturation: 0 })
    .tint({ r: 112, g: 92, b: 66 })
    .linear(1.15, -10)
    .extend({ top: 8, bottom: 8, left: 8, right: 8, background: '#f3ecdf' })
    .toBuffer();

const [p1, p2, p3] = await Promise.all([
  portrait('suspects/memsahib.png'),
  portrait('suspects/chickpet-merchant.png'),
  portrait('suspects/khansama.png')
]);
const logo = await sharp('logo-final.png').resize(330, 330).toBuffer();

const overlay = Buffer.from(`
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="none" stroke="${ink}" stroke-width="6"/>
  <rect x="24" y="24" width="${W - 48}" height="${H - 48}" fill="none" stroke="${ink}" stroke-width="1.5"/>
  <text x="60" y="78" font-family="Georgia, 'Times New Roman', serif" font-size="20" letter-spacing="5" fill="${ink}" font-weight="700">THE BANGALORE GAZETTE · LATE EDITION</text>
  <line x1="60" y1="96" x2="790" y2="96" stroke="${ink}" stroke-width="2"/>
  <text x="60" y="545" font-family="Georgia, 'Times New Roman', serif" font-size="44" font-style="italic" font-weight="700" fill="${ink}">Every guest is a suspect.</text>
  <text x="60" y="586" font-family="Georgia, 'Times New Roman', serif" font-size="22" letter-spacing="3" fill="${accent}" font-weight="700">PRIVATE MURDER MYSTERY · GROUPS OF 10+ · BANGALORE</text>
  <g transform="translate(760 120) rotate(-9)">
    <rect x="0" y="0" width="170" height="52" fill="none" stroke="${accent}" stroke-width="4"/>
    <text x="85" y="36" text-anchor="middle" font-family="Georgia, serif" font-size="26" font-weight="700" letter-spacing="6" fill="${accent}">WANTED</text>
  </g>
</svg>`);

await sharp({ create: { width: W, height: H, channels: 3, background: base } })
  .composite([
    { input: p1, left: 60, top: 128 },
    { input: p2, left: 300, top: 118 },
    { input: p3, left: 540, top: 128 },
    { input: logo, left: 832, top: 200 },
    { input: overlay, left: 0, top: 0 }
  ])
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile('share-card.jpg');

for (const size of [180, 512]) {
  await sharp('logo-mark.svg', { density: 400 }).resize(size, size).png().toFile(`logo-mark-${size}.png`);
}

const meta = await sharp('blog-mechanics.png').metadata();
await sharp('blog-mechanics.png')
  .extract({ left: 0, top: 0, width: meta.width, height: Math.round(meta.height * 0.32) })
  .jpeg({ quality: 86 })
  .toFile('blog-mechanics-board.jpg');

// Fig. 2 on the homepage: keep the watch + sealed envelope, drop the unrelated case file on the right
const props = await sharp('mystery-props.png').metadata();
await sharp('mystery-props.png')
  .extract({ left: 0, top: Math.round(props.height * 0.12), width: Math.round(props.width * 0.535), height: Math.round(props.height * 0.8) })
  .jpeg({ quality: 88 })
  .toFile('mystery-props-evidence.jpg');

console.log('Brand assets built');
