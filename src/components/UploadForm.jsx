import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Image as ImageIcon, RefreshCw, ChevronDown, Wand2, Loader2, Trash2 } from "lucide-react";
import { CATEGORIES, COLORS, OCCASIONS, SEASONS } from "../lib/constants";
import { prepareInput, removeBackground, finalizeImage } from "../lib/image";
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

  const [images, setImages] = useState(initial ? { clean: initial.image, original: null } : null);
  const [useClean, setUseClean] = useState(true);
  const [processing, setProcessing] = useState(null); // { preview, stage, pct }
  const [category, setCategory] = useState(initial?.category || "");
  const [color, setColor] = useState(initial?.color || "");
  const [name, setName] = useState(initial?.name || "");
  const [occasions, setOccasions] = useState(initial?.occasions || []);
  const [season, setSeason] = useState(initial?.season || "");
  const [moreOpen, setMoreOpen] = useState(Boolean(initial?.name || initial?.occasions?.length || initial?.season));
  const [saving, setSaving] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setProcessing({ preview, stage: "prepare", pct: 0 });
    try {
      const input = await prepareInput(file);
      const original = await finalizeImage(input, { trim: false });
      let clean = null;
      try {
        const cut = await removeBackground(input, (p) => setProcessing((s) => s && { ...s, ...p }));
        clean = await finalizeImage(cut, { trim: true });
      } catch (err) {
        console.error(err);
        toast("Não deu pra tirar o fundo. Vou usar a foto original.", "error");
      }
      setImages({ clean: clean?.dataUrl || null, original: original.dataUrl });
      setUseClean(Boolean(clean));
    } catch (err) {
      console.error(err);
      toast("Não consegui abrir essa foto. Tenta outra?", "error");
    } finally {
      URL.revokeObjectURL(preview);
      setProcessing(null);
    }
  };

  const currentImage = images ? (useClean && images.clean ? images.clean : images.original || images.clean) : null;
  const canSave = currentImage && category && color && !processing && !saving;

  const submit = async () => {
    if (!canSave) return;
    setSaving(true);
    if (images.original) bump(useClean && images.clean ? "bgRemoved" : "bgKept");
    await onSave({ image: currentImage, category, color, name: name.trim(), occasions, season });
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
                {images?.clean && images?.original && (
                  <div className="mt-3 grid grid-cols-2 gap-1 rounded-full bg-white p-1 ring-1 ring-line">
                    {[[true, "Sem fundo"], [false, "Manter fundo"]].map(([v, label]) => (
                      <button key={label} onClick={() => setUseClean(v)} className={`relative rounded-full py-2 text-sm font-semibold ${useClean === v ? "text-paper" : "text-ink-soft"}`}>
                        {useClean === v && <motion.span layoutId="bgtoggle" className="absolute inset-0 rounded-full bg-ink" />}
                        <span className="relative flex items-center justify-center gap-1.5">{v && <Wand2 size={14} />}{label}</span>
                      </button>
                    ))}
                  </div>
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
