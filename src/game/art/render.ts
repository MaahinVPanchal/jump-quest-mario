/**
 * Painted hero renderer.
 *
 * The roster is still authored as readable grids, but nothing is drawn as a
 * blocky square any more: the grid is treated as a low-res *painting* which is
 * resampled with smooth bilinear filtering, given a clean anti-aliased
 * silhouette, then lit with a directional shading pass (soft rim light from the
 * top-left, dark contact shading bottom-right, ink outline on the edge).
 *
 * The result reads as a hand-painted 2D character instead of pixel confetti.
 */

const LIGHT = { x: -0.55, y: -0.83 };
const INK = [16, 16, 26] as const;

type RGB = [number, number, number];

const hexToRgb = (hex: string): RGB => {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const clamp = (v: number, lo: number, hi: number): number => (v < lo ? lo : v > hi ? hi : v);
const smoothstep = (a: number, b: number, x: number): number => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Build the colour + coverage fields, with colour bled outward so edges never darken. */
function fields(rows: readonly string[], palette: Record<string, string>) {
  const h = rows.length;
  const w = rows[0]?.length ?? 0;
  const col = new Float32Array(w * h * 3);
  const cov = new Float32Array(w * h);
  const has = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    const row = rows[y]!;
    for (let x = 0; x < w; x++) {
      const fill = palette[row[x] ?? "."];
      if (!fill) continue;
      const [r, g, b] = hexToRgb(fill);
      const i = y * w + x;
      col[i * 3] = r;
      col[i * 3 + 1] = g;
      col[i * 3 + 2] = b;
      cov[i] = 1;
      has[i] = 1;
    }
  }
  // Dilate colour into the empty cells (2 passes) so bilinear blends stay clean.
  for (let pass = 0; pass < 2; pass++) {
    const next = new Uint8Array(has);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        if (has[i]) continue;
        let r = 0, g = 0, b = 0, n = 0;
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]] as const) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const j = ny * w + nx;
          if (!has[j]) continue;
          r += col[j * 3]!; g += col[j * 3 + 1]!; b += col[j * 3 + 2]!; n++;
        }
        if (!n) continue;
        col[i * 3] = r / n; col[i * 3 + 1] = g / n; col[i * 3 + 2] = b / n;
        next[i] = 1;
      }
    }
    has.set(next);
  }
  return { w, h, col, cov };
}

/** Bilinear sample of a scalar/vector field with edge clamping. */
function sample(field: Float32Array, w: number, h: number, stride: number, off: number, u: number, v: number): number {
  const x = clamp(u - 0.5, 0, w - 1);
  const y = clamp(v - 0.5, 0, h - 1);
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = Math.min(w - 1, x0 + 1), y1 = Math.min(h - 1, y0 + 1);
  const fx = x - x0, fy = y - y0;
  const at = (px: number, py: number): number => field[(py * w + px) * stride + off]!;
  const top = at(x0, y0) * (1 - fx) + at(x1, y0) * fx;
  const bot = at(x0, y1) * (1 - fx) + at(x1, y1) * fx;
  return top * (1 - fy) + bot * fy;
}

/**
 * Paint a hero grid as a smooth, lit character into `ctx` at (ox, oy) with a
 * total footprint of `size` x `size` pixels.
 */
export function paintPainted(
  ctx: CanvasRenderingContext2D,
  rows: readonly string[],
  palette: Record<string, string>,
  size: number,
  ox = 0,
  oy = 0,
): void {
  const { w, h, col, cov } = fields(rows, palette);
  if (!w || !h) return;
  const outW = size;
  const outH = Math.round((size * h) / w);
  const img = ctx.createImageData(outW, outH);
  const data = img.data;
  const sx = w / outW;
  const sy = h / outH;
  const texel = Math.max(1, outW / w); // output px per source cell

  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const u = (x + 0.5) * sx;
      const v = (y + 0.5) * sy;
      const a = sample(cov, w, h, 1, 0, u, v);
      // Crisp but anti-aliased silhouette.
      const alpha = smoothstep(0.38, 0.62, a);
      const i = (y * outW + x) * 4;
      if (alpha <= 0.004) continue;

      let r = sample(col, w, h, 3, 0, u, v);
      let g = sample(col, w, h, 3, 1, u, v);
      let b = sample(col, w, h, 3, 2, u, v);

      // Surface normal from the coverage gradient → directional lighting.
      const e = 0.9;
      const gx = sample(cov, w, h, 1, 0, u + e, v) - sample(cov, w, h, 1, 0, u - e, v);
      const gy = sample(cov, w, h, 1, 0, u, v + e) - sample(cov, w, h, 1, 0, u, v - e);
      const len = Math.hypot(gx, gy) || 1;
      const ndl = ((-gx / len) * LIGHT.x + (-gy / len) * LIGHT.y) * Math.min(1, len * 2.2);
      const lit = 1 + 0.34 * ndl - 0.1 * (1 - a);
      r *= lit; g *= lit; b *= lit;

      // Ink outline hugging the silhouette edge.
      const edge = 1 - smoothstep(0.55, 0.9, a);
      const ink = edge * 0.85;
      r = r * (1 - ink) + INK[0] * ink;
      g = g * (1 - ink) + INK[1] * ink;
      b = b * (1 - ink) + INK[2] * ink;

      // Subtle top gloss so volumes read as rounded, not flat.
      const gloss = clamp(1 - v / (h * 0.45), 0, 1) * 0.12 * alpha;
      r += 255 * gloss; g += 255 * gloss; b += 255 * gloss;

      data[i] = clamp(r, 0, 255);
      data[i + 1] = clamp(g, 0, 255);
      data[i + 2] = clamp(b, 0, 255);
      data[i + 3] = clamp(alpha * 255, 0, 255);
      void texel;
    }
  }

  const buf = document.createElement("canvas");
  buf.width = outW;
  buf.height = outH;
  const bctx = buf.getContext("2d");
  if (!bctx) return;
  bctx.putImageData(img, 0, 0);

  // Soft contact shadow underneath keeps the character grounded.
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.filter = "blur(2px)";
  ctx.drawImage(buf, ox + 1, oy + 2);
  ctx.restore();
  ctx.drawImage(buf, ox, oy);
}
