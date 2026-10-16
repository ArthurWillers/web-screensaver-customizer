// SPDX-License-Identifier: MIT
// Spacing ported from Omarchy: Copyright (c) David Heinemeier Hansson.
// Local additions: Copyright (c) 2026 Web Screensaver Customizer contributors.
const FONT_URL = new URL('../../fonts/Omarchy-Delta-Corps-Priest-1.flf', import.meta.url);
const HARDBLANK = '\u0001';
export const MAX_TEXT_LENGTH = 24;

export function normalizeOmarchyText(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z0-9 ]/g, '').slice(0, MAX_TEXT_LENGTH);
}

export async function loadOmarchyFont() {
  const response = await fetch(FONT_URL);
  if (!response.ok) throw new Error(`Omarchy font ${response.status}`);

  const lines = (await response.text()).replace(/\r/g, '').split('\n');
  const header = lines[0].split(/\s+/);
  const height = Number(header[1]);
  const commentLines = Number(header[5]);
  if (!Number.isInteger(height) || height < 1 || !Number.isInteger(commentLines)) {
    throw new Error('Invalid FIGfont header');
  }

  const body = lines.slice(1 + commentLines);
  const glyphs = new Map();
  for (let code = 32; code <= 126; code++) {
    const start = (code - 32) * height;
    const glyph = body.slice(start, start + height).map((row) =>
      row.replace(/@+$/, '').replaceAll('$', HARDBLANK).replace(/ +$/, ''),
    );
    if (glyph.length === height) glyphs.set(String.fromCharCode(code), glyph);
  }
  return { height, glyphs };
}

export function renderOmarchyText(value, font) {
  const normalized = normalizeOmarchyText(value);
  const output = Array(font.height).fill('');
  const trailing = Array(font.height).fill(0);
  let placedGlyph = false;

  for (const char of normalized) {
    const glyph = font.glyphs.get(char);
    if (!glyph) continue;
    const width = Math.max(...glyph.map((row) => row.length));
    if (width === 0) continue;
    const pieces = glyph.map((row) => row.padEnd(width, ' '));

    if (!placedGlyph) {
      for (let row = 0; row < font.height; row++) {
        output[row] = pieces[row].replace(/ +$/, '');
        trailing[row] = width - output[row].length;
      }
      placedGlyph = true;
      continue;
    }

    let overlap = Infinity;
    for (let row = 0; row < font.height; row++) {
      const leading = width - pieces[row].replace(/^ +/, '').length;
      overlap = Math.min(overlap, trailing[row] + leading);
    }

    for (let row = 0; row < font.height; row++) {
      const cut = Math.min(overlap, trailing[row]);
      const keep = overlap - cut;
      const remaining = trailing[row] - cut;
      const fragment = pieces[row].slice(keep);
      const body = fragment.replace(/ +$/, '');
      if (body === '') {
        trailing[row] = remaining + fragment.length;
      } else {
        output[row] += ' '.repeat(remaining) + body;
        trailing[row] = fragment.length - body.length;
      }
    }
  }

  return output
    .map((row) => row.replaceAll(HARDBLANK, ' ').replace(/ +$/, ''))
    .join('\n');
}
