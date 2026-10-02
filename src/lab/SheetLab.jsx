import { useState } from "react";
import Sheet from "../components/Sheet";
import { SAMPLES } from "./samples";

const CHECKS = [
  "Segurar a alça e puxar devagar: o painel acompanha o dedo",
  "Soltar no meio do caminho: ele volta para cima",
  "Puxar rápido ou até a metade: ele fecha",
  "Puxar pela foto (com o painel no topo): fecha também",
  "No painel comprido, rolar a lista não fecha o painel",
  "Botão X, tocar fora e o voltar do celular fecham",
];

export default function SheetLab() {
  const [open, setOpen] = useState(null);
  const [done, setDone] = useState({});
  return (
    <div className="mx-auto max-w-md px-4 pb-10">
      <div className="grid grid-cols-2 gap-2">
        <button onClick={() => setOpen("short")} className="rounded-2xl bg-ink py-4 font-semibold text-paper">Painel curto</button>
        <button onClick={() => setOpen("long")} className="rounded-2xl bg-white py-4 font-semibold ring-1 ring-line">Painel comprido</button>
      </div>
      <h2 className="mt-6 mb-2 font-semibold">Confira no seu celular</h2>
      <ul className="space-y-2">
        {CHECKS.map((c, i) => (
          <li key={c}>
            <button onClick={() => setDone((d) => ({ ...d, [i]: !d[i] }))} className="flex w-full items-start gap-3 rounded-2xl bg-white p-3 text-left text-sm ring-1 ring-line">
              <span className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md border-2 ${done[i] ? "border-ink bg-ink text-paper" : "border-ink/30"}`}>{done[i] ? "✓" : ""}</span>
              {c}
            </button>
          </li>
        ))}
      </ul>

      <Sheet open={open === "short"} onClose={() => setOpen(null)} label="Painel curto">
        <div className="px-5 pb-6">
          <div className="checker aspect-square overflow-hidden rounded-[24px] ring-1 ring-line"><img src={SAMPLES[1].image} alt="" className="h-full w-full object-contain p-8" /></div>
          <h2 className="mt-4 font-display text-2xl font-semibold">Blusa listrada</h2>
          <p className="text-ink-soft">Puxe esta tela para baixo pela foto ou pela alça.</p>
        </div>
      </Sheet>

      <Sheet open={open === "long"} onClose={() => setOpen(null)} label="Painel comprido">
        <div className="px-5 pb-6">
          <h2 className="font-display text-2xl font-semibold">Lista comprida</h2>
          <p className="mb-3 text-ink-soft">Role para baixo e para cima. Só fecha puxando quando a lista está no topo.</p>
          {Array.from({ length: 24 }, (_, i) => (
            <div key={i} className="mb-2 rounded-2xl bg-white px-4 py-3 ring-1 ring-line">Item {i + 1}</div>
          ))}
        </div>
      </Sheet>
    </div>
  );
}
