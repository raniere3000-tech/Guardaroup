import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Share2, Pencil, Trash2, Sparkles, Loader2 } from "lucide-react";
import { useStore } from "../store/useStore";
import { useToast } from "../components/Toast";
import PageHeader from "../components/PageHeader";
import FilterBar from "../components/FilterBar";
import EmptyState from "../components/EmptyState";
import Sheet from "../components/Sheet";
import TipPopup from "../components/TipPopup";
import { renderLook, shareOrDownload } from "../lib/image";

function OutfitCard({ outfit, onClick }) {
  return (
    <motion.button layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} whileTap={{ scale: 0.97 }}
      onClick={onClick} className="w-full rounded-3xl bg-white p-2 text-left ring-1 ring-line hover:shadow-md">
      <img src={outfit.preview} alt={outfit.name} className="aspect-[3/4] w-full rounded-[18px] object-cover" loading="lazy" />
      <div className="px-1.5 pt-2 pb-0.5">
        <p className="truncate text-sm font-semibold">{outfit.name}</p>
        {outfit.category && <p className="truncate text-xs text-ink-mute">{outfit.category}</p>}
      </div>
    </motion.button>
  );
}

export default function Outfits() {
  const { outfits, clothesById, deleteOutfit, bump } = useStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [cat, setCat] = useState("all");
  const [confirm, setConfirm] = useState(false);
  const [sharing, setSharing] = useState(false);

  const viewing = outfits.find((o) => o.id === params.get("ver"));
  const close = () => { setConfirm(false); setParams({}, { replace: true }); };

  const options = useMemo(() => {
    const cats = [...new Set(outfits.map((o) => o.category).filter(Boolean))];
    return [{ id: "all", label: "Todos", count: outfits.length }, ...cats.map((c) => ({ id: c, label: c, count: outfits.filter((o) => o.category === c).length }))];
  }, [outfits]);
  const list = outfits.filter((o) => cat === "all" || o.category === cat);

  const share = async () => {
    setSharing(true);
    try {
      const blob = await renderLook(viewing.items, clothesById, { width: 1080, type: "image/png" });
      const fname = `${viewing.name.normalize("NFD").replace(/[^\w]+/g, "-").toLowerCase() || "look"}.png`;
      const r = await shareOrDownload(blob, fname, viewing.name);
      if (r !== "cancelled") bump("exports");
      if (r === "downloaded") toast("Imagem baixada!");
    } catch (e) {
      console.error(e);
      toast("Não consegui gerar a imagem", "error");
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="pb-32">
      <PageHeader title="Meus looks" subtitle={outfits.length ? `${outfits.length} ${outfits.length === 1 ? "look salvo" : "looks salvos"}` : undefined} />
      <div className="mx-auto max-w-3xl px-5">
        {outfits.length === 0 ? (
          <EmptyState title="Nenhum look ainda" text="Monte seu primeiro look combinando as peças do seu closet."
            action={<button onClick={() => navigate("/criar-look")} className="flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 font-semibold text-paper"><Sparkles size={19} /> Criar look</button>} />
        ) : (
          <>
            {options.length > 2 && <FilterBar options={options} value={cat} onChange={setCat} className="mb-4" />}
            <motion.div layout className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {list.map((o) => <OutfitCard key={o.id} outfit={o} onClick={() => setParams({ ver: o.id })} />)}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </div>

      <Sheet open={Boolean(viewing)} onClose={close} label="Ver look">
        {viewing && (
          <div className="px-5 pb-6">
            <img src={viewing.preview} alt={viewing.name} className="mx-auto mt-2 aspect-[3/4] w-full max-w-xs rounded-[24px] object-cover ring-1 ring-line" />
            <div className="mt-4 text-center">
              <h2 className="font-display text-2xl font-semibold">{viewing.name}</h2>
              {viewing.category && <p className="text-sm text-ink-mute">{viewing.category}</p>}
            </div>
            {confirm ? (
              <div className="mt-5 rounded-2xl bg-red-50 p-4">
                <p className="font-semibold">Excluir esse look?</p>
                <p className="mt-1 text-sm text-ink-soft">As peças continuam no seu closet.</p>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button onClick={() => setConfirm(false)} className="rounded-full bg-white py-3 font-semibold ring-1 ring-line">Cancelar</button>
                  <button onClick={() => { deleteOutfit(viewing.id); toast("Look excluído"); close(); }} className="rounded-full bg-red-600 py-3 font-semibold text-white">Excluir</button>
                </div>
              </div>
            ) : (
              <div className="mt-5 grid gap-2">
                <button onClick={share} disabled={sharing} className="flex items-center justify-center gap-2 rounded-full bg-ink py-3.5 font-semibold text-paper">
                  {sharing ? <Loader2 size={18} className="animate-spin" /> : <Share2 size={18} />} Compartilhar imagem
                </button>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => navigate(`/criar-look/${viewing.id}`)} className="flex items-center justify-center gap-2 rounded-full bg-white py-3.5 font-semibold ring-1 ring-line"><Pencil size={17} /> Editar</button>
                  <button onClick={() => setConfirm(true)} className="flex items-center justify-center gap-2 rounded-full bg-white py-3.5 font-semibold text-red-600 ring-1 ring-line"><Trash2 size={17} /> Excluir</button>
                </div>
              </div>
            )}
          </div>
        )}
      </Sheet>

      <TipPopup id="outfits" when={outfits.length > 0 && !viewing} />
    </div>
  );
}
