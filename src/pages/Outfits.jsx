import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Share2, Pencil, Trash2, Sparkles, Loader2, ArrowLeft, Download } from "lucide-react";
import { useStore } from "../store/useStore";
import { useToast } from "../components/Toast";
import PageHeader from "../components/PageHeader";
import FilterBar from "../components/FilterBar";
import EmptyState from "../components/EmptyState";
import Sheet from "../components/Sheet";
import TipPopup from "../components/TipPopup";
import { renderLook, renderShareCard, shareOrDownload, SHARE_THEMES } from "../lib/image";
import { colorById } from "../lib/constants";

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
  const { outfits, clothesById, deleteOutfit, saveOutfit, bump } = useStore();
  const navigate = useNavigate();
  const toast = useToast();
  const [params, setParams] = useSearchParams();
  const [cat, setCat] = useState("all");
  const [confirm, setConfirm] = useState(false);
  const [sharing, setSharing] = useState(false);

  const [viewId, setViewId] = useState(null);
  // vindo do "Salvar look": abre o look recém-salvo e limpa o endereço
  useEffect(() => {
    const ver = params.get("ver");
    if (ver) {
      setParams({}, { replace: true });
      setTimeout(() => setViewId(ver), 50);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const viewing = outfits.find((o) => o.id === viewId);

  const upgrading = useRef(new Set());
  // atualiza miniaturas antigas para o visual novo (uma vez por look)
  useEffect(() => {
    const old = outfits.filter((o) => o.previewV !== 2 && !upgrading.current.has(o.id));
    if (!old.length) return;
    old.forEach((o) => upgrading.current.add(o.id));
    (async () => {
      for (const o of old) {
        try {
          const preview = await renderLook(o.items, clothesById, { width: 600, type: "dataUrl" });
          saveOutfit({ ...o, preview, previewV: 2 });
        } catch {}
      }
    })();
  }, [outfits, clothesById, saveOutfit]);
  const close = () => { setConfirm(false); setShareMode(false); setViewId(null); };

  const options = useMemo(() => {
    const cats = [...new Set(outfits.map((o) => o.category).filter(Boolean))];
    return [{ id: "all", label: "Todos", count: outfits.length }, ...cats.map((c) => ({ id: c, label: c, count: outfits.filter((o) => o.category === c).length }))];
  }, [outfits]);
  const list = outfits.filter((o) => cat === "all" || o.category === cat);

  const [shareMode, setShareMode] = useState(false);
  const [theme, setTheme] = useState("creme");
  const [cardPreview, setCardPreview] = useState(null);

  // prévia do cartão sempre que muda o look ou o estilo
  useEffect(() => {
    if (!shareMode || !viewing) return;
    let alive = true;
    setCardPreview(null);
    renderShareCard(viewing, clothesById, colorById, { theme, width: 540, type: "dataUrl", quality: 0.9 })
      .then((url) => alive && setCardPreview(url))
      .catch(console.error);
    return () => { alive = false; };
  }, [shareMode, theme, viewing, clothesById]);

  const share = async () => {
    setSharing(true);
    try {
      const blob = await renderShareCard(viewing, clothesById, colorById, { theme, width: 1080, type: "image/png" });
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
                {list.map((o) => <OutfitCard key={o.id} outfit={o} onClick={() => setViewId(o.id)} />)}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </div>

      <Sheet open={Boolean(viewing)} onClose={close} label="Ver look">
        {viewing && shareMode && (
          <div className="px-5 pb-6">
            <div className="flex items-center gap-2">
              <button onClick={() => setShareMode(false)} aria-label="Voltar" className="-ml-2 grid size-10 place-items-center rounded-full hover:bg-cream"><ArrowLeft size={20} /></button>
              <h2 className="font-display text-2xl font-semibold">Escolha o estilo</h2>
            </div>
            <div className="mx-auto mt-3 aspect-[4/5] w-full max-w-[300px] overflow-hidden rounded-[20px] bg-cream shadow-lg ring-1 ring-line">
              {cardPreview ? (
                <motion.img key={cardPreview.slice(-30)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={cardPreview} alt="Prévia da imagem" className="h-full w-full object-cover" />
              ) : (
                <div className="grid h-full place-items-center"><Loader2 className="animate-spin text-ink-mute" /></div>
              )}
            </div>
            <div className="no-scrollbar -mx-5 mt-5 flex justify-center gap-3 overflow-x-auto px-5">
              {SHARE_THEMES.map((t) => (
                <button key={t.id} onClick={() => setTheme(t.id)} className="flex shrink-0 flex-col items-center gap-1.5" aria-pressed={theme === t.id}>
                  <span className={`grid size-12 place-items-center rounded-full ring-offset-2 ring-offset-paper ${theme === t.id ? "ring-2 ring-ink" : "ring-1 ring-ink/15"}`} style={{ background: t.bg }}>
                    <span className="size-5 rounded-full" style={{ background: t.blob }} />
                  </span>
                  <span className={`text-[11px] ${theme === t.id ? "font-bold" : "text-ink-mute"}`}>{t.label}</span>
                </button>
              ))}
            </div>
            <button onClick={share} disabled={sharing} className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 font-semibold text-paper">
              {sharing ? <Loader2 size={18} className="animate-spin" /> : navigator.canShare ? <Share2 size={18} /> : <Download size={18} />}
              {navigator.canShare ? "Compartilhar" : "Baixar imagem"}
            </button>
          </div>
        )}
        {viewing && !shareMode && (
          <div className="px-5 pb-6">
            <img src={viewing.preview} alt={viewing.name} className="mx-auto aspect-[3/4] w-full max-w-xs rounded-[24px] object-cover ring-1 ring-line" />
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
                <button onClick={() => setShareMode(true)} className="flex items-center justify-center gap-2 rounded-full bg-ink py-3.5 font-semibold text-paper">
                  <Share2 size={18} /> Compartilhar imagem
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
