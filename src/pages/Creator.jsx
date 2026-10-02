import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Shuffle, Plus, Check, RotateCcw, Loader2, Trash2 } from "lucide-react";
import { useStore } from "../store/useStore";
import { useToast } from "../components/Toast";
import PageHeader from "../components/PageHeader";
import OutfitCanvas, { BOARD_RATIO } from "../components/OutfitCanvas";
import Sheet from "../components/Sheet";
import EmptyState from "../components/EmptyState";
import TipPopup from "../components/TipPopup";
import ClothingCard from "../components/ClothingCard";
import { CATEGORIES, SLOTS, SLOT_LAYOUT, categoryById } from "../lib/constants";
import { loadImage, renderLook } from "../lib/image";
import { suggestLook, mainKey } from "../lib/suggest";
import { useFitWidth } from "../lib/useFitWidth";

const aspectCache = new Map();
async function aspectOf(cloth) {
  if (aspectCache.has(cloth.id)) return aspectCache.get(cloth.id);
  const img = await loadImage(cloth.image);
  const a = img.naturalWidth / img.naturalHeight;
  aspectCache.set(cloth.id, a);
  return a;
}

/** Encaixa a peça no espaço padrão do slot, mantendo a proporção da foto. */
function fitToSlot(slot, aspect) {
  const s = SLOT_LAYOUT[slot];
  const sw = s.w, sh = s.h * BOARD_RATIO; // em unidades da largura
  let bw, bh;
  if (sw / sh > aspect) { bh = sh; bw = bh * aspect; } else { bw = sw; bh = bw / aspect; }
  return { x: s.x + (sw - bw) / 2, y: s.y + (sh - bh) / BOARD_RATIO / 2, w: bw, h: bh / BOARD_RATIO, z: s.z };
}

const slotOf = (cloth) => categoryById(cloth?.category)?.slot;

export default function Creator() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { clothes, clothesById, outfits, saveOutfit, lookCategories, addLookCategory, bump } = useStore();
  const navigate = useNavigate();
  const toast = useToast();
  const editing = id ? outfits.find((o) => o.id === id) : null;

  const [items, setItems] = useState(() => (editing ? editing.items.filter((i) => clothesById[i.clothId]) : []));
  const [selected, setSelected] = useState(null);
  const [picker, setPicker] = useState(null); // slot id
  const [saveOpen, setSaveOpen] = useState(false);
  const [name, setName] = useState(editing?.name || "");
  const [lookCat, setLookCat] = useState(editing?.category || "");
  const [newCat, setNewCat] = useState("");
  const [saving, setSaving] = useState(false);
  const boardRef = useRef();
  const [fitRef, fitW] = useFitWidth(BOARD_RATIO);
  const recent = useRef([]);
  const [shuffleKey, setShuffleKey] = useState(0);

  const bySlot = useMemo(() => {
    const m = {};
    for (const c of clothes) (m[slotOf(c)] ||= []).push(c);
    return m;
  }, [clothes]);

  const placeCloth = useCallback(async (cloth, current) => {
    const slot = slotOf(cloth);
    const aspect = await aspectOf(cloth);
    const base = { slot, clothId: cloth.id, ...fitToSlot(slot, aspect) };
    let next = current.filter((i) => i.slot !== slot);
    if (slot === "full") next = next.filter((i) => i.slot !== "top" && i.slot !== "bottom");
    if (slot === "top" || slot === "bottom") next = next.filter((i) => i.slot !== "full");
    return [...next, base];
  }, []);

  // vindo de "Criar look com ela"
  useEffect(() => {
    const withId = params.get("com");
    const cloth = withId && clothesById[withId];
    if (cloth && !editing) placeCloth(cloth, []).then(setItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = async (cloth) => {
    setItems(await placeCloth(cloth, items));
    setSelected(slotOf(cloth));
    setPicker(null);
  };

  const removeSlot = (slot) => {
    setItems((list) => list.filter((i) => i.slot !== slot));
    setSelected(null);
  };

  const select = (slot) => {
    setSelected(slot);
    if (!slot) return;
    setItems((list) => {
      const max = Math.max(...list.map((i) => i.z));
      return list.map((i) => (i.slot === slot && i.z < max ? { ...i, z: max + 1 } : i));
    });
  };

  const change = (slot, patch) => setItems((list) => list.map((i) => (i.slot === slot ? { ...i, ...patch } : i)));

  const randomize = async () => {
    const current = items.map((i) => clothesById[i.clothId]).filter(Boolean);
    const avoid = [mainKey(current), ...recent.current];
    const { pieces, isNew } = suggestLook(clothes, { avoid });
    if (!isNew) {
      // já mostrou todas as combinações: recomeça o ciclo, sem repetir a atual
      recent.current = [];
      const again = suggestLook(clothes, { avoid: [mainKey(current)] });
      if (!again.isNew) {
        toast("Cadastre mais peças pra ter novas combinações 👀");
        return;
      }
      pieces.splice(0, pieces.length, ...again.pieces);
    }
    recent.current = [mainKey(pieces), ...recent.current].slice(0, 30);
    let next = [];
    for (const c of pieces) next = await placeCloth(c, next);
    setItems(next);
    setSelected(null);
    setShuffleKey((k) => k + 1);
    bump("randomUses");
  };

  const doSave = async () => {
    setSaving(true);
    try {
      let category = lookCat;
      if (newCat.trim()) {
        addLookCategory(newCat);
        category = newCat.trim();
      }
      const preview = await renderLook(items, clothesById, { width: 600, type: "dataUrl" });
      const saved = saveOutfit({ id: editing?.id, name: name.trim() || "Look sem nome", category, items, preview, previewV: 2 });
      toast(editing ? "Look atualizado!" : "Look salvo! 💾");
      navigate(`/looks?ver=${saved.id}`, { replace: true });
    } catch (e) {
      console.error(e);
      toast("Não consegui salvar. Tenta de novo?", "error");
    } finally {
      setSaving(false);
    }
  };

  if (id && !editing) return <><PageHeader title="Editar look" back /><EmptyState title="Look não encontrado" /></>;

  if (clothes.length === 0) {
    return (
      <div className="pb-32">
        <PageHeader title="Criar look" />
        <EmptyState
          title="Adicione sua primeira peça"
          text="Pra montar um look, primeiro cadastra umas roupas: uma parte de cima, uma de baixo e um calçado já resolvem."
          action={<button onClick={() => navigate("/adicionar")} className="flex items-center gap-2 rounded-full bg-ink px-6 py-3.5 font-semibold text-paper"><Plus size={20} /> Adicionar roupa</button>}
        />
      </div>
    );
  }

  const hasFull = items.some((i) => i.slot === "full");
  const pickerSlot = SLOTS.find((s) => s.id === picker);
  const pickerList = picker ? clothes.filter((c) => slotOf(c) === picker) : [];
  const pickerCats = pickerSlot ? CATEGORIES.filter((c) => c.slot === picker).map((c) => c.label.toLowerCase()).join(", ") : "";

  return (
    // altura da tela menos a barra de navegação: o quadro se ajusta ao espaço que sobra
    <div className="flex flex-col" style={{ height: "calc(100dvh - 68px - env(safe-area-inset-bottom))" }}>
      <PageHeader
        title={editing ? "Editar look" : "Criar look"}
        back={Boolean(editing)}
        right={
          <div className="flex gap-2">
            {items.length > 0 && (
              <button onClick={() => { setItems([]); setSelected(null); }} aria-label="Limpar quadro" className="grid size-10 place-items-center rounded-full bg-white ring-1 ring-line"><RotateCcw size={18} /></button>
            )}
            <motion.button whileTap={{ scale: 0.92, rotate: -20 }} onClick={randomize} className="flex items-center gap-1.5 rounded-full bg-cream px-4 py-2.5 text-sm font-semibold">
              <Shuffle size={17} /> Sortear
            </motion.button>
          </div>
        }
      />

      <div ref={fitRef} className="min-h-0 flex-1 px-4">
        <div className="mx-auto" style={{ width: fitW || "100%" }}>
          <OutfitCanvas key={shuffleKey} items={items} clothesById={clothesById} selectedId={selected} onSelect={select} onChange={change} onRemove={removeSlot} boardRef={boardRef} />
        </div>
      </div>

      <div className="flex h-14 shrink-0 items-center justify-center px-4">
        {items.length === 0 ? (
          <p className="text-center text-sm text-ink-mute">Escolha as peças aqui embaixo ou toque em <b>Sortear</b> 🎲</p>
        ) : selected && items.some((i) => i.slot === selected) ? (
          <div className="flex justify-center gap-2">
            <button onClick={() => removeSlot(selected)} className="flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-red-600 ring-1 ring-line active:scale-95">
              <Trash2 size={16} /> Remover peça
            </button>
            <button onClick={() => setSelected(null)} className="rounded-full bg-white px-4 py-2 text-sm font-semibold ring-1 ring-line active:scale-95">
              Pronto
            </button>
          </div>
        ) : (
          <p className="text-center text-xs text-ink-mute">Arraste as peças. Toque numa e puxe a bolinha pra mudar o tamanho.</p>
        )}
      </div>

      {/* bandeja de espaços + salvar */}
      <div className="mx-auto w-full max-w-md shrink-0 px-4 pb-3">
        <div className="mb-3 grid grid-cols-5 gap-2">
          {SLOTS.map((s) => {
            const it = items.find((i) => i.slot === s.id);
            const cloth = it && clothesById[it.clothId];
            const disabled = !bySlot[s.id]?.length;
            const dim = (s.id === "full" && items.some((i) => i.slot === "top" || i.slot === "bottom")) || ((s.id === "top" || s.id === "bottom") && hasFull);
            return (
              <motion.button key={s.id} whileTap={{ scale: 0.94 }} onClick={() => setPicker(s.id)}
                className={`flex min-w-0 flex-col items-center gap-1 ${dim ? "opacity-50" : ""}`} aria-label={`Escolher ${s.label}`}>
                <span className={`checker grid aspect-square w-full max-w-[60px] place-items-center overflow-hidden rounded-2xl ring-2 ${cloth ? "ring-ink" : "ring-line"}`}>
                  {cloth ? <img src={cloth.image} alt="" className="h-full w-full object-contain p-1" /> : <Plus size={20} className={disabled ? "text-ink-mute/50" : "text-ink-mute"} />}
                </span>
                <span className="text-[11px] font-semibold text-ink-soft">{s.short}</span>
              </motion.button>
            );
          })}
        </div>
        <motion.button whileTap={items.length ? { scale: 0.97 } : {}} disabled={!items.length} onClick={() => setSaveOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-ink py-3.5 font-semibold text-paper shadow-lg shadow-ink/15 disabled:bg-ink/25 disabled:shadow-none">
          <Check size={19} strokeWidth={2.5} /> {editing ? "Salvar alterações" : "Salvar look"}
        </motion.button>
      </div>

      {/* escolher peça de um espaço */}
      <Sheet open={Boolean(picker)} onClose={() => setPicker(null)} label="Escolher peça">
        {pickerSlot && (
          <div className="px-5 pb-6">
            <h2 className="font-display text-2xl font-semibold">{pickerSlot.label}</h2>
            <p className="text-sm text-ink-mute">{pickerSlot.id === "full" ? "Vestido é peça única: ocupa cima e baixo." : pickerCats}</p>
            {pickerList.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-ink-soft">Você ainda não tem {pickerCats} no closet.</p>
                <button onClick={() => navigate("/adicionar")} className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 font-semibold text-paper"><Plus size={18} /> Adicionar</button>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-3 gap-2">
                {pickerList.map((c) => (
                  <ClothingCard key={c.id} item={c} compact selected={items.some((i) => i.clothId === c.id)} onClick={() => choose(c)} />
                ))}
              </div>
            )}
            {items.some((i) => i.slot === picker) && (
              <button onClick={() => { removeSlot(picker); setPicker(null); }} className="mt-4 w-full rounded-full py-3 font-semibold text-ink-soft ring-1 ring-line">Tirar do look</button>
            )}
          </div>
        )}
      </Sheet>

      {/* salvar */}
      <Sheet open={saveOpen} onClose={() => setSaveOpen(false)} label="Salvar look">
        <div className="px-5 pb-6">
          <h2 className="font-display text-2xl font-semibold">Dá um nome pro look</h2>
          <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Ex.: Sexta no barzinho"
            className="mt-4 w-full rounded-2xl bg-white px-4 py-3.5 ring-1 ring-line outline-none placeholder:text-ink-mute focus:ring-2 focus:ring-ink" />
          <h3 className="mt-6 mb-3 text-[15px] font-bold">Categoria <span className="font-normal text-ink-mute">(opcional)</span></h3>
          <div className="flex flex-wrap gap-2">
            {lookCategories.map((c) => (
              <button key={c} onClick={() => { setLookCat(lookCat === c ? "" : c); setNewCat(""); }}
                className={`rounded-full px-4 py-2.5 text-sm font-semibold ${lookCat === c && !newCat ? "bg-ink text-paper" : "bg-white text-ink-soft ring-1 ring-line"}`}>{c}</button>
            ))}
          </div>
          <input value={newCat} onChange={(e) => setNewCat(e.target.value)} maxLength={24} placeholder="+ Criar nova categoria"
            className="mt-3 w-full rounded-2xl bg-white px-4 py-3 text-sm ring-1 ring-line outline-none placeholder:text-ink-mute focus:ring-2 focus:ring-ink" />
          <motion.button whileTap={{ scale: 0.97 }} onClick={doSave} disabled={saving}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-ink py-4 text-lg font-semibold text-paper">
            {saving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />} Salvar
          </motion.button>
        </div>
      </Sheet>

      <TipPopup id="creator" />
    </div>
  );
}
