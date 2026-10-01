import { useEffect, useRef, useState } from "react";
import { Rnd } from "react-rnd";
import { motion } from "framer-motion";
import { X } from "lucide-react";

export const BOARD_RATIO = 4 / 3; // altura / largura

/**
 * Quadro do criador de looks. Posições guardadas em frações (0–1) para
 * funcionar igual em qualquer tamanho de tela.
 */
export default function OutfitCanvas({ items, clothesById, selectedId, onSelect, onChange, onRemove, boardRef }) {
  const wrapRef = useRef(null);
  const [W, setW] = useState(0);
  const H = W * BOARD_RATIO;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={(el) => {
        wrapRef.current = el;
        if (boardRef) boardRef.current = el;
      }}
      className="relative w-full overflow-hidden rounded-[28px] bg-[#FFF8E8] ring-1 ring-line touch-none select-none"
      style={{ aspectRatio: `1 / ${BOARD_RATIO}` }}
      onPointerDown={(e) => {
        if (e.target === e.currentTarget) onSelect(null);
      }}
    >
      {/* guia suave de silhueta */}
      <svg viewBox="0 0 100 133" className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden="true">
        <circle cx="50" cy="10" r="6" fill="#1C1A17" />
        <path d="M38 20h24l6 40h-8l-2 66h-7l-1-50-1 50h-7l-2-66h-8z" fill="#1C1A17" />
      </svg>

      {W > 0 &&
        items.map((it) => {
          const cloth = clothesById[it.clothId];
          if (!cloth) return null;
          const selected = selectedId === it.slot;
          return (
            <Rnd
              key={it.slot + it.clothId}
              bounds="parent"
              lockAspectRatio
              size={{ width: it.w * W, height: it.h * H }}
              position={{ x: it.x * W, y: it.y * H }}
              minWidth={W * 0.12}
              style={{ zIndex: it.z }}
              enableResizing={selected ? { bottomRight: true } : false}
              resizeHandleClasses={{ bottomRight: "rnd-handle" }}
              onDragStart={() => onSelect(it.slot)}
              onDragStop={(_, d) => onChange(it.slot, { x: d.x / W, y: d.y / H })}
              onResizeStop={(_, __, ref, ___, pos) =>
                onChange(it.slot, { w: ref.offsetWidth / W, h: ref.offsetHeight / H, x: pos.x / W, y: pos.y / H })
              }
            >
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 18, stiffness: 260 }}
                className={`relative h-full w-full rounded-xl transition-shadow ${selected ? "outline-2 outline-dashed outline-ink/50 outline-offset-2" : ""}`}
                onPointerDown={() => onSelect(it.slot)}
              >
                <img src={cloth.image} alt="" draggable={false} className="pointer-events-none h-full w-full object-contain drop-shadow-[0_6px_10px_rgba(28,26,23,0.12)]" />
                {selected && (
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(it.slot);
                    }}
                    aria-label="Tirar peça do look"
                    className="absolute -right-3 -top-3 grid size-8 place-items-center rounded-full bg-ink text-paper shadow-lg"
                  >
                    <X size={16} strokeWidth={3} />
                  </button>
                )}
              </motion.div>
            </Rnd>
          );
        })}
    </div>
  );
}
