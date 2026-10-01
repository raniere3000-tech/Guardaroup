import { NavLink, useNavigate } from "react-router-dom";
import { Home, Shirt, Plus, Sparkles, LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";

const tabs = [
  { to: "/", label: "Início", icon: Home, end: true },
  { to: "/guarda-roupa", label: "Closet", icon: Shirt },
  null, // botão central
  { to: "/criar-look", label: "Criar", icon: Sparkles },
  { to: "/looks", label: "Looks", icon: LayoutGrid },
];

/** Barra inferior no estilo de app nativo. */
export default function Navbar() {
  const navigate = useNavigate();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/90 backdrop-blur-lg pb-safe" aria-label="Navegação principal">
      <ul className="mx-auto flex max-w-md items-center justify-around px-2 pt-1.5 pb-1.5">
        {tabs.map((t, i) =>
          t === null ? (
            <li key="add">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate("/adicionar")}
                aria-label="Adicionar roupa"
                className="-mt-6 grid size-14 place-items-center rounded-full bg-ink text-paper shadow-lg shadow-ink/20 ring-4 ring-paper"
              >
                <Plus size={26} strokeWidth={2.5} />
              </motion.button>
            </li>
          ) : (
            <li key={t.to}>
              <NavLink to={t.to} end={t.end} className="group flex w-16 flex-col items-center gap-0.5 py-1">
                {({ isActive }) => (
                  <>
                    <span className={`grid h-8 w-12 place-items-center rounded-full transition-colors ${isActive ? "bg-cream text-ink" : "text-ink-mute"}`}>
                      <t.icon size={21} strokeWidth={isActive ? 2.4 : 2} />
                    </span>
                    <span className={`text-[11px] font-semibold ${isActive ? "text-ink" : "text-ink-mute"}`}>{t.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          )
        )}
      </ul>
    </nav>
  );
}
