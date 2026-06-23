// Generate UnmadHouse app icons (192 & 512) as PNGs with no external deps.
// Indigo rounded background (#4f46e5) + a white "U" glyph drawn from rectangles.
const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xEDB88320 & -(c & 1));
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function makePNG(size) {
  const BG = [79, 70, 229];      // #4f46e5 indigo
  const FG = [255, 255, 255];    // white
  const px = (x, y) => {
    // Rounded corners.
    const r = size * 0.22;
    const inX = Math.min(x, size - 1 - x), inY = Math.min(y, size - 1 - y);
    if (inX < r && inY < r) {
      const dx = r - inX, dy = r - inY;
      if (dx * dx + dy * dy > r * r) return null; // transparent corner
    }
    // "U" glyph geometry (centered).
    const m = size * 0.30;            // side margin
    const top = size * 0.26;          // top of the U
    const bottom = size * 0.70;       // inner bottom of the U
    const thick = size * 0.10;        // stroke thickness
    const leftIn = m, leftOut = m + thick;
    const rightIn = size - m - thick, rightOut = size - m;
    const inU =
      // left vertical
      (x >= leftIn && x < leftOut && y >= top && y <= bottom + thick) ||
      // right vertical
      (x >= rightIn && x < rightOut && y >= top && y <= bottom + thick) ||
      // bottom curve (flat bar)
      (y >= bottom && y < bottom + thick && x >= leftIn && x < rightOut);
    return inU ? FG : BG;
  };

  // Build raw RGBA scanlines with filter byte 0.
  const raw = Buffer.alloc((size * 4 + 1) * size);
  let o = 0;
  for (let y = 0; y < size; y++) {
    raw[o++] = 0;
    for (let x = 0; x < size; x++) {
      const c = px(x, y);
      if (c === null) { raw[o++] = 0; raw[o++] = 0; raw[o++] = 0; raw[o++] = 0; }
      else { raw[o++] = c[0]; raw[o++] = c[1]; raw[o++] = c[2]; raw[o++] = 255; }
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit, RGBA
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idat), chunk('IEND', Buffer.alloc(0))]);
}

const outDir = path.join(__dirname, '..', 'client', 'public');
for (const size of [192, 512]) {
  const file = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(file, makePNG(size));
  console.log(`wrote ${file}`);
}
