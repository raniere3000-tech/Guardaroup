import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Undo2, Eraser, Paintbrush, Eye, EyeOff, Loader2 } from "lucide-react";
import { loadImage } from "../lib/image";

/**
 * Pincel para ajustar o recorte:
 * - Restaurar: devolve partes da foto que o recorte apagou (ex.: listras brancas)
 * - Apagar: tira restos de fundo
 * Um dedo pinta; dois dedos dão zoom e movem a imagem.
 */
export default function CutoutEditor({ original, cut, onDone, onCancel }) {
  const canvasRef = useRef(null);
  const origRef = useRef(null);
  const history = useRef([]);
  const pointers = useRef(new Map());
  const stroke = useRef(null); // { last: {x,y}, snapshot }
  const pinch = useRef(null);

  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState("restore");
  const [size, setSize] = useState(22); // raio em px da tela
  const [showPhoto, setShowPhoto] = useState(true);
  const [view, setView] = useState({ s: 1, x: 0, y: 0 });
  const [cursor, setCursor] = useState(null);
  const [canUndo, setCanUndo] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [o, c] = await Promise.all([loadImage(original), loadImage(cut)]);
      origRef.current = o;
      const cv = canvasRef.current;
      cv.width = c.naturalWidth;
      cv.height = c.naturalHeight;
      cv.getContext("2d", { willReadFrequently: true }).drawImage(c, 0, 0);
      setReady(true);
    })();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [original, cut]);

  const toCanvas = (clientX, clientY) => {
    const cv = canvasRef.current;
    const r = cv.getBoundingClientRect();
    return { x: ((clientX - r.left) / r.width) * cv.width, y: ((clientY - r.top) / r.height) * cv.height, k: cv.width / r.width };
  };

  const paint = (from, to) => {
    const cv = canvasRef.current;
    const ctx = cv.getContext("2d");
    const r = size * to.k;
    const dist = Math.hypot(to.x - from.x, to.y - from.y);
    const steps = Math.max(1, Math.ceil(dist / (r / 3)));
    ctx.save();
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const x = from.x + ((to.x - from.x) * i) / steps;
      const y = from.y + ((to.y - from.y) * i) / steps;
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, Math.PI * 2);
    }
    if (mode === "erase") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.fill();
    } else {
      ctx.clip();
      ctx.drawImage(origRef.current, 0, 0, cv.width, cv.height);
    }
    ctx.restore();
  };

  const snapshot = () => canvasRef.current.getContext("2d", { willReadFrequently: true }).getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);

  const onDown = (e) => {
    if (!ready) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      // virou gesto de zoom: desfaz o traço que começou
      if (stroke.current) {
        canvasRef.current.getContext("2d").putImageData(stroke.current.snapshot, 0, 0);
        stroke.current = null;
      }
      const [a, b] = [...pointers.current.values()];
      pinch.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), mid: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }, view };
      setCursor(null);
      return;
    }
    const p = toCanvas(e.clientX, e.clientY);
    stroke.current = { last: p, snapshot: snapshot() };
    paint(p, p);
    setCursor({ x: e.clientX, y: e.clientY });
  };

  const onMove = (e) => {
    if (!pointers.current.has(e.pointerId)) {
      if (e.pointerType === "mouse") setCursor({ x: e.clientX, y: e.clientY });
      return;
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current && pointers.current.size >= 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const p = pinch.current;
      const s = Math.min(6, Math.max(1, p.view.s * (dist / p.dist)));
      setView({ s, x: p.view.x + (mid.x - p.mid.x), y: p.view.y + (mid.y - p.mid.y) });
      return;
    }
    if (stroke.current) {
      const p = toCanvas(e.clientX, e.clientY);
      paint(stroke.current.last, p);
      stroke.current.last = p;
      setCursor({ x: e.clientX, y: e.clientY });
    }
  };

  const onUp = (e) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (stroke.current && pointers.current.size === 0) {
      history.current = [...history.current, stroke.current.snapshot].slice(-8);
      setCanUndo(true);
      stroke.current = null;
    }
    if (e.pointerType !== "mouse") setCursor(null);
  };

  const undo = () => {
    const last = history.current.pop();
    if (last) canvasRef.current.getContext("2d").putImageData(last, 0, 0);
    setCanUndo(history.current.length > 0);
  };

  const done = () => {
    setSaving(true);
    onDone(canvasRef.current.toDataURL("image/png"));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[80] flex flex-col bg-paper pt-safe pb-safe">
      <header className="flex items-center justify-between px-3 py-2">
        <button onClick={onCancel} className="rounded-full px-4 py-2.5 font-semibold text-ink-soft">Cancelar</button>
        <h2 className="font-display text-lg font-semibold">Ajustar recorte</h2>
        <button onClick={done} disabled={saving || !ready} className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 font-semibold text-paper">
          {saving && <Loader2 size={16} className="animate-spin" />} Pronto
        </button>
      </header>

      <div className="relative flex-1 overflow-hidden">
        <div className="absolute inset-0 grid place-items-center p-4">
          <div
            className="relative max-h-full max-w-full touch-none select-none"
            style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})`, transformOrigin: "center" }}
          >
            <div className="checker absolute inset-0 rounded-lg" />
            {showPhoto && <img src={original} alt="" className="pointer-events-none absolute inset-0 h-full w-full rounded-lg opacity-30" />}
            <canvas
              ref={canvasRef}
              className="relative block max-h-[calc(100dvh-260px)] max-w-[calc(100vw-32px)] touch-none"
              style={{ width: "auto", height: "auto" }}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerCancel={onUp}
              onPointerLeave={(e) => { if (e.pointerType === "mouse") setCursor(null); }}
            />
          </div>
        </div>
        {!ready && <div className="absolute inset-0 grid place-items-center"><Loader2 className="animate-spin" /></div>}
        {cursor && (
          <span
            className={`pointer-events-none fixed rounded-full border-2 ${mode === "erase" ? "border-red-500 bg-red-500/15" : "border-ink bg-white/30"}`}
            style={{ left: cursor.x - size * view.s, top: cursor.y - size * view.s, width: size * 2 * view.s, height: size * 2 * view.s }}
          />
        )}
      </div>

      <div className="space-y-3 border-t border-line bg-paper px-4 pt-3 pb-4">
        <p className="text-center text-xs text-ink-mute">Pinte com um dedo · use dois dedos para dar zoom</p>
        <div className="grid grid-cols-2 gap-1 rounded-full bg-white p-1 ring-1 ring-line">
          {[["restore", "Restaurar", Paintbrush], ["erase", "Apagar", Eraser]].map(([id, label, Icon]) => (
            <button key={id} onClick={() => setMode(id)} className={`relative rounded-full py-2.5 text-sm font-semibold ${mode === id ? "text-paper" : "text-ink-soft"}`}>
              {mode === id && <motion.span layoutId="brushmode" className="absolute inset-0 rounded-full bg-ink" />}
              <span className="relative flex items-center justify-center gap-1.5"><Icon size={16} /> {label}</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <span className="size-2 rounded-full bg-ink" />
          <input type="range" min="6" max="60" value={size} onChange={(e) => setSize(+e.target.value)} className="flex-1 accent-ink" aria-label="Tamanho do pincel" />
          <span className="size-5 rounded-full bg-ink" />
          <button onClick={() => setShowPhoto(!showPhoto)} aria-label={showPhoto ? "Esconder foto original" : "Mostrar foto original"} className="grid size-10 place-items-center rounded-full bg-white ring-1 ring-line">
            {showPhoto ? <Eye size={18} /> : <EyeOff size={18} />}
          </button>
          <button onClick={undo} disabled={!canUndo} aria-label="Desfazer" className="grid size-10 place-items-center rounded-full bg-white ring-1 ring-line disabled:opacity-40">
            <Undo2 size={18} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
