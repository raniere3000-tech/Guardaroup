import { AnimatePresence, animate, motion, useMotionValue } from "framer-motion";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/**
 * Painel que sobe de baixo (no celular) ou aparece no centro (no computador).
 * Fecha puxando para baixo (pela alça ou pelo conteúdo quando ele está no topo),
 * tocando fora, no X, no Esc ou com o botão "voltar" do celular.
 */
export default function Sheet({ open, onClose, children, label }) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const y = useMotionValue(0);
  const panelRef = useRef(null);
  const scrollRef = useRef(null);

  // Botão voltar do Android / gesto de voltar: abre uma "entrada" no histórico
  useEffect(() => {
    if (!open) return;
    y.set(0);
    const marker = `sheet-${Date.now()}`;
    window.history.pushState({ ...window.history.state, sheet: marker }, "");
    let closedByBack = false;
    const onPop = () => {
      closedByBack = true;
      closeRef.current?.();
    };
    const onKey = (e) => e.key === "Escape" && closeRef.current?.();
    window.addEventListener("popstate", onPop);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      if (!closedByBack && window.history.state?.sheet === marker) window.history.back();
    };
  }, [open, y]);

  // Puxar para baixo para fechar (toque)
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    let g = null;
    const start = (e) => {
      const t = e.touches[0];
      if (e.touches.length > 1) { g = null; return; }
      g = {
        x: t.clientX, y: t.clientY, t: performance.now(), dragging: false,
        fromHandle: Boolean(e.target.closest?.("[data-sheet-handle]")),
        noDrag: Boolean(e.target.closest?.("input, textarea, [data-no-sheet-drag]")),
      };
    };
    const move = (e) => {
      if (!g || g.noDrag) return;
      const t = e.touches[0];
      const dy = t.clientY - g.y, dx = t.clientX - g.x;
      if (!g.dragging) {
        const atTop = (scrollRef.current?.scrollTop || 0) <= 0;
        if ((g.fromHandle || atTop) && dy > 6 && dy > Math.abs(dx)) {
          g.dragging = true;
          g.y = t.clientY; // começa do ponto atual, sem "pulo"
          g.t = performance.now();
        } else if (Math.abs(dy) > 6 || Math.abs(dx) > 6) {
          g.noDrag = true; // é rolagem normal
          return;
        } else return;
      }
      e.preventDefault();
      const d = Math.max(0, t.clientY - g.y);
      g.v = (d - y.get()) / Math.max(1, performance.now() - (g.last || g.t));
      g.last = performance.now();
      y.set(d);
    };
    const end = () => {
      if (g?.dragging) {
        if (y.get() > 110 || (g.v || 0) > 0.6) closeRef.current?.();
        else animate(y, 0, { type: "spring", damping: 30, stiffness: 380 });
      }
      g = null;
    };
    panel.addEventListener("touchstart", start, { passive: true });
    panel.addEventListener("touchmove", move, { passive: false });
    panel.addEventListener("touchend", end);
    panel.addEventListener("touchcancel", end);
    return () => {
      panel.removeEventListener("touchstart", start);
      panel.removeEventListener("touchmove", move);
      panel.removeEventListener("touchend", end);
      panel.removeEventListener("touchcancel", end);
    };
  }, [open, y]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" role="dialog" aria-modal="true" aria-label={label}>
          <motion.div
            className="absolute inset-0 bg-ink/30 backdrop-blur-[2px]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative w-full sm:max-w-md"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
          >
            <motion.div
              ref={panelRef}
              style={{ y }}
              className="flex max-h-[92dvh] flex-col bg-paper rounded-t-[28px] sm:rounded-[28px] shadow-2xl"
            >
              <div data-sheet-handle className="relative flex shrink-0 justify-center pt-3 pb-4">
                <span className="h-1.5 w-12 rounded-full bg-ink/15" />
                <button
                  onClick={onClose}
                  aria-label="Fechar"
                  className="absolute right-3 top-2 grid size-9 place-items-center rounded-full bg-white text-ink-soft ring-1 ring-line active:scale-95"
                >
                  <X size={18} />
                </button>
              </div>
              <div ref={scrollRef} className="overflow-y-auto overscroll-contain pb-safe">{children}</div>
            </motion.div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
