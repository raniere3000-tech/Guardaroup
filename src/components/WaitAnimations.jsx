import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Scissors } from "lucide-react";

/** Frases que trocam sozinhas a cada 2 s. */
function useRotating(list, ms = 2000) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((n) => (n + 1) % list.length), ms);
    return () => clearInterval(t);
  }, [list.length, ms]);
  return list.at(i);
}

function Phrase({ text }) {
  return (
    <motion.p key={text} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-5 text-center font-semibold">
      {text}
    </motion.p>
  );
}

/** 1) Primeiro uso: baixar o recortador. Cabide balançando + barra de progresso. */
export function HangerWait({ progress = null, phrases = ["Abrindo o guarda-roupa…", "Passando as roupas…", "Arrumando os cabides…", "Quase lá…"] }) {
  const text = useRotating(phrases);
  return (
    <div className="flex flex-col items-center">
      <motion.svg viewBox="0 0 120 100" className="w-36" animate={{ rotate: [-8, 8, -8] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} style={{ originY: 0.05 }}>
        <g fill="none" stroke="#1C1A17" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M52 22a8 8 0 1 1 12 7c-3 2-4 4-4 7v4" />
          <path d="M60 40 22 64c-4 3-2 9 3 9h70c5 0 7-6 3-9L60 40z" />
        </g>
        <path d="M30 73h60l-6 22H36z" fill="#FFDFBC" />
      </motion.svg>
      <Phrase text={text} />
      <div className="mt-3 h-2 w-56 overflow-hidden rounded-full bg-line">
        {progress == null ? (
          <motion.div className="h-full w-1/3 rounded-full bg-ink" animate={{ x: ["-100%", "300%"] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }} />
        ) : (
          <div className="h-full rounded-full bg-ink transition-all duration-300" style={{ width: `${Math.round(progress * 100)}%` }} />
        )}
      </div>
      {progress != null && <p className="mt-1.5 text-xs text-ink-mute">{Math.round(progress * 100)}% · só na primeira vez</p>}
    </div>
  );
}

const SHIRT = "M40 20 L70 8 Q90 26 110 8 L140 20 L176 60 L150 86 L136 72 L136 196 L44 196 L44 72 L30 86 L4 60 Z";

/** 2) Tirar o fundo de uma peça: tesoura contornando a roupa. */
export function ScissorsWait({ phrases = ["Recortando com carinho…", "Tirando o fundo…", "Caprichando nas bordas…"] }) {
  const text = useRotating(phrases);
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[210px] w-[180px]">
        <svg viewBox="0 0 180 210" className="absolute inset-0">
          <path d={SHIRT} fill="#FFF1C9" />
          <motion.path d={SHIRT} fill="none" stroke="#1C1A17" strokeWidth="3" strokeDasharray="8 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} />
        </svg>
        <span className="scissors-run absolute left-0 top-0 grid size-9 place-items-center rounded-full bg-ink text-paper shadow-lg" style={{ offsetPath: `path("${SHIRT}")`, offsetRotate: "auto" }}>
          <Scissors size={18} />
        </span>
      </div>
      <Phrase text={text} />
    </div>
  );
}

const CARDS = [
  { color: "#EBA6B9", label: "Blusa", x: -92, r: -14 },
  { color: "#4F6F94", label: "Calça", x: -31, r: -5 },
  { color: "#1C1A17", label: "Sapato", x: 31, r: 5 },
  { color: "#A8743F", label: "Bolsa", x: 92, r: 14 },
];

/** 3) Separar as peças da foto de corpo inteiro: peças saindo da foto como cartas. */
export function CardsWait({ photo, phrases = ["Olhando seu look…", "Achando cada peça…", "Separando as roupas…", "Quase pronto…"] }) {
  const text = useRotating(phrases);
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-[270px] w-[300px]">
        <div className="absolute left-1/2 top-2 h-40 w-28 -translate-x-1/2 overflow-hidden rounded-2xl bg-cream shadow-md ring-4 ring-paper">
          {photo ? (
            <img src={photo} alt="" className="h-full w-full object-cover" />
          ) : (
            <svg viewBox="0 0 100 140" className="h-full w-full opacity-40"><circle cx="50" cy="22" r="12" fill="#1C1A17" /><path d="M32 40h36l8 50h-12l-3 46h-10l-1-34-1 34h-10l-3-46h-12z" fill="#1C1A17" /></svg>
          )}
          <motion.div className="absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-paper/80 to-transparent" animate={{ y: [-40, 170] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }} />
        </div>
        {CARDS.map((c, i) => (
          <motion.div
            key={c.label}
            className="absolute left-1/2 top-16 flex h-20 w-14 -ml-7 flex-col items-center justify-end rounded-xl bg-white pb-1.5 shadow-lg ring-1 ring-line"
            initial={{ x: 0, y: 0, rotate: 0, opacity: 0, scale: 0.5 }}
            animate={{ x: [0, c.x, c.x, 0], y: [0, 110, 110, 0], rotate: [0, c.r, c.r, 0], opacity: [0, 1, 1, 0], scale: [0.5, 1, 1, 0.5] }}
            transition={{ duration: 4, times: [0, 0.25, 0.85, 1], repeat: Infinity, delay: i * 0.35, ease: "easeOut" }}
          >
            <span className="mb-1 h-9 w-9 rounded-lg" style={{ background: c.color }} />
            <span className="text-[10px] font-bold">{c.label}</span>
          </motion.div>
        ))}
      </div>
      <Phrase text={text} />
    </div>
  );
}
