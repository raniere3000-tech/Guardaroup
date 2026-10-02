// Separador de peças: encontra as roupas numa foto de corpo inteiro, direto no celular.
// Modelo: Xenova/segformer_b2_clothes (versão quantizada, ~29 MB, baixado só na 1ª vez).

import { COLORS } from "./constants";
import { finalizeImage } from "./image";

const MODEL = "Xenova/segformer_b2_clothes";

// rótulo do modelo → tipo de peça no Vestí (o que não está aqui é ignorado: pele, cabelo, rosto…)
const LABELS = {
  "Upper-clothes": { group: "top", category: "blusa", label: "Parte de cima" },
  Dress: { group: "dress", category: "vestido", label: "Vestido" },
  Pants: { group: "pants", category: "calca", label: "Calça" },
  Skirt: { group: "skirt", category: "saia", label: "Saia" },
  "Left-shoe": { group: "shoes", category: "sapato", label: "Sapatos" },
  "Right-shoe": { group: "shoes", category: "sapato", label: "Sapatos" },
  Bag: { group: "bag", category: "bolsa", label: "Bolsa" },
  Hat: { group: "hat", category: "acessorio", label: "Chapéu" },
  Scarf: { group: "scarf", category: "acessorio", label: "Lenço" },
  Sunglasses: { group: "glasses", category: "acessorio", label: "Óculos" },
  Belt: { group: "belt", category: "acessorio", label: "Cinto" },
};

let progressListener = null;
let segmenterPromise = null;

/** Carrega o modelo (uma vez). onProgress recebe 0–1 enquanto baixa. */
export function loadSegmenter(onProgress) {
  progressListener = onProgress || null;
  if (!segmenterPromise) {
    segmenterPromise = (async () => {
      const { pipeline, env } = await import("@huggingface/transformers");
      env.allowLocalModels = false;
      return pipeline("image-segmentation", MODEL, {
        dtype: "q8",
        progress_callback: (p) => {
          if (p.status === "progress_total" && typeof p.progress === "number") progressListener?.(p.progress / 100);
        },
      });
    })().catch((e) => {
      segmenterPromise = null; // deixa tentar de novo
      throw e;
    });
  }
  return segmenterPromise;
}

function resizeToCanvas(img, max = 1024) {
  const s = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas");
  c.width = Math.round(img.width * s);
  c.height = Math.round(img.height * s);
  const ctx = c.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, c.width, c.height);
  return c;
}

const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));

/** Cor média dos pixels da peça → cor mais próxima da paleta do app. */
function guessColor(data, alpha) {
  let r = 0, g = 0, b = 0, n = 0;
  for (let i = 0; i < alpha.length; i += 3) {
    if (!alpha[i]) continue;
    r += data[i * 4]; g += data[i * 4 + 1]; b += data[i * 4 + 2]; n++;
  }
  if (!n) return null;
  const avg = [r / n, g / n, b / n];
  let best = null, bestD = Infinity;
  for (const c of COLORS) {
    if (!c.hex.startsWith("#")) continue;
    const [cr, cg, cb] = hexRgb(c.hex);
    const d = (avg[0] - cr) ** 2 * 0.3 + (avg[1] - cg) ** 2 * 0.59 + (avg[2] - cb) ** 2 * 0.11;
    if (d < bestD) { bestD = d; best = c.id; }
  }
  return best;
}

/**
 * Separa as peças de uma foto.
 * @returns {{ pieces: {group, category, label, color, image, coverage}[], ms: number }}
 */
export async function splitOutfit(file, { onProgress } = {}) {
  const seg = await loadSegmenter(onProgress);

  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const canvas = resizeToCanvas(bitmap);
  bitmap.close?.();
  const W = canvas.width, H = canvas.height;
  const src = canvas.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, W, H);

  const t0 = performance.now();
  const output = await seg(canvas.toDataURL("image/jpeg", 0.92));
  const ms = performance.now() - t0;

  // junta máscaras do mesmo grupo (ex.: sapato esquerdo + direito)
  const groups = new Map();
  for (const { label, mask } of output) {
    const info = LABELS[label];
    if (!info || !mask) continue;
    let m = mask;
    if (m.width !== W || m.height !== H) m = await m.resize(W, H);
    const ch = m.channels || 1;
    const g = groups.get(info.group) || { ...info, alpha: new Uint8Array(W * H) };
    for (let i = 0; i < W * H; i++) if (m.data[i * ch] > 127) g.alpha[i] = 255;
    groups.set(info.group, g);
  }

  const pieces = [];
  for (const g of groups.values()) {
    let count = 0;
    for (let i = 0; i < g.alpha.length; i++) if (g.alpha[i]) count++;
    const coverage = count / (W * H);
    if (coverage < 0.004) continue; // pedacinho perdido: ignora

    const out = document.createElement("canvas");
    out.width = W;
    out.height = H;
    const octx = out.getContext("2d");
    const img = octx.createImageData(W, H);
    for (let i = 0; i < W * H; i++) {
      const p = i * 4;
      img.data[p] = src.data[p];
      img.data[p + 1] = src.data[p + 1];
      img.data[p + 2] = src.data[p + 2];
      img.data[p + 3] = g.alpha[i];
    }
    octx.putImageData(img, 0, 0);
    const { dataUrl } = await finalizeImage(out.toDataURL("image/png"), { trim: true });
    pieces.push({ group: g.group, category: g.category, label: g.label, color: guessColor(src.data, g.alpha), image: dataUrl, coverage });
  }

  const order = ["hat", "glasses", "scarf", "top", "dress", "belt", "pants", "skirt", "shoes", "bag"];
  pieces.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group));
  return { pieces, ms };
}
