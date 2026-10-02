// Utilidades de imagem: redimensionar, remover fundo, recortar sobras e exportar looks.

const MAX_INPUT = 1600; // tamanho enviado para a remoção de fundo
const MAX_STORED = 1100; // tamanho final salvo (ótimo para tela de celular, quase sem perda)

let webpSupport;
function supportsWebp() {
  if (webpSupport === undefined) {
    const c = document.createElement("canvas");
    c.width = c.height = 1;
    webpSupport = c.toDataURL("image/webp").startsWith("data:image/webp");
  }
  return webpSupport;
}

export async function loadImage(src) {
  const img = new Image();
  img.decoding = "async";
  img.src = typeof src === "string" ? src : URL.createObjectURL(src);
  await img.decode();
  return img;
}

function canvasFor(w, h) {
  const c = document.createElement("canvas");
  c.width = Math.max(1, Math.round(w));
  c.height = Math.max(1, Math.round(h));
  return c;
}

function toBlob(canvas, type, quality) {
  return new Promise((res) => canvas.toBlob(res, type, quality));
}

function scaleToFit(w, h, max) {
  const s = Math.min(1, max / Math.max(w, h));
  return [Math.round(w * s), Math.round(h * s)];
}

/** Lê o arquivo da câmera/galeria (respeitando a rotação do celular) e reduz o tamanho. */
export async function prepareInput(file) {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" }).catch(() => null);
  const source = bitmap || (await loadImage(file));
  const [w, h] = scaleToFit(source.width, source.height, MAX_INPUT);
  const c = canvasFor(w, h);
  const ctx = c.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, w, h);
  bitmap?.close?.();
  return toBlob(c, "image/jpeg", 0.93);
}

/** Remove o fundo direto no aparelho. O modelo (~40 MB) é baixado só no primeiro uso. */
export async function removeBackground(blob, onProgress) {
  const { removeBackground: run } = await import("@imgly/background-removal");
  return run(blob, {
    model: "isnet_fp16", // mais preciso que o quint8 (detalhes como listras e estampas)
    output: { format: "image/png" },
    progress: (key, current, total) => {
      if (!onProgress) return;
      if (key.startsWith("fetch")) onProgress({ stage: "download", pct: total ? current / total : 0 });
      else onProgress({ stage: "process", pct: total ? current / total : 0 });
    },
  });
}

/**
 * Fecha "buraquinhos" que o recorte deixa dentro da peça (ex.: partes brancas
 * de estampas), devolvendo os pixels da foto original. Buracos grandes e
 * tudo que encosta no fundo de fora ficam como estão.
 */
export async function fillSmallHoles(cutSrc, originalSrc, { maxHoleFrac = 0.025 } = {}) {
  const [cut, orig] = await Promise.all([loadImage(cutSrc), loadImage(originalSrc)]);
  const w = cut.naturalWidth, h = cut.naturalHeight;
  const c = canvasFor(w, h);
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(cut, 0, 0);
  const img = ctx.getImageData(0, 0, w, h);
  const o = canvasFor(w, h).getContext("2d", { willReadFrequently: true });
  o.drawImage(orig, 0, 0, w, h);
  const od = o.getImageData(0, 0, w, h).data;
  const d = img.data;
  const T = 60;
  const seen = new Uint8Array(w * h);
  const stack = new Int32Array(w * h);
  const flood = (start, collect) => {
    let sp = 0, n = 0;
    stack[sp++] = start; seen[start] = 1;
    while (sp) {
      const i = stack[--sp];
      if (collect) collect.push(i);
      n++;
      const x = i % w, y = (i / w) | 0;
      const nb = [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1];
      for (const j of nb) if (j >= 0 && !seen[j] && d[j * 4 + 3] < T) { seen[j] = 1; stack[sp++] = j; }
    }
    return n;
  };
  // fundo de fora: tudo transparente ligado à borda
  for (let x = 0; x < w; x++) for (const y of [0, h - 1]) { const i = y * w + x; if (!seen[i] && d[i * 4 + 3] < T) flood(i); }
  for (let y = 0; y < h; y++) for (const x of [0, w - 1]) { const i = y * w + x; if (!seen[i] && d[i * 4 + 3] < T) flood(i); }
  const limit = w * h * maxHoleFrac;
  let changed = false;
  for (let i = 0; i < w * h; i++) {
    if (seen[i] || d[i * 4 + 3] >= T) continue;
    const comp = [];
    flood(i, comp);
    if (comp.length <= limit) {
      changed = true;
      for (const k of comp) { const p = k * 4; d[p] = od[p]; d[p + 1] = od[p + 1]; d[p + 2] = od[p + 2]; d[p + 3] = 255; }
    }
  }
  if (!changed) return typeof cutSrc === "string" ? cutSrc : c.toDataURL("image/png");
  ctx.putImageData(img, 0, 0);
  return c.toDataURL("image/png");
}

/** Converte qualquer imagem (blob/dataURL) em dataURL leve, sem cortar. */
export async function toStoredDataUrl(src) {
  return (await finalizeImage(src, { trim: false })).dataUrl;
}

/** Corta as sobras transparentes e salva em formato leve que mantém a transparência. */
export async function finalizeImage(blob, { trim = true } = {}) {
  const img = await loadImage(blob);
  return finalizeFromImage(img, { trim });
}

async function finalizeFromImage(img, { trim }) {
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

  if (trim) {
    const probe = canvasFor(sw, sh);
    const pctx = probe.getContext("2d", { willReadFrequently: true });
    pctx.drawImage(img, 0, 0);
    const { data } = pctx.getImageData(0, 0, sw, sh);
    let minX = sw, minY = sh, maxX = -1, maxY = -1;
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        if (data[(y * sw + x) * 4 + 3] > 12) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX > minX && maxY > minY) {
      const pad = Math.round(Math.max(maxX - minX, maxY - minY) * 0.02);
      sx = Math.max(0, minX - pad);
      sy = Math.max(0, minY - pad);
      sw = Math.min(img.naturalWidth, maxX + pad + 1) - sx;
      sh = Math.min(img.naturalHeight, maxY + pad + 1) - sy;
    }
  }

  const [w, h] = scaleToFit(sw, sh, MAX_STORED);
  const c = canvasFor(w, h);
  const ctx = c.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, w, h);
  const type = supportsWebp() ? "image/webp" : "image/png";
  return { dataUrl: c.toDataURL(type, 0.92), width: w, height: h };
}

// ---------- desenho das peças ----------

const opaqueCache = new Map();
/** A peça ainda tem fundo? (cantos sem transparência) */
function isOpaque(img, key) {
  if (key && opaqueCache.has(key)) return opaqueCache.get(key);
  const c = canvasFor(24, 24);
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, 24, 24);
  const d = ctx.getImageData(0, 0, 24, 24).data;
  const corners = [0, 23, 24 * 23, 24 * 24 - 1].map((i) => d[i * 4 + 3]);
  const res = corners.every((a) => a > 245);
  if (key) opaqueCache.set(key, res);
  return res;
}

function roundRectPath(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h);
}

/** Desenha uma peça: recortada ganha sombra suave; com fundo vira "foto" de cantos arredondados. */
function drawPiece(ctx, img, key, x, y, w, h, scale = 1) {
  const s = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
  const dx = x + (w - dw) / 2, dy = y + (h - dh) / 2;
  if (isOpaque(img, key)) {
    const r = Math.min(dw, dh) * 0.07;
    const border = 10 * scale;
    ctx.save();
    ctx.shadowColor = "rgba(28,26,23,0.18)";
    ctx.shadowBlur = 30 * scale;
    ctx.shadowOffsetY = 12 * scale;
    ctx.fillStyle = "#FFFFFF";
    roundRectPath(ctx, dx - border, dy - border, dw + border * 2, dh + border * 2, r + border);
    ctx.fill();
    ctx.restore();
    ctx.save();
    roundRectPath(ctx, dx, dy, dw, dh, r);
    ctx.clip();
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  } else {
    ctx.save();
    ctx.shadowColor = "rgba(28,26,23,0.16)";
    ctx.shadowBlur = 26 * scale;
    ctx.shadowOffsetY = 14 * scale;
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  }
  return { x: dx, y: dy, w: dw, h: dh };
}

async function loadPieces(items, clothesById) {
  const out = [];
  for (const it of [...items].sort((a, b) => a.z - b.z)) {
    const cloth = clothesById[it.clothId];
    if (!cloth) continue;
    out.push({ it, cloth, img: await loadImage(cloth.image) });
  }
  return out;
}

function output(c, type, quality) {
  if (type === "dataUrl") return c.toDataURL(supportsWebp() ? "image/webp" : "image/png", quality ?? 0.85);
  return toBlob(c, type, quality);
}

/** Miniatura do look, igual ao que aparece no quadro (usada na lista de looks). */
export async function renderLook(items, clothesById, { width = 1080, ratio = 4 / 3, background = "#FFF8E8", type = "image/png", quality } = {}) {
  const height = Math.round(width * ratio);
  const c = canvasFor(width, height);
  const ctx = c.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);
  for (const { it, cloth, img } of await loadPieces(items, clothesById)) {
    drawPiece(ctx, img, cloth.id, it.x * width, it.y * height, it.w * width, it.h * height, width / 1080);
  }
  return output(c, type, quality);
}

// ---------- cartão para compartilhar ----------

export const SHARE_THEMES = [
  { id: "creme", label: "Creme", bg: "#FFF1C9", blob: "#FFDFBC", ink: "#1C1A17", soft: "#7A6F5C", pill: "#FFFCF5" },
  { id: "pessego", label: "Pêssego", bg: "#FFDFBC", blob: "#FFF1C9", ink: "#1C1A17", soft: "#7D6650", pill: "#FFF6EA" },
  { id: "areia", label: "Areia", bg: "#E8DEAB", blob: "#FFFBBC", ink: "#1C1A17", soft: "#6C6644", pill: "#FFFCE8" },
  { id: "papel", label: "Papel", bg: "#FFFCF5", blob: "#F4EBD8", ink: "#1C1A17", soft: "#8F887C", pill: "#F4EBD8" },
  { id: "noite", label: "Noite", bg: "#1C1A17", blob: "#4A443C", ink: "#FFF1C9", soft: "#B7AD98", pill: "#3A3530", ring: "#B7AD98" },
];

async function ensureFonts() {
  try {
    await Promise.all([
      document.fonts.load('600 80px "Fraunces Variable"'),
      document.fonts.load('600 30px "Plus Jakarta Sans Variable"'),
    ]);
  } catch {}
}

function fitText(ctx, text, maxW, size, weight, family) {
  let s = size;
  do {
    ctx.font = `${weight} ${s}px ${family}`;
    if (ctx.measureText(text).width <= maxW) break;
    s -= 2;
  } while (s > 28);
  return s;
}

/**
 * Cartão 4:5 (formato do feed/stories) com o look organizado,
 * nome, categoria e as cores das peças.
 */
export async function renderShareCard(outfit, clothesById, colorsById, { theme = "creme", width = 1080, type = "image/png", quality } = {}) {
  const T = SHARE_THEMES.find((t) => t.id === theme) || SHARE_THEMES[0];
  await ensureFonts();
  const k = width / 1080;
  const W = width, H = Math.round(width * 1.25);
  const c = canvasFor(W, H);
  const ctx = c.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  const serif = '"Fraunces Variable", Georgia, serif';
  const sans = '"Plus Jakarta Sans Variable", system-ui, sans-serif';

  // fundo + formas suaves
  ctx.fillStyle = T.bg;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = T.blob;
  ctx.beginPath(); ctx.ellipse(W * 0.5, H * 0.44, W * 0.42, H * 0.36, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.arc(W * 0.88, H * 0.1, 70 * k, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(W * 0.1, H * 0.74, 44 * k, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // topo
  ctx.fillStyle = T.ink;
  ctx.font = `600 ${46 * k}px ${serif}`;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "left";
  ctx.fillText("Vestí", 72 * k, 108 * k);
  const vw = ctx.measureText("Vestí").width;
  ctx.fillStyle = "#E8D2AB";
  ctx.beginPath(); ctx.arc(72 * k + vw + 10 * k, 100 * k, 7 * k, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = T.soft;
  ctx.font = `600 ${24 * k}px ${sans}`;
  ctx.textAlign = "right";
  ctx.fillText("LOOK DO DIA", W - 72 * k, 100 * k);

  // peças: reaproveita a montagem do usuário, sem os espaços vazios
  const pieces = await loadPieces(outfit.items, clothesById);
  const BW = 1000, BH = BW * (4 / 3);
  const rects = pieces.map(({ it, img }) => {
    const bw = it.w * BW, bh = it.h * BH;
    const s = Math.min(bw / img.naturalWidth, bh / img.naturalHeight);
    const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    return { x: it.x * BW + (bw - dw) / 2, y: it.y * BH + (bh - dh) / 2, w: dw, h: dh };
  });
  if (rects.length) {
    const minX = Math.min(...rects.map((r) => r.x)), minY = Math.min(...rects.map((r) => r.y));
    const maxX = Math.max(...rects.map((r) => r.x + r.w)), maxY = Math.max(...rects.map((r) => r.y + r.h));
    const area = { x: 110 * k, y: 160 * k, w: W - 220 * k, h: H - 160 * k - 330 * k };
    const s = Math.min(area.w / (maxX - minX), area.h / (maxY - minY));
    const offX = area.x + (area.w - (maxX - minX) * s) / 2 - minX * s;
    const offY = area.y + (area.h - (maxY - minY) * s) / 2 - minY * s;
    pieces.forEach(({ cloth, img }, i) => {
      const r = rects[i];
      drawPiece(ctx, img, cloth.id, offX + r.x * s, offY + r.y * s, r.w * s, r.h * s, k);
    });
  }

  // rodapé: nome, categoria e cores
  const name = outfit.name || "Meu look";
  ctx.textAlign = "left";
  ctx.fillStyle = T.ink;
  const size = fitText(ctx, name, W - 144 * k, 76 * k, 600, serif);
  ctx.font = `600 ${size}px ${serif}`;
  const nameY = H - 168 * k;
  ctx.fillText(name, 72 * k, nameY);

  let x = 72 * k;
  const rowY = H - 92 * k;
  if (outfit.category) {
    ctx.font = `700 ${26 * k}px ${sans}`;
    const tw = ctx.measureText(outfit.category).width;
    ctx.fillStyle = T.pill;
    roundRectPath(ctx, x, rowY - 24 * k, tw + 44 * k, 50 * k, 25 * k);
    ctx.fill();
    ctx.fillStyle = T.ink;
    ctx.textBaseline = "middle";
    ctx.fillText(outfit.category, x + 22 * k, rowY + 1 * k);
    ctx.textBaseline = "alphabetic";
    x += tw + 64 * k;
  }
  const seen = new Set();
  for (const { cloth } of pieces) {
    const col = colorsById(cloth.color);
    if (!col || seen.has(col.id)) continue;
    seen.add(col.id);
    if (col.hex.startsWith("conic")) {
      const g = ctx.createConicGradient ? ctx.createConicGradient(0, x + 18 * k, rowY) : null;
      if (g) ["#EBA6B9", "#F2CF4A", "#5B8BD0", "#5E8A5A", "#EBA6B9"].forEach((h, i, a) => g.addColorStop(i / (a.length - 1), h));
      ctx.fillStyle = g || "#EBA6B9";
    } else ctx.fillStyle = col.hex;
    ctx.beginPath(); ctx.arc(x + 18 * k, rowY, 18 * k, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 3 * k;
    ctx.strokeStyle = T.ring || T.pill;
    ctx.stroke();
    x += 46 * k;
  }

  ctx.textAlign = "right";
  ctx.fillStyle = T.soft;
  ctx.font = `600 ${22 * k}px ${sans}`;
  ctx.fillText("montado no Vestí", W - 72 * k, rowY + 8 * k);

  return output(c, type, quality);
}

export async function shareOrDownload(blob, filename, title) {
  const file = new File([blob], filename, { type: blob.type });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title });
      return "shared";
    } catch (e) {
      if (e?.name === "AbortError") return "cancelled";
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return "downloaded";
}
