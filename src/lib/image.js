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
    model: "isnet_quint8",
    output: { format: "image/png" },
    progress: (key, current, total) => {
      if (!onProgress) return;
      if (key.startsWith("fetch")) onProgress({ stage: "download", pct: total ? current / total : 0 });
      else onProgress({ stage: "process", pct: total ? current / total : 0 });
    },
  });
}

/** Corta as sobras transparentes e salva em formato leve que mantém a transparência. */
export async function finalizeImage(blob, { trim = true } = {}) {
  const img = await loadImage(blob);
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

/** Desenha o look inteiro numa única imagem (para salvar, baixar e compartilhar). */
export async function renderLook(items, clothesById, { width = 1080, ratio = 4 / 3, background = "#FFF8E8", watermark = true, type = "image/png", quality } = {}) {
  const height = Math.round(width * ratio);
  const c = canvasFor(width, height);
  const ctx = c.getContext("2d");
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, width, height);

  const sorted = [...items].sort((a, b) => a.z - b.z);
  for (const it of sorted) {
    const cloth = clothesById[it.clothId];
    if (!cloth) continue;
    const img = await loadImage(cloth.image);
    // a peça é desenhada "contida" na caixa, como na tela
    const bw = it.w * width, bh = it.h * height;
    const s = Math.min(bw / img.naturalWidth, bh / img.naturalHeight);
    const dw = img.naturalWidth * s, dh = img.naturalHeight * s;
    const dx = it.x * width + (bw - dw) / 2;
    const dy = it.y * height + (bh - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  if (watermark) {
    ctx.font = `600 ${Math.round(width * 0.032)}px "Fraunces Variable", Georgia, serif`;
    ctx.fillStyle = "rgba(28,26,23,0.45)";
    ctx.textAlign = "right";
    ctx.fillText("Vestí", width - width * 0.04, height - width * 0.04);
  }
  return type === "dataUrl" ? c.toDataURL(supportsWebp() ? "image/webp" : "image/png", quality ?? 0.85) : toBlob(c, type, quality);
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
