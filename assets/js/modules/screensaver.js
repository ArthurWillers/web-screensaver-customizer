// Web Screensaver Customizer: ttfx at 120fps on a black terminal-sized canvas.
// Adapted from omacom/omarchy-site; custom text is rendered using Omarchy's FIGfont.

import init, { Session, effect_catalog } from '../wte/ttfx.js';
import { FONT_FAMILY, FONT_SIZE, paintFrame } from '../wte/paint.js';
import { createEffectPicker } from './screensaver-picker.js';
import { loadOmarchyFont, normalizeOmarchyText, renderOmarchyText } from './omarchy-font.js';

const WTE_WASM_URL = new URL('../wte/ttfx.wasm', import.meta.url);
const FRAME_RATE = 120;
const FRAME_MS = 1000 / FRAME_RATE;
const MAX_CATCH_UP_MS = FRAME_MS * 4;
const MAX_TERMINAL_CELLS = 200000;
let PREFERRED_CELL_WIDTH = 11;
const STATIC_GREEN = 0x9ece6a;
const FONT_WAIT_MS = 1000;

function prefersReducedMotion() {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function artFromPre(pre) {
  let text = pre.textContent ?? '';
  if (text.startsWith('\n')) text = text.slice(1);
  return text.replace(/\n+$/, '');
}

function measureArt(text) {
  const lines = text.split('\n');
  let columns = 1;
  for (const line of lines) {
    columns = Math.max(columns, [...line].length);
  }
  return { columns, rows: Math.max(1, lines.length) };
}

function terminalMetrics(cssWidth, cssHeight, art) {
  const { columns: artColumns, rows: artRows } = measureArt(art);
  const widthRatio = Math.max(1, cssWidth - 32) / artColumns;
  const heightRatio = Math.max(1, cssHeight - 32) / (artRows * 2);
  const fitWidth = widthRatio >= 1 ? Math.floor(widthRatio) : widthRatio;
  const fitHeight = heightRatio >= 1 ? Math.floor(heightRatio) : heightRatio;
  const cellWidth = Math.max(0.1, Math.min(PREFERRED_CELL_WIDTH, fitWidth, fitHeight));
  const cellHeight = cellWidth * 2;
  const columns = Math.max(artColumns, Math.floor(cssWidth / cellWidth));
  const rows = Math.max(artRows, Math.min(Math.floor(cssHeight / cellHeight),
    Math.floor(MAX_TERMINAL_CELLS / columns)));
  return {
    cellWidth,
    cellHeight,
    fontSize: Math.max(1, Math.round(cellHeight / 1.2)),
    columns,
    rows,
    cssWidth,
    cssHeight,
  };
}

function afterFonts() {
  if (document.fonts?.load == null) {
    return Promise.resolve();
  }
  return Promise.race([
    document.fonts.load(`${FONT_SIZE}px "Inter"`).then(() => document.fonts.ready).catch(() => {}),
    new Promise((resolve) => {
      window.setTimeout(resolve, FONT_WAIT_MS);
    }),
  ]);
}

async function loadWasm() {
  const response = await fetch(WTE_WASM_URL);
  if (!response.ok) {
    throw new Error(`ttfx wasm ${response.status}`);
  }
  return response.arrayBuffer();
}

function catalogNames(json) {
  const parsed = JSON.parse(json);
  if (!Array.isArray(parsed)) {
    return [];
  }
  return parsed
    .filter((item) => item && typeof item.name === 'string')
    .map((item) => item.name);
}

function sizeCanvas(canvas, cssWidth, cssHeight) {
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  const width = Math.max(1, Math.floor(cssWidth * dpr));
  const height = Math.max(1, Math.floor(cssHeight * dpr));
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2d canvas is unavailable');
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function staticFrame(metrics, art) {
  const { columns, rows } = metrics;
  const { columns: artColumns, rows: artRows } = measureArt(art);
  const lines = art.split('\n');
  const originCol = Math.floor((columns - artColumns) / 2);
  const originRow = Math.floor((rows - artRows) / 2);
  const count = columns * rows;
  const symbols = new Uint32Array(count).fill(0x20);
  const fg = new Uint32Array(count);
  const bg = new Uint32Array(count);
  const flags = new Uint8Array(count);
  for (let row = 0; row < artRows; row++) {
    const chars = [...(lines[row] ?? '')];
    for (let col = 0; col < chars.length; col++) {
      const x = originCol + col;
      const y = originRow + row;
      if (x < 0 || x >= columns || y < 0 || y >= rows) continue;
      const cp = chars[col].codePointAt(0);
      if (cp === 0x20) continue;
      const index = y * columns + x;
      symbols[index] = cp;
      fg[index] = STATIC_GREEN;
    }
  }
  return { symbols, fg, bg, flags, width: columns, height: rows };
}

function paintStatic(ctx, metrics, art) {
  const frame = staticFrame(metrics, art);
  paintFrame(
    ctx,
    metrics,
    frame.symbols,
    frame.fg,
    frame.bg,
    frame.flags,
    frame.width,
    frame.height,
    true,
    FONT_FAMILY,
  );
}

function isFullscreen() {
  return document.fullscreenElement != null || document.webkitFullscreenElement != null;
}

async function toggleFullscreen() {
  const root = document.documentElement;
  if (isFullscreen()) {
    const exit = document.exitFullscreen ?? document.webkitExitFullscreen;
    if (typeof exit === 'function') await exit.call(document);
    return;
  }
  const request = root.requestFullscreen ?? root.webkitRequestFullscreen;
  if (typeof request !== 'function') throw new Error('Fullscreen unavailable');
  await request.call(root);
}

function markStatic() {
  document.documentElement.classList.remove('screensaver--animated');
  document.documentElement.classList.add('screensaver--static');
}

function markAnimated() {
  document.documentElement.classList.remove('screensaver--static');
  document.documentElement.classList.add('screensaver--animated');
  document.documentElement.classList.add('screensaver--rendered');
}


function ready() {
  const root = document.documentElement;
  const canvas = document.getElementById('screensaver');
  const pre = document.getElementById('screensaver-art');
  const textInput = document.getElementById('custom-text');
  const effectInput = document.getElementById('custom-effect');
  const sizeInput = document.getElementById('custom-size');
  const sizeValue = document.getElementById('custom-size-value');
  const panel = document.getElementById('customize-panel');
  const toggle = document.getElementById('customize-toggle');
  const status = document.getElementById('customize-error');
  const validation = document.getElementById('text-validation');
  const applyButton = document.getElementById('apply-customization');
  if (!(canvas instanceof HTMLCanvasElement) || !(pre instanceof HTMLPreElement)) return;

  let input = artFromPre(pre);
  let font = null;
  let rendererReady = false;
  let animated = false;
  let session = null;
  let metrics = null;
  let ctx = null;
  let picker = null;
  let currentEffect = '';
  let symbols = new Uint32Array();
  let fg = new Uint32Array();
  let bg = new Uint32Array();
  let flags = new Uint8Array();
  let frameWidth = 0;
  let frameHeight = 0;
  let acc = 0;
  let lastTs = 0;
  let raf = 0;
  let running = false;
  let renderTimer = 0;
  let statusTimer = 0;
  let pointerTimer = 0;
  let shortcutsTimer = 0;
  let resizeRaf = 0;

  function showStatus(message) {
    window.clearTimeout(statusTimer);
    status.textContent = message;
    status.classList.toggle('visible', Boolean(message));
    if (message) statusTimer = window.setTimeout(() => status.classList.remove('visible'), 6000);
  }

  function hideShortcutInfo() {
    window.clearTimeout(shortcutsTimer);
    root.classList.remove('screensaver--show-shortcuts');
  }

  function showShortcutInfo() {
    hideShortcutInfo();
    root.classList.add('screensaver--show-shortcuts');
    shortcutsTimer = window.setTimeout(hideShortcutInfo, 3500);
  }

  function syncFullscreen() {
    root.classList.toggle('screensaver--fullscreen', isFullscreen());
    if (!isFullscreen()) hideShortcutInfo();
  }

  function revealPointer() {
    root.classList.add('screensaver--pointer-visible');
    window.clearTimeout(pointerTimer);
    if (panel.hidden) {
      pointerTimer = window.setTimeout(() => {
        root.classList.remove('screensaver--pointer-visible');
      }, 2200);
    }
  }

  function openPanel(open) {
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    root.classList.toggle('screensaver--customizing', open);
    if (open) {
      hideShortcutInfo();
      window.clearTimeout(pointerTimer);
      root.classList.add('screensaver--pointer-visible');
      if (!textInput.disabled) textInput.focus();
      else sizeInput.focus();
    } else {
      if (isFullscreen()) document.body.focus({ preventScroll: true });
      else toggle.focus({ preventScroll: true });
      revealPointer();
    }
  }

  function validateText() {
    const valid = normalizeOmarchyText(textInput.value).trim() !== '';
    const message = valid ? '' : 'Digite ao menos uma letra ou número.';
    textInput.setCustomValidity(message);
    textInput.setAttribute('aria-invalid', String(!valid));
    validation.textContent = message;
    validation.hidden = valid;
    applyButton.disabled = !valid || font === null;
    return valid;
  }

  function updateArtwork() {
    if (!validateText() || font === null) return;
    const next = renderOmarchyText(textInput.value, font);
    if (next === input) return;
    input = next;
    pre.textContent = input;
    scheduleRender();
  }

  function nextEffect() {
    return effectInput.value === 'random' ? picker.pick() : effectInput.value;
  }

  function stopSession() {
    session?.free();
    session = null;
  }

  function pause() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
  }

  function capture() {
    if (!session) return;
    frameWidth = session.width();
    frameHeight = session.height();
    const count = frameWidth * frameHeight;
    if (symbols.length < count) {
      symbols = new Uint32Array(count);
      fg = new Uint32Array(count);
      bg = new Uint32Array(count);
      flags = new Uint8Array(count);
    }
    session.fill(symbols, fg, bg, flags);
  }

  function paint(now) {
    if (!ctx || !metrics) return;
    paintFrame(ctx, metrics, symbols, fg, bg, flags, frameWidth, frameHeight,
      Math.floor(now / 400) % 2 === 0, FONT_FAMILY);
  }

  function layout() {
    const cssWidth = Math.max(1, canvas.clientWidth);
    const cssHeight = Math.max(1, canvas.clientHeight);
    metrics = terminalMetrics(cssWidth, cssHeight, input);
    ctx = sizeCanvas(canvas, cssWidth, cssHeight);
    const displayedSize = Math.round(metrics.cellWidth * 10) / 10;
    sizeValue.value = sizeValue.textContent = String(displayedSize) + ' px';
    sizeInput.setAttribute('aria-valuetext', String(displayedSize) + ' pixels');
  }

  function startEffect(name) {
    stopSession();
    currentEffect = name;
    session = new Session(input, name, metrics.columns, metrics.rows, undefined, FRAME_RATE);
    if (session.step()) capture();
  }

  function useStaticRenderer(message = '') {
    pause();
    stopSession();
    animated = false;
    rendererReady = true;
    effectInput.disabled = true;
    markStatic();
    root.classList.add('screensaver--rendered');
    layout();
    paintStatic(ctx, metrics, input);
    if (message) showStatus(message);
  }

  function tick(now) {
    if (!running) return;
    try {
      const elapsed = now - lastTs;
      acc = Math.min(MAX_CATCH_UP_MS, acc + Math.max(0, elapsed));
      lastTs = now;
      while (acc >= FRAME_MS) {
        acc -= FRAME_MS;
        if (!session || !session.step()) {
          startEffect(nextEffect());
          break;
        }
      }
      capture();
      paint(now);
      raf = requestAnimationFrame(tick);
    } catch {
      useStaticRenderer('A animação parou. Você ainda pode personalizar o texto e o tamanho.');
    }
  }

  function play() {
    if (document.hidden || !animated) return;
    running = true;
    acc = 0;
    lastTs = performance.now();
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
  }

  function renderNow(effect = currentEffect) {
    window.clearTimeout(renderTimer);
    renderTimer = 0;
    if (!rendererReady) return;
    try {
      layout();
      if (animated) {
        startEffect(effect || nextEffect());
        paint(performance.now());
        play();
      } else {
        paintStatic(ctx, metrics, input);
      }
    } catch {
      useStaticRenderer('A animação não carregou. O texto e o tamanho continuam disponíveis.');
    }
  }

  function scheduleRender() {
    window.clearTimeout(renderTimer);
    renderTimer = window.setTimeout(() => renderNow(), 140);
  }

  panel.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!validateText() || font === null) return;
    updateArtwork();
    renderNow();
    openPanel(false);
  });
  textInput.addEventListener('input', updateArtwork);
  effectInput.addEventListener('change', () => {
    if (animated) renderNow(nextEffect());
  });
  sizeInput.addEventListener('input', () => {
    PREFERRED_CELL_WIDTH = Number(sizeInput.value);
    scheduleRender();
  });
  sizeInput.addEventListener('change', () => renderNow());
  toggle.addEventListener('click', () => openPanel(panel.hidden));
  document.getElementById('close-panel').addEventListener('click', () => openPanel(false));
  window.addEventListener('pointermove', revealPointer, { passive: true });
  window.addEventListener('pointerdown', revealPointer, { passive: true });
  document.addEventListener('fullscreenchange', syncFullscreen);
  document.addEventListener('webkitfullscreenchange', syncFullscreen);
  syncFullscreen();

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) {
      openPanel(false);
      event.preventDefault();
      return;
    }
    if (event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.target instanceof HTMLElement &&
        event.target.closest('input, select, textarea, [contenteditable="true"]')) return;
    if (event.key.toLowerCase() === 'c') {
      event.preventDefault();
      openPanel(panel.hidden);
    } else if (event.key.toLowerCase() === 'f') {
      event.preventDefault();
      void toggleFullscreen().then(() => {
        syncFullscreen();
        if (isFullscreen()) showShortcutInfo();
      }).catch(() => showStatus('Este navegador não permitiu abrir a tela cheia.'));
    }
  });

  const resize = new ResizeObserver(() => {
    if (!rendererReady || resizeRaf) return;
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      if (canvas.clientWidth !== metrics.cssWidth || canvas.clientHeight !== metrics.cssHeight) {
        renderNow();
      }
    });
  });
  resize.observe(canvas);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
    else play();
  });
  window.addEventListener('pagehide', () => {
    pause();
    stopSession();
    resize.disconnect();
    cancelAnimationFrame(resizeRaf);
    for (const timer of [renderTimer, pointerTimer, shortcutsTimer, statusTimer]) {
      window.clearTimeout(timer);
    }
  }, { once: true });

  applyButton.disabled = true;
  effectInput.disabled = true;
  const fontReady = loadOmarchyFont().then((loadedFont) => {
    font = loadedFont;
    updateArtwork();
  }).catch(() => {
    textInput.disabled = true;
    showStatus('Não foi possível carregar as letras. Recarregue a página para editar o texto.');
  });

  if (prefersReducedMotion()) {
    void Promise.all([afterFonts(), fontReady]).then(() => useStaticRenderer());
    return;
  }

  void Promise.all([afterFonts(), loadWasm(), fontReady])
    .then(([, bytes]) => init({ module_or_path: bytes }))
    .then(() => {
      const names = catalogNames(effect_catalog());
      if (!names.length) throw new Error('Effect catalog is empty');
      picker = createEffectPicker(names);
      for (const name of names) {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        effectInput.append(option);
      }
      animated = true;
      rendererReady = true;
      effectInput.disabled = false;
      markAnimated();
      renderNow(nextEffect());
    })
    .catch(() => useStaticRenderer('A animação não carregou. O texto e o tamanho continuam disponíveis.'));
}

ready();
