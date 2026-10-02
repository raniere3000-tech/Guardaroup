import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { HangerWait, ScissorsWait, CardsWait } from "../components/WaitAnimations";

const ITEMS = [
  { id: "hanger", title: "Cabide", when: "1º uso: baixando o recortador", secs: 6 },
  { id: "scissors", title: "Tesoura", when: "Tirando o fundo de uma peça", secs: 5 },
  { id: "cards", title: "Cartas", when: "Separando a foto de corpo inteiro", secs: 8 },
];

export default function WaitLab() {
  const [playing, setPlaying] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!playing) return;
    const total = ITEMS.find((i) => i.id === playing).secs * 1000;
    const t0 = performance.now();
    const t = setInterval(() => {
      const p = Math.min(1, (performance.now() - t0) / total);
      setProgress(p);
      if (p >= 1) setPlaying(null);
    }, 100);
    return () => clearInterval(t);
  }, [playing]);

  return (
    <div className="mx-auto max-w-md px-4 pb-10">
      <p className="mb-4 text-ink-soft">Toque para ver cada animação durante uma espera simulada.</p>
      <div className="space-y-3">
        {ITEMS.map((it) => (
          <button key={it.id} onClick={() => { setProgress(0); setPlaying(it.id); }} className="flex w-full items-center justify-between rounded-2xl bg-white p-4 text-left ring-1 ring-line">
            <span><span className="block font-semibold">{it.title}</span><span className="text-sm text-ink-mute">{it.when}</span></span>
            <span className="rounded-full bg-cream px-3 py-1.5 text-sm font-semibold">Ver · {it.secs} s</span>
          </button>
        ))}
      </div>
      <AnimatePresence>
        {playing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 grid place-items-center bg-paper/95 backdrop-blur">
            <button onClick={() => setPlaying(null)} aria-label="Fechar" className="absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white ring-1 ring-line"><X size={18} /></button>
            {playing === "hanger" && <HangerWait progress={progress} />}
            {playing === "scissors" && <ScissorsWait />}
            {playing === "cards" && <CardsWait />}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
