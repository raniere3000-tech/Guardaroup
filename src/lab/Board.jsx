import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export const BOARD_RATIO = 4 / 3; // altura / largura

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const dist = (p, q) => Math.hypot(q.x - p.x, q.y - p.y);
const angle = (p, q) => (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI;
const mid = (p, q) => ({ x: (p.x + q.x) / 2, y: (p.y + q.y) / 2 });
// "ímã" de giro: perto de 0°, 90°, 180°... encaixa reto
const snapAngle = (r) => {
  const near = Math.round(r / 90) * 90;
  return Math.abs(r - near) < 4 ? near : r;
};

/**
 * Quadro do criador de looks com gestos de toque.
 *
 * item = { id, clothId, slot, x, y, s, r, z }
 *   x, y = centro da peça (fração da largura / altura do quadro)
 *   s    = largura da peça (fração da largura do quadro)
 *   r    = giro em graus
 *
 * Gestos:
 *   - toque na peça: seleciona
 *   - 1 dedo: arrasta
 *   - 2 dedos: pinça muda o tamanho e gira (o 2º dedo pode estar fora da peça)
 *   - toque no vazio: tira a seleção
 *   - X no canto superior esquerdo: remove
 */
export default function Board({ items, clothesById, selectedId, onSelect, onChange, onRemove }) {
  const ref = useRef(null);
  const [W, setW] = useState(0);
  const H = W * BOARD_RATIO;
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const selRef = useRef(selectedId);
  selRef.current = selectedId;

  useEffect(() => {
    const el = ref.current;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    // Safari: impede o zoom da página com dois dedos em cima do quadro
    const stop = (e) => e.preventDefault();
    el.addEventListener("gesturestart", stop);
    el.addEventListener("gesturechange", stop);
    return () => {
      ro.disconnect();
      el.removeEventListener("gesturestart", stop);
      el.removeEventListener("gesturechange", stop);
    };
  }, []);

  const find = (id) => itemsRef.current.find((i) => i.id === id);
  const cbRef = useRef(clothesById);
  cbRef.current = clothesById;

  // Mantém o canto superior esquerdo (onde fica o X) sempre dentro do quadro
  // e pelo menos 40 px da peça à vista nos lados direito e de baixo.
  const keepInside = (id, x, y, s) => {
    const it = find(id);
    const aspect = cbRef.current[it?.clothId]?.aspect || 1;
    const w = s * W, h = w / aspect, m = 18;
    const fx = clamp(x * W, Math.min(w / 2 + m, W - 40 + w / 2), W - 40 + w / 2);
    const fy = clamp(y * H, Math.min(h / 2 + m, H - 40 + h / 2), H - 40 + h / 2);
    return { x: Math.max(w / 2 + m, fx) / W, y: Math.max(h / 2 + m, fy) / H };
  };

  const startDrag = (id, p) => {
    const it = find(id);
    if (!it) return (gesture.current = null);
    gesture.current = { type: "drag", id, start: p, x0: it.x, y0: it.y, moved: false };
  };

  const startPinch = (id) => {
    const it = find(id);
    const [p, q] = [...pointers.current.values()];
    if (!it || !p || !q) return;
    gesture.current = { type: "pinch", id, d0: Math.max(10, dist(p, q)), a0: angle(p, q), m0: mid(p, q), s0: it.s, r0: it.r, x0: it.x, y0: it.y };
  };

  const onPointerDown = (e) => {
    if (!W) return;
    ref.current.setPointerCapture?.(e.pointerId);
    const p = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, p);

    if (pointers.current.size === 1) {
      const pieceId = e.target.closest?.("[data-piece]")?.dataset.piece;
      if (pieceId) {
        onSelect(pieceId);
        startDrag(pieceId, p);
      } else {
        gesture.current = { type: "empty", start: p, moved: false };
      }
    } else if (pointers.current.size === 2) {
      const id = gesture.current?.id || selRef.current;
      if (id) startPinch(id);
    }
  };

  const onPointerMove = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    const p = { x: e.clientX, y: e.clientY };
    pointers.current.set(e.pointerId, p);
    const g = gesture.current;
    if (!g) return;

    if (g.type === "empty") {
      if (dist(g.start, p) > 8) g.moved = true;
      return;
    }
    if (g.type === "drag" && pointers.current.size === 1) {
      const dx = p.x - g.start.x, dy = p.y - g.start.y;
      if (Math.hypot(dx, dy) > 3) g.moved = true;
      const it = find(g.id);
      onChange(g.id, keepInside(g.id, g.x0 + dx / W, g.y0 + dy / H, it?.s || 0.3));
      return;
    }
    if (g.type === "pinch" && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const m = mid(a, b);
      const s = clamp((g.s0 * dist(a, b)) / g.d0, 0.08, 1.2);
      onChange(g.id, {
        s,
        r: snapAngle(g.r0 + angle(a, b) - g.a0),
        ...keepInside(g.id, g.x0 + (m.x - g.m0.x) / W, g.y0 + (m.y - g.m0.y) / H, s),
      });
    }
  };

  const onPointerUp = (e) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.delete(e.pointerId);
    const g = gesture.current;
    if (pointers.current.size === 1 && g?.type === "pinch") {
      // saiu um dedo: continua arrastando com o outro, sem "pulo"
      const [p] = [...pointers.current.values()];
      startDrag(g.id, p);
      gesture.current.moved = true;
      return;
    }
    if (pointers.current.size === 0) {
      if (g?.type === "empty" && !g.moved) onSelect(null);
      gesture.current = null;
    }
  };

  return (
    <div
      ref={ref}
      data-board
      className="relative w-full select-none overflow-hidden rounded-[28px] bg-[#FFF8E8] ring-1 ring-line"
      style={{ aspectRatio: `1 / ${BOARD_RATIO}`, touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <svg viewBox="0 0 100 133" className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden="true">
        <circle cx="50" cy="10" r="6" fill="#1C1A17" />
        <path d="M38 20h24l6 40h-8l-2 66h-7l-1-50-1 50h-7l-2-66h-8z" fill="#1C1A17" />
      </svg>

      {W > 0 &&
        [...items].sort((a, b) => a.z - b.z).map((it) => {
          const c = clothesById[it.clothId];
          if (!c) return null;
          const w = it.s * W, h = w / (c.aspect || 1);
          return (
            <div
              key={it.id}
              data-piece={it.id}
              data-piece-slot={it.slot}
              className="absolute"
              style={{ left: it.x * W, top: it.y * H, width: w, height: h, transform: `translate(-50%, -50%) rotate(${it.r}deg)`, zIndex: it.z }}
            >
              <motion.img
                key={it.clothId}
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 20, stiffness: 300 }}
                src={c.image}
                alt=""
                draggable={false}
                className="pointer-events-none h-full w-full object-contain drop-shadow-[0_8px_12px_rgba(28,26,23,0.14)]"
              />
            </div>
          );
        })}

      {/* contorno + X sempre por cima de todas as peças, mesmo se a selecionada estiver atrás */}
      {W > 0 && (() => {
        const it = items.find((i) => i.id === selectedId);
        const c = it && clothesById[it.clothId];
        if (!c) return null;
        const w = it.s * W, h = w / (c.aspect || 1);
        return (
          <div
            className="pointer-events-none absolute"
            style={{ left: it.x * W, top: it.y * H, width: w, height: h, transform: `translate(-50%, -50%) rotate(${it.r}deg)`, zIndex: 9999 }}
          >
            <span className="absolute -inset-1.5 rounded-xl border-2 border-dashed border-ink/50" />
            <button
              type="button"
              aria-label="Tirar peça do look"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onRemove(it.id);
              }}
              className="pointer-events-auto absolute -left-[22px] -top-[22px] grid size-11 place-items-center"
              style={{ transform: `rotate(${-it.r}deg)` }}
            >
              <span className="grid size-8 place-items-center rounded-full bg-ink text-paper shadow-lg ring-[3px] ring-paper">
                <X size={16} strokeWidth={3} />
              </span>
            </button>
          </div>
        );
      })()}
    </div>
  );
}
