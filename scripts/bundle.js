#!/usr/bin/env node
/* Bundles the modular www/ app into a single self-contained HTML file.
 * Inlines every <script src="..."> (preserving order), keeps the <style>
 * and <body> verbatim, and strips the browser-sync client (broken offline).
 *
 * Usage:  node scripts/bundle.js
 * Output: www/gutsense_single.html
 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'www', 'index.html');
const OUT = path.join(ROOT, 'www', 'gutsense_single.html');

const html = fs.readFileSync(SRC, 'utf8');

// Replace every <script src="..."> with the inlined file contents.
// Skip the browser-sync client (won't resolve under file:// and isn't part of the app).
const scriptRe = /<script\b[^>]*\bsrc="([^"]+)"[^>]*>\s*<\/script>/g;

let missing = 0;
let inlined = 0;
let result = html.replace(scriptRe, (wholeTag, srcAttr) => {
  // Skip dev-only / secret files that must stay external (not inlined).
  if (srcAttr.indexOf('browser-sync') >= 0) {
    return '<!-- stripped: ' + srcAttr + ' (dev-only) -->';
  }
  if (srcAttr.indexOf('config.js') >= 0) {
    return '<!-- external: ' + srcAttr + ' (keep secret key out of bundle) -->';
  }
  const filePath = path.join(ROOT, 'www', srcAttr.split('?')[0]);
  if (!fs.existsSync(filePath)) {
    missing++;
    console.error('  ✗ missing: ' + srcAttr);
    return '<!-- MISSING: ' + srcAttr + ' -->';
  }
  const code = fs.readFileSync(filePath, 'utf8');
  inlined++;
  console.log('  ✓ ' + srcAttr + '  (' + Math.round(code.length / 1024) + ' KB)');
  return '<script>\n' + code + '\n</script>';
});

// Sanity: ensure no external script src remains (besides our stripped comment).
const leftover = result.match(/<script\b[^>]*\bsrc="/g);
if (leftover && leftover.length) {
  console.error('  ! unexpected remaining src scripts: ' + leftover.length);
}

fs.writeFileSync(OUT, result, 'utf8');
const kb = Math.round(result.length / 1024);
console.log('\nInlined ' + inlined + ' script(s), ' + (missing ? missing + ' missing, ' : '') +
  'output = ' + path.relative(ROOT, OUT) + ' (' + kb + ' KB)');
