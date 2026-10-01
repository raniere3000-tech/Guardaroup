import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Plus, Sparkles, ArrowRight, MessageCircle } from "lucide-react";
import { useRef } from "react";
import { useStore } from "../store/useStore";
import ClothingCard from "../components/ClothingCard";
import EmptyState from "../components/EmptyState";
import TipPopup from "../components/TipPopup";
import { FEEDBACK_URL } from "../lib/constants";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

export default function Home({ onOpenCloth }) {
  const { clothes, outfits } = useStore();
  const navigate = useNavigate();
  const taps = useRef({ n: 0, t: 0 });

  // atalho escondido: tocar 5x no logo abre as estatísticas do teste
  const secretTap = () => {
    const now = Date.now();
    taps.current = now - taps.current.t < 600 ? { n: taps.current.n + 1, t: now } : { n: 1, t: now };
    if (taps.current.n >= 5) navigate("/estatisticas");
  };

  return (
    <div className="mx-auto max-w-3xl px-5 pt-safe">
      <header className="flex items-center justify-between pt-5">
        <button onClick={secretTap} className="font-display text-[28px] font-semibold tracking-tight select-none" aria-label="Vestí">
          Vestí<span className="text-beige">.</span>
        </button>
        {FEEDBACK_URL && (
          <a href={FEEDBACK_URL} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-full bg-white px-3.5 py-2 text-sm font-semibold ring-1 ring-line">
            <MessageCircle size={16} /> Feedback
          </a>
        )}
      </header>

      <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 overflow-hidden rounded-[32px] bg-cream p-6">
        <p className="text-sm font-semibold text-ink-soft">{greeting()} ✨</p>
        <h1 className="mt-1 font-display text-[30px] leading-[1.1] font-semibold tracking-tight">
          {clothes.length === 0 ? "Bora montar seu closet?" : "O que vamos vestir hoje?"}
        </h1>
        <div className="mt-5 flex gap-3">
          <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate("/adicionar")} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-ink py-3.5 font-semibold text-paper shadow-lg shadow-ink/15">
            <Plus size={20} strokeWidth={2.5} /> Adicionar roupa
          </motion.button>
          {clothes.length > 1 && (
            <motion.button whileTap={{ scale: 0.96 }} onClick={() => navigate("/criar-look")} aria-label="Criar look" className="grid size-[52px] place-items-center rounded-full bg-paper">
              <Sparkles size={21} />
            </motion.button>
          )}
        </div>
        {clothes.length > 0 && (
          <div className="mt-5 flex gap-6 text-sm">
            <div><span className="font-display text-2xl font-semibold">{clothes.length}</span> <span className="text-ink-soft">{clothes.length === 1 ? "peça" : "peças"}</span></div>
            <div><span className="font-display text-2xl font-semibold">{outfits.length}</span> <span className="text-ink-soft">{outfits.length === 1 ? "look" : "looks"}</span></div>
          </div>
        )}
      </motion.section>

      {clothes.length === 0 ? (
        <EmptyState title="Adicione sua primeira peça" text="Tira uma foto de uma roupa que você ama. A gente cuida do resto." />
      ) : (
        <section className="mt-8 pb-32">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Adicionadas recentemente</h2>
            <button onClick={() => navigate("/guarda-roupa")} className="flex items-center gap-1 text-sm font-semibold text-ink-soft">
              Ver tudo <ArrowRight size={16} />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {clothes.slice(0, 8).map((c) => <ClothingCard key={c.id} item={c} onClick={() => onOpenCloth(c)} />)}
          </div>
        </section>
      )}

      <TipPopup id="home" />
    </div>
  );
}
