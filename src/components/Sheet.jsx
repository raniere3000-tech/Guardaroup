import { AnimatePresence, motion, useDragControls } from "framer-motion";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";

/**
 * Painel que sobe de baixo (no celular) ou aparece no centro (no computador).
 * Fecha arrastando a alça para baixo, tocando fora, no X, no Esc
 * ou com o botão "voltar" do celular.
 */
export default function Sheet({ open, onClose, children, label }) {
  const controls = useDragControls();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // Botão voltar do Android / gesto de voltar: abre uma "entrada" no histórico
  useEffect(() => {
    if (!open) return;
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
      // fechou pelo app (X, arrastar, tocar fora): remove a entrada extra
      if (!closedByBack && window.history.state?.sheet === marker) window.history.back();
    };
  }, [open]);

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
            className="relative flex w-full max-h-[92dvh] flex-col bg-paper rounded-t-[28px] sm:max-w-md sm:rounded-[28px] shadow-2xl"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            drag="y"
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 90 || info.velocity.y > 500) onClose();
            }}
          >
            {/* alça: arraste pra baixo para fechar */}
            <div
              className="relative flex shrink-0 cursor-grab touch-none justify-center pt-3 pb-3 active:cursor-grabbing"
              onPointerDown={(e) => controls.start(e)}
            >
              <span className="h-1.5 w-12 rounded-full bg-line" />
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={onClose}
                aria-label="Fechar"
                className="absolute right-3 top-2 grid size-9 place-items-center rounded-full bg-white text-ink-soft ring-1 ring-line active:scale-95"
              >
                <X size={18} />
              </button>
            </div>
            <div className="overflow-y-auto overscroll-contain pb-safe">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
