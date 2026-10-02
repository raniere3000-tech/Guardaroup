import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { get } from "idb-keyval";
import { Plus, BringToFront, SendToBack, Trash2, RotateCcw } from "lucide-react";
import Board, { BOARD_RATIO } from "./Board";
import { SAMPLES } from "./samples";
import { SLOTS, SLOT_LAYOUT, categoryById } from "../lib/constants";
import { loadImage } from "../lib/image";

let seq = 0;
const uid = () => `p${Date.now().toString(36)}${seq++}`;

/** Posição inicial de uma peça no espaço padrão do slot. */
function placeInSlot(slot, aspect) {
  const L = SLOT_LAYOUT[slot];
  const bw = L.w, bh = L.h * BOARD_RATIO; // em unidades da largura
  const s = Math.min(bw, bh * aspect);
  return { x: L.x + L.w / 2, y: L.y + L.h / 2, s, r: 0, z: L.z };
}

/** Trocar de peça mantém posição, giro e o "tamanho visual". */
function swapSize(old, oldAspect, newAspect) {
  const oldH = old.s / oldAspect;
  return Math.min(old.s * 1.1, oldH * newAspect);
}

export default function BoardLab() {
  const [source, setSource] = useState("samples");
  const [mine, setMine] = useState([]);
  const [items, setItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [dir, setDir] = useState({});

  // peças do closet de verdade (mesmo aparelho, mesmo navegador)
  useEffect(() => {
    (async () => {
      const clothes = (await get("clothes").catch(() => null)) || [];
      const out = [];
      for (const c of clothes) {
        const slot = categoryById(c.category)?.slot;
        if (!slot) continue;
        try {
          const img = await loadImage(c.image);
          out.push({ id: c.id, slot, category: c.category, name: c.name || categoryById(c.category)?.label, image: c.image, aspect: img.naturalWidth / img.naturalHeight });
        } catch {}
      }
      setMine(out);
      if (out.length >= 3) setSource("mine");
    })();
  }, []);

  const pool = source === "mine" && mine.length ? mine : SAMPLES;
  const clothesById = useMemo(() => Object.fromEntries(pool.map((c) => [c.id, c])), [pool]);
  const bySlot = useMemo(() => {
    const m = {};
    for (const c of pool) (m[c.slot] ||= []).push(c);
    return m;
  }, [pool]);

  useEffect(() => {
    setItems([]);
    setSelected(null);
  }, [source]);

  const itemOfSlot = (slot) => items.find((i) => i.slot === slot);

  const put = (cloth) => {
    setItems((list) => {
      const cur = list.find((i) => i.slot === cloth.slot);
      let next = list.filter((i) => i.slot !== cloth.slot);
      if (cloth.slot === "full") next = next.filter((i) => i.slot !== "top" && i.slot !== "bottom");
      if (cloth.slot === "top" || cloth.slot === "bottom") next = next.filter((i) => i.slot !== "full");
      const base = cur
        ? { ...cur, clothId: cloth.id, s: swapSize(cur, clothesById[cur.clothId]?.aspect || 1, cloth.aspect) }
        : { id: uid(), slot: cloth.slot, clothId: cloth.id, ...placeInSlot(cloth.slot, cloth.aspect) };
      return [...next, base];
    });
  };

  const cycle = (slot, step) => {
    const list = bySlot[slot] || [];
    if (!list.length) return;
    const cur = itemOfSlot(slot);
    const idx = cur ? list.findIndex((c) => c.id === cur.clothId) : -1;
    const next = list.at((idx + step + list.length) % list.length);
    setDir((d) => ({ ...d, [slot]: step }));
    put(next);
  };

  const change = (id, patch) => setItems((list) => list.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  const remove = (id) => {
    setItems((list) => list.filter((i) => i.id !== id));
    setSelected(null);
  };
  const layer = (id, front) =>
    setItems((list) => {
      const zs = list.map((i) => i.z);
      return list.map((i) => (i.id === id ? { ...i, z: front ? Math.max(...zs) + 1 : Math.min(...zs) - 1 } : i));
    });

  const sel = items.find((i) => i.id === selected);

  return (
    <div className="mx-auto max-w-md px-4 pb-10">
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-full bg-white p-1 text-sm ring-1 ring-line">
        {[["samples", "Peças de exemplo"], ["mine", `Meu closet (${mine.length})`]].map(([id, label]) => (
          <button key={id} disabled={id === "mine" && !mine.length} onClick={() => setSource(id)}
            className={`rounded-full py-2 font-semibold disabled:opacity-40 ${source === id ? "bg-ink text-paper" : "text-ink-soft"}`}>
            {label}
          </button>
        ))}
      </div>

      <Board items={items} clothesById={clothesById} selectedId={selected} onSelect={setSelected} onChange={change} onRemove={remove} />

      {/* barra da peça selecionada */}
      <div className="mt-3 min-h-[52px]">
        <AnimatePresence mode="wait">
          {sel ? (
            <motion.div key="tools" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-4 gap-2">
              <ToolBtn label="Frente" onClick={() => layer(sel.id, true)}><BringToFront size={17} /></ToolBtn>
              <ToolBtn label="Trás" onClick={() => layer(sel.id, false)}><SendToBack size={17} /></ToolBtn>
              <ToolBtn label="Endireitar" onClick={() => change(sel.id, { r: 0 })}><RotateCcw size={17} /></ToolBtn>
              <ToolBtn label="Remover" danger onClick={() => remove(sel.id)}><Trash2 size={17} /></ToolBtn>
            </motion.div>
          ) : (
            <motion.p key="hint" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pt-3 text-center text-sm text-ink-mute">
              Toque numa peça · 1 dedo arrasta · 2 dedos aumentam e giram
            </motion.p>
          )}
        </AnimatePresence>
        {sel && (
          <p data-testid="readout" className="mt-1 text-center text-xs text-ink-mute">
            Tamanho {Math.round(sel.s * 100)}% · Giro {Math.round(sel.r)}° · Camada {sel.z}
          </p>
        )}
      </div>

      {/* bandeja: toque adiciona/seleciona, deslize troca a peça */}
      <div className="mt-2 grid grid-cols-5 gap-2">
        {SLOTS.map((s) => {
          const it = itemOfSlot(s.id);
          const cloth = it && clothesById[it.clothId];
          const count = bySlot[s.id]?.length || 0;
          return (
            <div key={s.id} className="flex flex-col items-center gap-1">
              <motion.button
                data-slot={s.id}
                drag={count > 1 || (!it && count) ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.5}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -30) cycle(s.id, 1);
                  else if (info.offset.x > 30) cycle(s.id, -1);
                }}
                onTap={() => (it ? setSelected(it.id) : count && cycle(s.id, 1))}
                aria-label={`${s.label}: ${cloth ? cloth.name : "vazio"}`}
                className={`checker relative grid aspect-square w-full place-items-center overflow-hidden rounded-2xl ring-2 ${cloth ? (it.id === selected ? "ring-ink" : "ring-ink/40") : "ring-line"} ${count ? "" : "opacity-40"}`}
              >
                <AnimatePresence initial={false} custom={dir[s.id] || 1} mode="popLayout">
                  {cloth ? (
                    <motion.img
                      key={cloth.id}
                      custom={dir[s.id] || 1}
                      variants={{ enter: (d) => ({ x: d * 40, opacity: 0 }), center: { x: 0, opacity: 1 }, exit: (d) => ({ x: -d * 40, opacity: 0 }) }}
                      initial="enter" animate="center" exit="exit"
                      src={cloth.image} alt="" draggable={false}
                      className="pointer-events-none h-full w-full object-contain p-1.5"
                    />
                  ) : (
                    <Plus size={18} className="text-ink-mute" />
                  )}
                </AnimatePresence>
                {count > 1 && <span className="absolute bottom-1 right-1.5 text-[10px] font-bold text-ink-mute">{count}</span>}
              </motion.button>
              <span className="text-[11px] font-semibold text-ink-soft">{s.short}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-center text-xs text-ink-mute">Deslize a miniatura para o lado para trocar a peça</p>
    </div>
  );
}

function ToolBtn({ children, label, danger, ...props }) {
  return (
    <button {...props} className={`flex flex-col items-center gap-0.5 rounded-2xl bg-white py-2 text-[11px] font-semibold ring-1 ring-line active:scale-95 ${danger ? "text-red-600" : ""}`}>
      {children}
      {label}
    </button>
  );
}
