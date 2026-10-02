import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Image as ImageIcon, RefreshCw, ChevronDown, Wand2, Loader2, Trash2, Paintbrush } from "lucide-react";
import { CATEGORIES, COLORS, OCCASIONS, SEASONS } from "../lib/constants";
import { prepareInput, removeBackground, finalizeImage, fillSmallHoles, toStoredDataUrl } from "../lib/image";
import CutoutEditor from "./CutoutEditor";
import { useStore } from "../store/useStore";
import { useToast } from "./Toast";

function Section({ title, hint, children }) {
  return (
    <section className="mt-7">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[15px] font-bold">{title}</h2>
        {hint && <span className="text-xs text-ink-mute">{hint}</span>}
      </div>
      {children}
    </section>
  );
}

function Chip({ active, children, ...props }) {
  return (
    <button type="button" {...props} className={`rounded-full px-4 py-2.5 text-sm font-semibold transition active:scale-95 ${active ? "bg-ink text-paper" : "bg-white text-ink-soft ring-1 ring-line hover:ring-ink/30"}`}>
      {children}
    </button>
  );
}

export default function UploadForm({ initial, onSave, onDelete }) {
  const { bump } = useStore();
  const toast = useToast();
  const cameraRef = useRef();
  const galleryRef = useRef();

  // original = foto inteira; cut = recorte sem fundo (mesmo tamanho da original)
  const [src, setSrc] = useState(() =>
    initial ? { original: initial.original || initial.image, cut: initial.cut || null } : null
  );
  const [useClean, setUseClean] = useState(Boolean(initial?.cut) && initial?.bg !== "kept");
  const [cleanPreview, setCleanPreview] = useState(initial?.cut ? initial.image : null);
  const [editing, setEditing] = useState(false);
  const [processing, setProcessing] = useState(null); // { preview, stage, pct }
  const [category, setCategory] = useState(initial?.category || "");
  const [color, setColor] = useState(initial?.color || "");
  const [name, setName] = useState(initial?.name || "");
  const [occasions, setOccasions] = useState(initial?.occasions || []);
  const [season, setSeason] = useState(initial?.season || "");
  const [moreOpen, setMoreOpen] = useState(Boolean(initial?.name || initial?.occasions?.length || initial?.season));
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false); // imagem mudou nesta edição

  // prévia recortada (sem sobras) sempre que o recorte muda
  useEffect(() => {
    if (!src?.cut || !dirty) return;
    let alive = true;
    finalizeImage(src.cut, { trim: true }).then((r) => alive && setCleanPreview(r.dataUrl));
    return () => { alive = false; };
  }, [src?.cut, dirty]);

  const cutFrom = async (input, original) => {
    if (typeof input === "string") input = await (await fetch(input)).blob();
    const raw = await removeBackground(input, (p) => setProcessing((s) => s && { ...s, ...p }));
    const rawUrl = await toStoredDataUrl(raw);
    return toStoredDataUrl(await fillSmallHoles(rawUrl, original));
  };

  const handleFile = async (file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setProcessing({ preview, stage: "prepare", pct: 0 });
    try {
      const input = await prepareInput(file);
      const original = await toStoredDataUrl(input);
      let cut = null;
      try {
        cut = await cutFrom(input, original);
      } catch (err) {
        console.error(err);
        toast("Não deu pra tirar o fundo. Vou usar a foto original.", "error");
      }
      setSrc({ original, cut });
      setUseClean(Boolean(cut));
      setDirty(true);
    } catch (err) {
      console.error(err);
      toast("Não consegui abrir essa foto. Tenta outra?", "error");
    } finally {
      URL.revokeObjectURL(preview);
      setProcessing(null);
    }
  };

  // peça já salva com fundo: tirar o fundo agora
  const removeNow = async () => {
    setProcessing({ preview: src.original, stage: "prepare", pct: 0, keep: true });
    try {
      const cut = await cutFrom(src.original, src.original);
      setSrc((s) => ({ ...s, cut }));
      setUseClean(true);
      setDirty(true);
    } catch (err) {
      console.error(err);
      toast("Não deu pra tirar o fundo agora. Tenta de novo?", "error");
    } finally {
      setProcessing(null);
    }
  };

  const currentImage = src ? (useClean && src.cut ? cleanPreview : src.original) : null;
  const canSave = currentImage && category && color && !processing && !saving;

  const submit = async () => {
    if (!canSave) return;
    setSaving(true);
    const clean = useClean && src.cut;
    if (dirty && !initial) bump(clean ? "bgRemoved" : "bgKept");
    await onSave({
      image: clean ? cleanPreview : src.original,
      original: src.original,
      cut: src.cut,
      bg: clean ? "removed" : "kept",
      category, color, name: name.trim(), occasions, season,
    });
    setSaving(false);
  };

  const toggleOccasion = (o) => setOccasions((list) => (list.includes(o) ? list.filter((x) => x !== o) : [...list, o]));

  const stageText = processing && {
    prepare: "Preparando a foto…",
    download: `Baixando o recortador (só na 1ª vez)… ${Math.round((processing.pct || 0) * 100)}%`,
    process: "Tirando o fundo…",
  }[processing.stage];

  return (
    <div className="mx-auto max-w-3xl px-5 pb-40">
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={galleryRef} type="file" accept="image/*" hidden onChange={(e) => { handleFile(e.target.files?.[0]); e.target.value = ""; }} />

      {/* FOTO */}
      <div className="md:grid md:grid-cols-2 md:gap-8">
        <div>
          <AnimatePresence mode="wait">
            {processing ? (
              <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-cream">
                <img src={processing.preview} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40 blur-[2px]" />
                <motion.div className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-paper/70 to-transparent" animate={{ y: ["-30%", "430%"] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }} />
                <div className="absolute inset-x-4 bottom-4 flex items-center gap-3 rounded-2xl bg-paper/95 p-4 shadow-lg">
                  <Loader2 className="animate-spin shrink-0" size={22} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{stageText}</p>
                    {processing.stage === "download" && (
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-ink transition-all" style={{ width: `${(processing.pct || 0) * 100}%` }} /></div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : currentImage ? (
              <motion.div key="img" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <div className="checker relative aspect-[4/5] overflow-hidden rounded-[28px] ring-1 ring-line">
                  <motion.img key={currentImage.slice(-40)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} src={currentImage} alt="Prévia da peça" className="absolute inset-0 h-full w-full object-contain p-5" />
                  <button onClick={() => galleryRef.current.click()} className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-paper/95 px-3.5 py-2 text-sm font-semibold shadow">
                    <RefreshCw size={15} /> Trocar
                  </button>
                </div>
                {src?.cut && (
                  <div className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-white p-1 ring-1 ring-line">
                    {[[true, "Sem fundo"], [false, "Manter fundo"]].map(([v, label]) => (
                      <button key={label} onClick={() => setUseClean(v)} className={`relative rounded-full py-2 text-sm font-semibold ${useClean === v ? "text-paper" : "text-ink-soft"}`}>
                        {useClean === v && <motion.span layoutId="bgtoggle" className="absolute inset-0 rounded-full bg-ink" />}
                        <span className="relative flex items-center justify-center gap-1.5">{v && <Wand2 size={14} />}{label}</span>
                      </button>
                    ))}
                  </div>
                )}
                {src?.cut && useClean && (
                  <button onClick={() => setEditing(true)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-cream py-3 text-sm font-semibold">
                    <Paintbrush size={16} /> Ajustar recorte
                    <span className="font-normal text-ink-soft">· sumiu algum pedaço?</span>
                  </button>
                )}
                {src && !src.cut && (
                  <button onClick={removeNow} className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-cream py-3 text-sm font-semibold">
                    <Wand2 size={16} /> Tirar o fundo
                  </button>
                )}
              </motion.div>
            ) : (
              <motion.div key="pick" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="rounded-[28px] border-2 border-dashed border-beige bg-cream/50 p-5">
                <div className="flex flex-col items-center py-6 text-center">
                  <div className="grid size-16 place-items-center rounded-2xl bg-paper shadow-sm"><Wand2 size={28} /></div>
                  <p className="mt-4 font-display text-xl font-semibold">Adiciona a foto da peça</p>
                  <p className="mt-1 text-sm text-ink-soft">O fundo é removido automaticamente ✨</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => cameraRef.current.click()} className="flex flex-col items-center gap-2 rounded-2xl bg-ink py-5 font-semibold text-paper">
                    <Camera size={26} /> Tirar foto
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.96 }} onClick={() => galleryRef.current.click()} className="flex flex-col items-center gap-2 rounded-2xl bg-paper py-5 font-semibold ring-1 ring-line">
                    <ImageIcon size={26} /> Da galeria
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          {/* CATEGORIA */}
          <Section title="Que peça é essa?" hint="obrigatório">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <Chip key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>{c.label}</Chip>
              ))}
            </div>
          </Section>

          {/* COR */}
          <Section title="Cor principal" hint="obrigatório">
            <div className="grid grid-cols-5 gap-3 sm:grid-cols-8">
              {COLORS.map((c) => {
                const active = color === c.id;
                return (
                  <button key={c.id} type="button" onClick={() => setColor(c.id)} className="flex flex-col items-center gap-1.5" aria-pressed={active} aria-label={c.label}>
                    <motion.span animate={{ scale: active ? 1.08 : 1 }} className={`grid size-11 place-items-center rounded-full ring-offset-2 ring-offset-paper transition ${active ? "ring-2 ring-ink" : "ring-1 ring-ink/15"}`} style={{ background: c.hex }}>
                      {active && <span className={`size-2.5 rounded-full ${["branco", "amarelo", "bege", "rosa", "cinza"].includes(c.id) ? "bg-ink" : "bg-paper"}`} />}
                    </motion.span>
                    <span className={`text-[11px] leading-tight text-center ${active ? "font-bold" : "text-ink-mute"}`}>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          {/* EXTRAS */}
          <button type="button" onClick={() => setMoreOpen(!moreOpen)} className="mt-7 flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3.5 ring-1 ring-line">
            <span className="font-semibold">Mais detalhes <span className="font-normal text-ink-mute">(opcional)</span></span>
            <ChevronDown size={20} className={`transition-transform ${moreOpen ? "rotate-180" : ""}`} />
          </button>
          <AnimatePresence initial={false}>
            {moreOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <Section title="Apelido da peça">
                  <input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Ex.: Jaqueta jeans da sorte" className="w-full rounded-2xl bg-white px-4 py-3.5 ring-1 ring-line outline-none placeholder:text-ink-mute focus:ring-2 focus:ring-ink" />
                </Section>
                <Section title="Combina com" hint="pode marcar várias">
                  <div className="flex flex-wrap gap-2">
                    {OCCASIONS.map((o) => <Chip key={o} active={occasions.includes(o)} onClick={() => toggleOccasion(o)}>{o}</Chip>)}
                  </div>
                </Section>
                <Section title="Clima">
                  <div className="flex flex-wrap gap-2">
                    {SEASONS.map((s) => <Chip key={s} active={season === s} onClick={() => setSeason(season === s ? "" : s)}>{s}</Chip>)}
                  </div>
                </Section>
              </motion.div>
            )}
          </AnimatePresence>

          {onDelete && (
            <button type="button" onClick={onDelete} className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50">
              <Trash2 size={18} /> Excluir peça
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {editing && src?.cut && (
          <CutoutEditor
            original={src.original}
            cut={src.cut}
            onCancel={() => setEditing(false)}
            onDone={async (edited) => {
              const cut = await toStoredDataUrl(edited);
              setSrc((s) => ({ ...s, cut }));
              setDirty(true);
              setEditing(false);
              toast("Recorte ajustado!");
            }}
          />
        )}
      </AnimatePresence>

      {/* SALVAR */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 bg-gradient-to-t from-paper via-paper to-paper/0 px-5 pt-8 pb-5 pb-safe [&>*]:pointer-events-auto">
        <motion.button
          whileTap={canSave ? { scale: 0.97 } : {}}
          onClick={submit}
          disabled={!canSave}
          className="mx-auto mb-2 flex w-full max-w-md items-center justify-center gap-2 rounded-full bg-ink py-4 text-lg font-semibold text-paper shadow-xl shadow-ink/15 transition disabled:bg-ink/25 disabled:shadow-none"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : null}
          {initial ? "Salvar alterações" : "Salvar no closet"}
        </motion.button>
        {!canSave && !processing && (
          <p className="text-center text-xs text-ink-mute">
            {!currentImage ? "Falta a foto" : !category ? "Falta escolher o tipo de peça" : !color ? "Falta escolher a cor" : ""}
          </p>
        )}
      </div>
    </div>
  );
}
