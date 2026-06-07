/**
 * Generates installer assets + icon.ico matching the LetsChat website logo:
 * - Rounded-rect background with green gradient
 * - White chat bubble with 3 dots
 * Run: node installer/generate-assets.js
 */

const fs   = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

// ── PNG builder (32-bit RGBA) ──────────────────────────────────────────────
function createPNG(width, height, drawFn) {
  // We build a minimal PNG manually (no canvas dependency needed)
  const pixels = new Uint8Array(width * height * 4); // RGBA

  // Helper
  function setPixel(x, y, r, g, b, a = 255) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const i = (y * width + x) * 4;
    // Alpha-blend over existing
    const srcA = a / 255;
    const dstA = pixels[i + 3] / 255;
    const outA = srcA + dstA * (1 - srcA);
    if (outA === 0) return;
    pixels[i]     = Math.round((r * srcA + pixels[i]     * dstA * (1 - srcA)) / outA);
    pixels[i + 1] = Math.round((g * srcA + pixels[i + 1] * dstA * (1 - srcA)) / outA);
    pixels[i + 2] = Math.round((b * srcA + pixels[i + 2] * dstA * (1 - srcA)) / outA);
    pixels[i + 3] = Math.round(outA * 255);
  }

  function fillRect(x0, y0, x1, y1, r, g, b, a = 255) {
    for (let y = y0; y < y1; y++)
      for (let x = x0; x < x1; x++)
        setPixel(x, y, r, g, b, a);
  }

  function fillCircle(cx, cy, radius, r, g, b, a = 255) {
    for (let y = Math.ceil(cy - radius); y <= Math.floor(cy + radius); y++)
      for (let x = Math.ceil(cx - radius); x <= Math.floor(cx + radius); x++)
        if ((x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2)
          setPixel(x, y, r, g, b, a);
  }

  // Rounded rect fill (AA corners)
  function fillRoundedRect(x0, y0, x1, y1, rx, ry, r, g, b) {
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        let inside = true;
        // corner regions
        if (x < x0 + rx && y < y0 + ry) {
          const dx = x - (x0 + rx), dy = y - (y0 + ry);
          inside = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
        } else if (x >= x1 - rx && y < y0 + ry) {
          const dx = x - (x1 - rx - 1), dy = y - (y0 + ry);
          inside = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
        } else if (x < x0 + rx && y >= y1 - ry) {
          const dx = x - (x0 + rx), dy = y - (y1 - ry - 1);
          inside = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
        } else if (x >= x1 - rx && y >= y1 - ry) {
          const dx = x - (x1 - rx - 1), dy = y - (y1 - ry - 1);
          inside = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) <= 1;
        }
        if (inside) setPixel(x, y, r, g, b);
      }
    }
  }

  drawFn({ setPixel, fillRect, fillCircle, fillRoundedRect, width, height });

  // Encode minimal PNG
  return encodePNG(width, height, pixels);
}

function encodePNG(width, height, pixels) {
  const zlib = require('zlib');

  // Filter: None (0) for each row
  const rowSize  = width * 4;
  const filtered = Buffer.alloc((rowSize + 1) * height);
  for (let y = 0; y < height; y++) {
    filtered[y * (rowSize + 1)] = 0; // filter type None
    pixels.copy
      ? Buffer.from(pixels).copy(filtered, y * (rowSize + 1) + 1, y * rowSize, (y + 1) * rowSize)
      : filtered.set(pixels.slice(y * rowSize, (y + 1) * rowSize), y * (rowSize + 1) + 1);
  }

  const compressed = zlib.deflateSync(filtered, { level: 9 });

  function crc32(buf) {
    const table = crc32.table || (crc32.table = (() => {
      const t = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        t[i] = c;
      }
      return t;
    })());
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) >>> 0;
  }

  function chunk(type, data) {
    const buf = Buffer.alloc(12 + data.length);
    buf.writeUInt32BE(data.length, 0);
    buf.write(type, 4, 'ascii');
    data.copy(buf, 8);
    const crcData = Buffer.alloc(4 + data.length);
    crcData.write(type, 0, 'ascii');
    data.copy(crcData, 4);
    buf.writeUInt32BE(crc32(crcData), 8 + data.length);
    return buf;
  }

  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width,  0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8]  = 8;  // bit depth
  ihdr[9]  = 6;  // RGBA
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace

  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', compressed), chunk('IEND', Buffer.alloc(0))]);
}

// ── Draw the LetsChat logo ─────────────────────────────────────────────────
function drawLetsChat({ setPixel, fillRect, fillCircle, fillRoundedRect, width, height }) {
  const w = width, h = height;

  // Background gradient: #25D366 → #128C7E (top-left to bottom-right)
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const t  = (x + y) / (w + h);
      const r  = Math.round(0x25 + (0x12 - 0x25) * t);
      const g  = Math.round(0xD3 + (0x8C - 0xD3) * t);
      const b  = Math.round(0x66 + (0x7E - 0x66) * t);
      setPixel(x, y, r, g, b, 0); // start transparent
    }
  }

  // Rounded rect (corner radius = 22% of size)
  const rx = Math.round(w * 0.22);
  const ry = Math.round(h * 0.22);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let inside = true;
      if (x < rx && y < ry)           inside = ((x-rx)**2/(rx**2) + (y-ry)**2/(ry**2)) <= 1;
      else if (x >= w-rx && y < ry)   inside = ((x-(w-rx-1))**2/(rx**2) + (y-ry)**2/(ry**2)) <= 1;
      else if (x < rx && y >= h-ry)   inside = ((x-rx)**2/(rx**2) + (y-(h-ry-1))**2/(ry**2)) <= 1;
      else if (x >= w-rx && y >= h-ry)inside = ((x-(w-rx-1))**2/(rx**2) + (y-(h-ry-1))**2/(ry**2)) <= 1;

      if (inside) {
        const t = (x + y) / (w + h);
        const r = Math.round(0x25 + (0x12 - 0x25) * t);
        const g = Math.round(0xD3 + (0x8C - 0xD3) * t);
        const b = Math.round(0x66 + (0x7E - 0x66) * t);
        setPixel(x, y, r, g, b, 255);
      }
    }
  }

  // White chat bubble (rounded blob)
  const bx = w * 0.15, by = h * 0.18, bw = w * 0.70, bh = h * 0.58;
  const br = Math.min(bw, bh) * 0.45;

  for (let y = Math.floor(by); y <= Math.ceil(by + bh); y++) {
    for (let x = Math.floor(bx); x <= Math.ceil(bx + bw); x++) {
      let inside = true;
      const cx = bx + br, cy = by + br;
      const cx2 = bx + bw - br, cy2 = by + bh - br;
      // four corner ellipses
      if      (x < cx  && y < cy)  inside = ((x-cx)**2  + (y-cy)**2)  <= br**2;
      else if (x > cx2 && y < cy)  inside = ((x-cx2)**2 + (y-cy)**2)  <= br**2;
      else if (x < cx  && y > cy2) inside = ((x-cx)**2  + (y-cy2)**2) <= br**2;
      else if (x > cx2 && y > cy2) inside = ((x-cx2)**2 + (y-cy2)**2) <= br**2;
      if (inside) setPixel(x, y, 255, 255, 255, 255);
    }
  }

  // Tail of bubble (bottom-left triangle)
  const tx = w * 0.22, ty = by + bh;
  for (let y = 0; y <= h * 0.18; y++) {
    for (let x = 0; x <= y * 0.7; x++) {
      setPixel(Math.round(tx + x), Math.round(ty + y), 255, 255, 255, 255);
    }
  }

  // Three dots (green on white bubble)
  const dotY  = by + bh * 0.48;
  const dotR  = w * 0.055;
  const dotG1 = w * 0.32, dotG2 = w * 0.50, dotG3 = w * 0.68;
  const dg = Math.round(0x25 + (0x12 - 0x25) * 0.5);
  const dgg= Math.round(0xD3 + (0x8C - 0xD3) * 0.5);
  const dgb= Math.round(0x66 + (0x7E - 0x66) * 0.5);

  for (const dx of [dotG1, dotG2, dotG3]) {
    fillCircle(dx, dotY, dotR, dg, dgg, dgb);
  }
}

// ── ICO builder ────────────────────────────────────────────────────────────
function buildICO(pngBuffers) {
  const count  = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: ICO
  header.writeUInt16LE(count, 4);

  let dataOffset = 6 + count * 16;
  const entries  = [];

  pngBuffers.forEach(({ size, png }) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size === 256 ? 0 : size, 0);
    entry.writeUInt8(size === 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(dataOffset, 12);
    entries.push(entry);
    dataOffset += png.length;
  });

  return Buffer.concat([header, ...entries, ...pngBuffers.map(e => e.png)]);
}

// ── Generate all sizes ─────────────────────────────────────────────────────
const sizes = [16, 32, 48, 256];
const pngBuffers = sizes.map(size => ({
  size,
  png: createPNG(size, size, drawLetsChat),
}));

const icoBuffer = buildICO(pngBuffers);
fs.writeFileSync(path.join(assetsDir, 'icon.ico'), icoBuffer);
console.log('Created icon.ico (16/32/48/256px) – LetsChat logo');

// ── BMP assets for Inno Setup installer ───────────────────────────────────
function createBMP(width, height) {
  const rowSize       = Math.ceil((width * 3) / 4) * 4;
  const pixelArraySize = rowSize * height;
  const fileSize      = 54 + pixelArraySize;
  const buffer        = Buffer.alloc(fileSize, 0);

  buffer.write('BM', 0, 'ascii');
  buffer.writeUInt32LE(fileSize, 2);
  buffer.writeUInt32LE(0, 6);
  buffer.writeUInt32LE(54, 10);
  buffer.writeUInt32LE(40, 14);
  buffer.writeInt32LE(width, 18);
  buffer.writeInt32LE(-height, 22);
  buffer.writeUInt16LE(1, 26);
  buffer.writeUInt16LE(24, 28);
  buffer.writeUInt32LE(0, 30);
  buffer.writeUInt32LE(pixelArraySize, 34);
  buffer.writeInt32LE(2835, 38);
  buffer.writeInt32LE(2835, 42);
  buffer.writeUInt32LE(0, 46);
  buffer.writeUInt32LE(0, 50);

  const offset = 54;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const t  = (x + y) / (width + height);
      const r  = Math.round(0x25 + (0x12 - 0x25) * t);
      const g  = Math.round(0xD3 + (0x8C - 0xD3) * t);
      const b  = Math.round(0x66 + (0x7E - 0x66) * t);
      const px = offset + y * rowSize + x * 3;
      buffer[px]     = b;
      buffer[px + 1] = g;
      buffer[px + 2] = r;
    }
  }
  return buffer;
}

fs.writeFileSync(path.join(assetsDir, 'installer-banner.bmp'), createBMP(164, 314));
console.log('Created installer-banner.bmp');

fs.writeFileSync(path.join(assetsDir, 'installer-header.bmp'), createBMP(497, 58));
console.log('Created installer-header.bmp');

console.log('\n✅ Alle Assets erfolgreich generiert:', assetsDir);
