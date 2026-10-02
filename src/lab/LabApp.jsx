import { Link, Route, Routes, useLocation } from "react-router-dom";
import { ChevronLeft, ChevronRight, PanelBottom, Shirt, Hourglass, ScanSearch } from "lucide-react";
import BoardLab from "./BoardLab";
import SheetLab from "./SheetLab";
import WaitLab from "./WaitLab";
import SplitLab from "./SplitLab";

const EXPERIMENTS = [
  { path: "/quadro", title: "Quadro do criador", text: "Selecionar, X no canto, arrastar, pinça para tamanho e giro, camadas, trocar deslizando", icon: Shirt, el: <BoardLab /> },
  { path: "/painel", title: "Painel que fecha arrastando", text: "Puxar pela alça ou pela foto, voltar do celular", icon: PanelBottom, el: <SheetLab /> },
  { path: "/espera", title: "Animações de espera", text: "Cabide, tesoura e cartas", icon: Hourglass, el: <WaitLab /> },
  { path: "/separador", title: "Separador de peças", text: "Foto de corpo inteiro vira peças, com tempo medido", icon: ScanSearch, el: <SplitLab /> },
];

function Header() {
  const { pathname } = useLocation();
  const exp = EXPERIMENTS.find((e) => e.path === pathname);
  return (
    <header className="sticky top-0 z-30 bg-paper/90 pt-safe backdrop-blur">
      <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
        {exp && <Link to="/" aria-label="Voltar" className="-ml-2 grid size-10 place-items-center rounded-full hover:bg-cream"><ChevronLeft size={22} /></Link>}
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-wider text-ink-mute">Laboratório Vestí</p>
          <h1 className="truncate font-display text-2xl font-semibold">{exp ? exp.title : "Fase 0"}</h1>
        </div>
      </div>
    </header>
  );
}

function Home() {
  return (
    <div className="mx-auto max-w-md px-4 pb-10">
      <p className="text-ink-soft">Cada parte do app testada sozinha. Quando tudo funcionar redondinho no seu celular, levamos para o Vestí.</p>
      <div className="mt-5 space-y-3">
        {EXPERIMENTS.map(({ path, title, text, icon: Icon }) => (
          <Link key={path} to={path} className="flex items-center gap-3 rounded-3xl bg-white p-4 ring-1 ring-line active:scale-[0.99]">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-cream"><Icon size={22} /></span>
            <span className="min-w-0 flex-1"><span className="block font-semibold">{title}</span><span className="text-sm text-ink-mute">{text}</span></span>
            <ChevronRight size={18} className="text-ink-mute" />
          </Link>
        ))}
      </div>
      <a href="./" className="mt-6 block text-center text-sm font-semibold text-ink-soft underline">Voltar para o app</a>
      <p className="mt-2 text-center text-xs text-ink-mute">Versão de {__BUILD__}</p>
    </div>
  );
}

export default function LabApp() {
  return (
    <div className="min-h-full">
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        {EXPERIMENTS.map((e) => <Route key={e.path} path={e.path} element={e.el} />)}
        <Route path="*" element={<Home />} />
      </Routes>
    </div>
  );
}
