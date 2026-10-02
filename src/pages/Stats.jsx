import { useStore } from "../store/useStore";
import { useToast } from "../components/Toast";
import PageHeader from "../components/PageHeader";
import { FEEDBACK_URL } from "../lib/constants";

/** Tela escondida (toque 5x no logo): números do teste para validar o MVP. */
export default function Stats() {
  const { stats, clothes, outfits, showWelcomeAgain, resetTips } = useStore();
  const toast = useToast();
  const daysSince = stats.firstOpen ? Math.max(1, Math.ceil((Date.now() - new Date(stats.firstOpen)) / 86400000)) : 1;
  const bgTotal = stats.bgRemoved + stats.bgKept;

  const rows = [
    ["Peças no closet agora", clothes.length],
    ["Peças cadastradas (total)", stats.clothesAdded],
    ["Looks salvos agora", outfits.length],
    ["Looks criados (total)", stats.looksCreated],
    ["Dias diferentes de uso", stats.days.length],
    ["Dias desde o 1º acesso", daysSince],
    ["Vezes que sorteou look", stats.randomUses],
    ["Looks compartilhados/baixados", stats.exports],
    ["Usou foto sem fundo", bgTotal ? `${Math.round((stats.bgRemoved / bgTotal) * 100)}%` : "—"],
  ];

  // apaga só o "cache" do app (as roupas ficam) e recarrega a versão mais nova
  const forceUpdate = async () => {
    try {
      const regs = (await navigator.serviceWorker?.getRegistrations?.()) || [];
      await Promise.all(regs.map((r) => r.unregister()));
      const keys = (await caches?.keys?.()) || [];
      await Promise.all(keys.filter((k) => !k.includes("bg-removal")).map((k) => caches.delete(k)));
    } catch {}
    location.reload();
  };

  const text = `Vestí — meus números\n${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}`;

  return (
    <div className="pb-32">
      <PageHeader title="Estatísticas" subtitle="Números do teste" back />
      <div className="mx-auto max-w-md px-5">
        <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-line">
          {rows.map(([k, v]) => (
            <div key={k} className="flex items-center justify-between border-b border-line px-5 py-3.5 last:border-0">
              <span className="text-ink-soft">{k}</span>
              <span className="font-display text-xl font-semibold">{v}</span>
            </div>
          ))}
        </div>
        <button onClick={async () => { try { await navigator.clipboard.writeText(text); toast("Copiado! Cola no WhatsApp 😉"); } catch { toast("Não deu pra copiar", "error"); } }}
          className="mt-4 w-full rounded-full bg-ink py-3.5 font-semibold text-paper">Copiar números</button>
        {FEEDBACK_URL && <a href={FEEDBACK_URL} target="_blank" rel="noreferrer" className="mt-2 block w-full rounded-full bg-white py-3.5 text-center font-semibold ring-1 ring-line">Mandar feedback</a>}
        <button onClick={forceUpdate} className="mt-2 w-full rounded-full bg-white py-3.5 font-semibold ring-1 ring-line">Buscar atualização do app</button>
        <a href="./lab.html" className="mt-2 block w-full rounded-full bg-cream py-3.5 text-center font-semibold">Abrir laboratório</a>
        <p className="mt-2 text-center text-xs text-ink-mute">Versão de {__BUILD__}</p>
        <div className="mt-8 grid grid-cols-2 gap-2 text-sm">
          <button onClick={() => { resetTips(); toast("As dicas vão aparecer de novo"); }} className="rounded-full py-3 font-semibold text-ink-soft ring-1 ring-line">Rever dicas</button>
          <button onClick={showWelcomeAgain} className="rounded-full py-3 font-semibold text-ink-soft ring-1 ring-line">Rever boas-vindas</button>
        </div>
      </div>
    </div>
  );
}
