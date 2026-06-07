/**
 * Generates the Inno Setup installer artwork using the `canvas` package:
 *   - installer-banner.bmp  (164×314) — left-side welcome banner
 *   - installer-header.bmp  (497×58)  — top header strip
 *
 * Both are written as 24-bit BMP (the format Inno Setup expects for
 * WizardImageFile / WizardSmallImageFile).
 *
 * Run: npm run create-assets   (or: node installer/create-assets.js)
 */

const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

// ── Colors ──────────────────────────────────────────────────────────────────
const GREEN = '#00A884';
const WHITE = '#FFFFFF';
const MUTED = '#8696A0';
const BG_TOP = '#1B2126';
const BG_BOTTOM = '#0B141A';

// ── 24-bit BMP encoder (top-down) ─────────────────────────────────────────────
function encodeBMP(canvas) {
  const width = canvas.width;
  const height = canvas.height;
  const { data } = canvas.getContext('2d').getImageData(0, 0, width, height);

  const rowSize = Math.ceil((width * 3) / 4) * 4; // padded to 4 bytes
  const pixelArraySize = rowSize * height;
  const fileSize = 54 + pixelArraySize;
  const buf = Buffer.alloc(fileSize, 0);

  // BITMAPFILEHEADER
  buf.write('BM', 0, 'ascii');
  buf.writeUInt32LE(fileSize, 2);
  buf.writeUInt32LE(0, 6);
  buf.writeUInt32LE(54, 10);
  // BITMAPINFOHEADER
  buf.writeUInt32LE(40, 14);
  buf.writeInt32LE(width, 18);
  buf.writeInt32LE(-height, 22); // negative → top-down rows
  buf.writeUInt16LE(1, 26);
  buf.writeUInt16LE(24, 28);
  buf.writeUInt32LE(0, 30);
  buf.writeUInt32LE(pixelArraySize, 34);
  buf.writeInt32LE(2835, 38);
  buf.writeInt32LE(2835, 42);
  buf.writeUInt32LE(0, 46);
  buf.writeUInt32LE(0, 50);

  // Pixels: BMP stores BGR
  let p = 54;
  for (let y = 0; y < height; y++) {
    let rowStart = p;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      buf[p++] = data[i + 2]; // B
      buf[p++] = data[i + 1]; // G
      buf[p++] = data[i];     // R
    }
    p = rowStart + rowSize; // skip row padding
  }
  return buf;
}

// ── Drawing helpers ───────────────────────────────────────────────────────────
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** A chat speech bubble (rounded rect + small tail at bottom-left). */
function speechBubble(ctx, x, y, w, h, r, fill) {
  roundRect(ctx, x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  // tail
  ctx.beginPath();
  ctx.moveTo(x + r, y + h - 2);
  ctx.lineTo(x + r - 8, y + h + 8);
  ctx.lineTo(x + r + 10, y + h - 2);
  ctx.closePath();
  ctx.fill();
}

function verticalGradient(ctx, w, h, top, bottom) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, top);
  g.addColorStop(1, bottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

/** The LetsChat logo: two overlapping chat bubbles. */
function drawLogo(ctx, cx, cy, size) {
  const bw = size;
  const bh = size * 0.78;
  const r = size * 0.26;
  // Back bubble (green), offset up-right
  speechBubble(ctx, cx - bw / 2 + size * 0.16, cy - bh / 2 - size * 0.14, bw, bh, r, GREEN);
  // Front bubble (white), offset down-left
  speechBubble(ctx, cx - bw / 2 - size * 0.16, cy - bh / 2 + size * 0.14, bw, bh, r, WHITE);
  // Three dots inside the front (white) bubble
  ctx.fillStyle = GREEN;
  const dotY = cy + size * 0.14 - bh * 0.5 + bh * 0.5;
  const dotR = size * 0.06;
  const dotCx = cx - size * 0.16;
  [-1, 0, 1].forEach((k) => {
    ctx.beginPath();
    ctx.arc(dotCx + k * size * 0.2, dotY, dotR, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ── Banner (164×314) ──────────────────────────────────────────────────────────
function createBanner() {
  const W = 164;
  const H = 314;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  verticalGradient(ctx, W, H, BG_TOP, BG_BOTTOM);

  // Logo (~80×80) centered at y = 120
  drawLogo(ctx, W / 2, 120, 80);

  // "LetsChat" title
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 18px "Segoe UI", Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('LetsChat', W / 2, 215);

  // Version at the very bottom
  ctx.fillStyle = MUTED;
  ctx.font = '11px "Segoe UI", Arial, sans-serif';
  ctx.fillText('v1.0.0', W / 2, H - 18);

  // Slim green accent strip on the right edge
  ctx.fillStyle = GREEN;
  ctx.fillRect(W - 3, 0, 3, H);

  fs.writeFileSync(path.join(assetsDir, 'installer-banner.bmp'), encodeBMP(canvas));
  console.log('Created installer-banner.bmp (164×314)');
}

// ── Header (497×58) ────────────────────────────────────────────────────────────
function createHeader() {
  const W = 497;
  const H = 58;
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = BG_TOP;
  ctx.fillRect(0, 0, W, H);

  // Small chat icon (24×24) on the left
  drawLogo(ctx, 28, H / 2, 24);

  // Texts
  ctx.textAlign = 'left';
  ctx.fillStyle = WHITE;
  ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
  ctx.fillText('LetsChat', 52, 26);

  ctx.fillStyle = MUTED;
  ctx.font = '11px "Segoe UI", Arial, sans-serif';
  ctx.fillText('Sicherer Desktop-Messenger', 52, 44);

  fs.writeFileSync(path.join(assetsDir, 'installer-header.bmp'), encodeBMP(canvas));
  console.log('Created installer-header.bmp (497×58)');
}

createBanner();
createHeader();
console.log('\n✅ Installer-Assets erfolgreich erstellt:', assetsDir);
