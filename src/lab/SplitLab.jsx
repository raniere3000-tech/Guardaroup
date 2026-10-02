import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Camera, Image as ImageIcon, Copy, RefreshCw } from "lucide-react";
import { splitOutfit } from "../lib/segment";
import { colorById } from "../lib/constants";
import { HangerWait, CardsWait } from "../components/WaitAnimations";
import ColorDot from "../components/ColorDot";
import { useToast } from "../components/Toast";

export default function SplitLab() {
  const toast = useToast();
  const cam = useRef();
  const gal = useRef();
  const [state, setState] = useState({ step: "idle" });

  const run = async (file) => {
    if (!file) return;
    const photo = URL.createObjectURL(file);
    const t0 = performance.now();
    let downloaded = false;
    setState({ step: "download", photo, progress: 0 });
    try {
      const res = await splitOutfit(file, {
        onProgress: (p) => {
          downloaded = true;
          setState((s) => (s.step === "download" ? { ...s, progress: p } : s));
        },
      });
      const total = performance.now() - t0;
      setState({ step: "done", photo, ...res, total, downloaded });
    } catch (e) {
      console.error(e);
      const raw = String(e?.message || e);
      const message = /fetch|network|load/i.test(raw) ? "Não consegui baixar o separador. Confere a internet (de preferência Wi-Fi) e tenta de novo." : raw;
      setState({ step: "error", photo, message });
    }
  };

  // depois do download, a tela muda para a animação de "cartas"
  const analyzing = state.step === "download" && state.progress >= 1;

  const copy = async () => {
    const lines = [
      "Vestí · teste do separador",
      `Aparelho: ${navigator.userAgent.match(/\(([^)]+)\)/)?.[1] || "?"}`,
      `Tempo total: ${(state.total / 1000).toFixed(1)} s ${state.downloaded ? "(com download do modelo)" : "(modelo já salvo)"}`,
      `Análise da foto: ${(state.ms / 1000).toFixed(1)} s`,
      `Peças: ${state.pieces.map((p) => `${p.label} (${colorById(p.color)?.label || "?"})`).join(", ") || "nenhuma"}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(lines);
      toast("Copiado! Cola no chat 😉");
    } catch {
      toast("Não deu pra copiar", "error");
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 pb-10">
      <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { run(e.target.files?.[0]); e.target.value = ""; }} />
      <input ref={gal} type="file" accept="image/*" hidden onChange={(e) => { run(e.target.files?.[0]); e.target.value = ""; }} />

      {state.step === "idle" && (
        <>
          <p className="text-ink-soft">Tire ou escolha uma foto <b>de corpo inteiro</b>, de pé, com boa luz. O app tenta achar cada peça sozinho.</p>
          <p className="mt-2 text-sm text-ink-mute">Na 1ª vez ele baixa o separador (cerca de 29 MB). Melhor no Wi-Fi.</p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button onClick={() => cam.current.click()} className="flex flex-col items-center gap-2 rounded-2xl bg-ink py-5 font-semibold text-paper"><Camera size={26} /> Tirar foto</button>
            <button onClick={() => gal.current.click()} className="flex flex-col items-center gap-2 rounded-2xl bg-white py-5 font-semibold ring-1 ring-line"><ImageIcon size={26} /> Da galeria</button>
          </div>
        </>
      )}

      {state.step === "download" && (
        <div className="py-10">{analyzing || state.progress === 0 ? <CardsWait photo={state.photo} /> : <HangerWait progress={state.progress} phrases={["Baixando o separador…", "Preparando a mágica…", "Só na primeira vez, prometo"]} />}</div>
      )}

      {state.step === "error" && (
        <div className="rounded-2xl bg-red-50 p-4">
          <p className="font-semibold">Não deu certo</p>
          <p className="mt-1 break-words text-sm text-ink-soft">{state.message}</p>
          <button onClick={() => setState({ step: "idle" })} className="mt-3 rounded-full bg-ink px-4 py-2.5 text-sm font-semibold text-paper">Tentar de novo</button>
        </div>
      )}

      {state.step === "done" && (
        <>
          <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white p-3 text-center ring-1 ring-line">
            <Stat label="peças" value={state.pieces.length} />
            <Stat label="análise" value={`${(state.ms / 1000).toFixed(1)} s`} />
            <Stat label={state.downloaded ? "total c/ download" : "total"} value={`${(state.total / 1000).toFixed(1)} s`} />
          </div>
          {state.pieces.length === 0 && <p className="mt-6 text-center text-ink-soft">Não achei nenhuma peça. Tenta uma foto de corpo inteiro, com a pessoa de pé e o fundo mais limpo.</p>}
          <div className="mt-4 grid grid-cols-2 gap-3">
            {state.pieces.map((p, i) => (
              <motion.div key={p.group} initial={{ opacity: 0, y: 16, rotate: i % 2 ? 3 : -3 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ delay: i * 0.12 }} className="rounded-3xl bg-white p-2 ring-1 ring-line">
                <div className="checker aspect-square overflow-hidden rounded-[18px]"><img src={p.image} alt={p.label} className="h-full w-full object-contain p-2" /></div>
                <div className="flex items-center gap-1.5 px-1.5 pt-2">
                  <span className="text-sm font-semibold">{p.label}</span>
                  <span className="ml-auto flex items-center gap-1 text-xs text-ink-mute"><ColorDot color={p.color} size={12} /> {colorById(p.color)?.label}</span>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <button onClick={copy} className="flex items-center justify-center gap-2 rounded-full bg-ink py-3.5 font-semibold text-paper"><Copy size={17} /> Copiar resultado</button>
            <button onClick={() => setState({ step: "idle" })} className="flex items-center justify-center gap-2 rounded-full bg-white py-3.5 font-semibold ring-1 ring-line"><RefreshCw size={17} /> Outra foto</button>
          </div>
          <img src={state.photo} alt="Foto original" className="mx-auto mt-6 max-h-64 rounded-2xl ring-1 ring-line" />
        </>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <p className="font-display text-2xl font-semibold">{value}</p>
      <p className="text-[11px] text-ink-mute">{label}</p>
    </div>
  );
}
