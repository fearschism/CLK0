/*
 * Build the two self-contained pages.
 *
 *   node tools/build.mjs           write index.html and console.html
 *   node tools/build.mjs --check   fail if either file is out of date
 *
 * Sources live in src/. Each page template carries placeholders that this
 * script replaces with the actual stylesheet, scripts and logo, so the result
 * is one HTML file with no external references at all — it can be emailed to a
 * reporting organisation and opened straight from the attachment.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');

const PAGES = [
  {
    template: 'questionnaire.html',
    output: 'index.html',
    scripts: ['branding.js', 'framework.js', 'util.js', 'survey.js']
  },
  {
    template: 'console.html',
    output: 'console.html',
    scripts: ['branding.js', 'framework.js', 'scoring.js', 'charts.js', 'util.js', 'console.js']
  }
];

/** Guard against a stray `</script>` inside inlined JS closing the block early. */
function safeForScriptBlock(code) {
  return code.replace(/<\/script/gi, '<\\/script');
}

/** Suffix every id in an SVG, and every reference to it, so copies never clash. */
function uniqueIds(svg, suffix) {
  const ids = [...svg.matchAll(/\sid="([A-Za-z][\w-]*)"/g)].map(match => match[1]);
  return ids.reduce((out, id) => out
    .replace(new RegExp('id="' + id + '"', 'g'), `id="${id}-${suffix}"`)
    .replace(new RegExp('url\\(#' + id + '\\)', 'g'), `url(#${id}-${suffix})`)
    .replace(new RegExp('href="#' + id + '"', 'g'), `href="#${id}-${suffix}"`), svg);
}

function dataUri(svg) {
  return 'data:image/svg+xml,' + encodeURIComponent(svg.replace(/\s*\n\s*/g, ' ').trim());
}

async function buildPage(page) {
  const template = await readFile(join(src, 'pages', page.template), 'utf8');
  const css = await readFile(join(src, 'css', 'styles.css'), 'utf8');
  const logo = await readFile(join(src, 'brand', 'logo.svg'), 'utf8');
  const favicon = await readFile(join(src, 'brand', 'favicon.svg'), 'utf8');

  const scripts = [];
  for (const file of page.scripts) {
    scripts.push('/* ---- ' + file + ' ---- */\n' + safeForScriptBlock(await readFile(join(src, 'js', file), 'utf8')));
  }

  // The logo is inlined as markup rather than an <img> so it stays crisp in
  // print and inherits nothing from an external file.
  const logoInline = logo
    .replace(/<\?xml[^>]*\?>\s*/g, '')
    .replace(/<svg /, '<svg class="crest" role="img" aria-hidden="true" ')
    .trim();

  // The logo appears twice (screen header and print letterhead). Any ids inside
  // it — gradients, filters, clip paths — must be unique per copy, or the
  // second copy references a hidden element and paints blank.
  let logoCount = 0;
  const logoFor = () => uniqueIds(logoInline, 'lg' + (++logoCount));

  let html = template
    .replace('<!--@FAVICON-->', '<link rel="icon" href="' + dataUri(favicon) + '" type="image/svg+xml" />')
    .replace('<!--@STYLES-->', '<style>\n' + css.trim() + '\n</style>')
    .replace('<!--@SCRIPTS-->', '<script>\n' + scripts.join('\n\n') + '\n</script>')
    .replace(/<!--@LOGO-->/g, () => logoFor());

  const banner = '<!--\n' +
    '  Generated file — do not edit directly.\n' +
    '  Built from src/ by tools/build.mjs. Everything is inlined, so this single\n' +
    '  file works offline and can be sent as an email attachment.\n' +
    '-->\n';
  html = html.replace('<!DOCTYPE html>', '<!DOCTYPE html>\n' + banner.trimEnd());

  const leftovers = [
    [/<link[^>]+rel=["']stylesheet["']/i, 'external stylesheet link'],
    [/<script[^>]+src=/i, 'external script src'],
    [/<img[^>]+src=["'](?!data:)/i, 'external image'],
    [/<!--@[A-Z]+-->/, 'unreplaced build placeholder']
  ];
  for (const [pattern, label] of leftovers) {
    if (pattern.test(html)) throw new Error(page.output + ' still contains an ' + label);
  }

  return html;
}

const check = process.argv.includes('--check');
let stale = 0;

for (const page of PAGES) {
  const html = await buildPage(page);
  const target = join(root, page.output);

  if (check) {
    const current = existsSync(target) ? await readFile(target, 'utf8') : '';
    if (current !== html) {
      console.error(`  stale  ${page.output} — run: node tools/build.mjs`);
      stale++;
    } else {
      console.log(`  ok     ${page.output} is up to date (${(html.length / 1024).toFixed(0)} KB)`);
    }
    continue;
  }

  await writeFile(target, html, 'utf8');
  console.log(`  built  ${page.output}  ${(html.length / 1024).toFixed(0)} KB, self-contained`);
}

if (check && stale) process.exit(1);
