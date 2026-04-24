import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const htmlFiles = [
  'index.html',
  'blog/index.html',
  'blog/how-murder-mystery-dinner-works.html',
  'blog/what-to-expect-murder-mystery-dinner.html',
  'blog/corporate-team-building-bangalore.html',
  'blog/unique-date-night-ideas-bangalore.html',
  '404.html',
  'privacy.html',
  'terms.html'
];

let failed = false;

for (const file of htmlFiles) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  if (html.includes('cdn.tailwindcss.com')) {
    console.error(`${file}: still references Tailwind CDN`);
    failed = true;
  }
  if (html.includes('type="text/tailwindcss"')) {
    console.error(`${file}: still contains runtime Tailwind CSS`);
    failed = true;
  }
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    try {
      JSON.parse(match[1]);
    } catch (error) {
      console.error(`${file}: invalid JSON-LD: ${error.message}`);
      failed = true;
    }
  }
}

for (const asset of ['assets/css/site.css', 'assets/js/site.js', 'assets/js/analytics.js', '_headers']) {
  if (!fs.existsSync(path.join(root, asset))) {
    console.error(`Missing required asset: ${asset}`);
    failed = true;
  }
}

if (failed) process.exit(1);
console.log('Site validation passed');
