import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { ArrowRight, Camera, Wand2, Sparkles } from "lucide-react";
import { HangerIllustration } from "./EmptyState";

const slides = [
  {
    bg: "bg-cream",
    art: <HangerIllustration className="w-64" />,
    title: "Oi! Esse é o Vestí 👋",
    text: "Seu guarda-roupa inteiro no bolso. Chega de abrir o armário e não saber o que vestir.",
  },
  {
    bg: "bg-peach",
    art: (
      <div className="relative grid size-56 place-items-center">
        <div className="absolute inset-6 rotate-6 rounded-[36px] bg-paper/70" />
        <div className="relative grid size-40 place-items-center rounded-[32px] bg-paper shadow-xl">
          <Camera size={64} strokeWidth={1.5} />
          <span className="absolute -right-4 -top-4 grid size-14 place-items-center rounded-2xl bg-ink text-paper shadow-lg"><Wand2 size={26} /></span>
        </div>
      </div>
    ),
    title: "Tira foto, o fundo some",
    text: "Fotografe cada peça e o Vestí recorta sozinho. Fica só a roupa, prontinha pra combinar.",
  },
  {
    bg: "bg-lemon",
    art: (
      <div className="relative h-56 w-48">
        {[["bg-sand", "top-0 left-4 -rotate-6"], ["bg-beige", "top-16 left-12 rotate-3"], ["bg-peach", "top-36 left-6 -rotate-2"]].map(([c, pos], i) => (
          <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.15 * i }} className={`absolute h-16 w-36 rounded-2xl ${c} ${pos} shadow-md ring-2 ring-paper`} />
        ))}
        <span className="absolute -right-2 bottom-2 grid size-14 place-items-center rounded-full bg-ink text-paper shadow-lg"><Sparkles size={24} /></span>
      </div>
    ),
    title: "Monte looks em segundos",
    text: "Arraste, ajuste o tamanho e salve. Sem ideia? Aperta o sorteio. Depois é só mandar pros amigos.",
  },
];

export default function Welcome({ onFinish }) {
  const [i, setI] = useState(0);
  const last = i === slides.length - 1;
  const s = slides[i];

  const next = () => (last ? onFinish() : setI(i + 1));

  return (
    <div className={`fixed inset-0 z-[70] flex flex-col transition-colors duration-500 ${s.bg}`}>
      <div className="flex justify-end px-5 pt-safe">
        {!last && (
          <button onClick={onFinish} className="mt-4 rounded-full px-4 py-2 text-sm font-semibold text-ink-soft hover:bg-paper/60">
            Pular
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={i}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.3}
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) next();
            if (info.offset.x > 60 && i > 0) setI(i - 1);
          }}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -40 }}
          transition={{ duration: 0.3 }}
          className="flex flex-1 flex-col items-center justify-center px-8 text-center"
        >
          <div className="mb-10 grid min-h-56 place-items-center">{s.art}</div>
          <h1 className="font-display text-[34px] leading-tight font-semibold tracking-tight">{s.title}</h1>
          <p className="mt-3 max-w-sm text-lg leading-relaxed text-ink-soft">{s.text}</p>
        </motion.div>
      </AnimatePresence>

      <div className="mx-auto w-full max-w-md px-6 pb-10 pb-safe">
        <div className="mb-6 flex justify-center gap-2">
          {slides.map((_, k) => (
            <button key={k} onClick={() => setI(k)} aria-label={`Ir para o passo ${k + 1}`} className={`h-2 rounded-full transition-all ${k === i ? "w-7 bg-ink" : "w-2 bg-ink/20"}`} />
          ))}
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={next} className="mb-6 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-4 text-lg font-semibold text-paper shadow-xl shadow-ink/15">
          {last ? "Começar" : "Continuar"} <ArrowRight size={20} />
        </motion.button>
        {last && <p className="-mt-3 mb-4 text-center text-xs text-ink-soft">Suas roupas ficam salvas só neste aparelho.</p>}
      </div>
    </div>
  );
}
