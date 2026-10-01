import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useStore } from "../store/useStore";
import PageHeader from "../components/PageHeader";
import FilterBar from "../components/FilterBar";
import ClothingCard from "../components/ClothingCard";
import EmptyState from "../components/EmptyState";
import TipPopup from "../components/TipPopup";
import ColorDot from "../components/ColorDot";
import { CATEGORIES, COLORS } from "../lib/constants";

export default function Wardrobe({ onOpenCloth }) {
  const { clothes } = useStore();
  const navigate = useNavigate();
  const [cat, setCat] = useState("all");
  const [color, setColor] = useState(null);

  const catOptions = useMemo(() => {
    const counts = clothes.reduce((acc, c) => ((acc[c.category] = (acc[c.category] || 0) + 1), acc), {});
    return [{ id: "all", label: "Tudo", count: clothes.length }, ...CATEGORIES.filter((c) => counts[c.id]).map((c) => ({ id: c.id, label: c.label, count: counts[c.id] }))];
  }, [clothes]);

  const colorsInUse = useMemo(() => COLORS.filter((c) => clothes.some((x) => x.color === c.id)), [clothes]);
  const list = clothes.filter((c) => (cat === "all" || c.category === cat) && (!color || c.color === color));

  return (
    <div className="pb-32">
      <PageHeader
        title="Guarda-roupa"
        subtitle={clothes.length ? `${clothes.length} ${clothes.length === 1 ? "peça" : "peças"}` : undefined}
        right={clothes.length > 0 && (
          <button onClick={() => navigate("/adicionar")} aria-label="Adicionar roupa" className="grid size-10 place-items-center rounded-full bg-cream"><Plus size={20} /></button>
        )}
      />
      <div className="mx-auto max-w-3xl px-5">
        {clothes.length === 0 ? (
          <EmptyState
            title="Adicione sua primeira peça"
            text="Seu closet ainda tá vazio. Começa por aquela peça que você mais usa."
            action={<button onClick={() => navigate("/adicionar")} className="flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 font-semibold text-paper"><Plus size={20} /> Adicionar roupa</button>}
          />
        ) : (
          <>
            <FilterBar options={catOptions} value={cat} onChange={setCat} />
            {colorsInUse.length > 1 && (
              <div className="no-scrollbar -mx-5 mt-2 flex items-center gap-2 overflow-x-auto px-5 py-1">
                {colorsInUse.map((c) => (
                  <button key={c.id} onClick={() => setColor(color === c.id ? null : c.id)} aria-pressed={color === c.id} aria-label={`Filtrar por ${c.label}`}
                    className={`grid size-9 shrink-0 place-items-center rounded-full transition ${color === c.id ? "bg-ink" : "bg-white ring-1 ring-line"}`}>
                    <ColorDot color={c.id} size={18} />
                  </button>
                ))}
                {color && <button onClick={() => setColor(null)} className="shrink-0 px-2 text-sm font-semibold text-ink-soft">Limpar</button>}
              </div>
            )}
            <motion.div layout className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              <AnimatePresence mode="popLayout">
                {list.map((c) => <ClothingCard key={c.id} item={c} onClick={() => onOpenCloth(c)} />)}
              </AnimatePresence>
            </motion.div>
            {list.length === 0 && <p className="py-16 text-center text-ink-mute">Nenhuma peça com esse filtro.</p>}
          </>
        )}
      </div>
      <TipPopup id="wardrobe" when={clothes.length > 0} />
    </div>
  );
}
