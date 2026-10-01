import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Lightbulb } from "lucide-react";
import { useStore } from "../store/useStore";
import { TIPS } from "../lib/constants";

/** Pop-up de instrução que aparece só na primeira vez em cada tela. */
export default function TipPopup({ id, when = true }) {
  const { ui, markTip, ready } = useStore();
  const tip = TIPS[id];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ready || !ui.welcomeSeen || ui.tipsSeen[id] || !when) return;
    const t = setTimeout(() => setVisible(true), 500);
    return () => clearTimeout(t);
  }, [ready, ui.welcomeSeen, ui.tipsSeen, id, when]);

  const close = () => {
    setVisible(false);
    markTip(id);
  };

  return (
    <AnimatePresence>
      {visible && tip && (
        <div className="fixed inset-0 z-[55] flex items-end justify-center px-4 pb-28 sm:items-center sm:pb-0">
          <motion.div className="absolute inset-0 bg-ink/25" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close} />
          <motion.div
            role="dialog" aria-label={tip.title}
            initial={{ y: 40, opacity: 0, scale: 0.96 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 20, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 300 }}
            className="relative w-full max-w-sm rounded-[28px] bg-lemon p-6 shadow-2xl ring-1 ring-sand"
          >
            <div className="mb-3 grid size-11 place-items-center rounded-2xl bg-paper"><Lightbulb size={22} /></div>
            <h3 className="font-display text-xl font-semibold">{tip.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">{tip.text}</p>
            <button onClick={close} className="mt-5 w-full rounded-full bg-ink py-3.5 font-semibold text-paper active:scale-[0.98] transition">
              Bora!
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
