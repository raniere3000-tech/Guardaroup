import { useState } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useStore } from "./store/useStore";
import { ToastProvider } from "./components/Toast";
import Navbar from "./components/Navbar";
import Welcome from "./components/Welcome";
import ClothDetail from "./components/ClothDetail";
import Home from "./pages/Home";
import Wardrobe from "./pages/Wardrobe";
import AddCloth from "./pages/AddCloth";
import Creator from "./pages/Creator";
import Outfits from "./pages/Outfits";
import Stats from "./pages/Stats";

const HIDE_NAV = ["/adicionar", "/editar"];

export default function App() {
  const { ready, ui, finishWelcome } = useStore();
  const location = useLocation();
  const [openCloth, setOpenCloth] = useState(null);

  if (!ready) {
    return (
      <div className="grid h-full place-items-center">
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-display text-3xl font-semibold">Vestí<span className="text-beige">.</span></motion.p>
      </div>
    );
  }

  const showNav = !HIDE_NAV.some((p) => location.pathname.startsWith(p));

  return (
    <ToastProvider>
      <AnimatePresence mode="wait">
        <motion.main
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="min-h-full"
        >
          <Routes location={location}>
            <Route path="/" element={<Home onOpenCloth={setOpenCloth} />} />
            <Route path="/guarda-roupa" element={<Wardrobe onOpenCloth={setOpenCloth} />} />
            <Route path="/adicionar" element={<AddCloth />} />
            <Route path="/editar/:id" element={<AddCloth />} />
            <Route path="/criar-look" element={<Creator />} />
            <Route path="/criar-look/:id" element={<Creator />} />
            <Route path="/looks" element={<Outfits />} />
            <Route path="/estatisticas" element={<Stats />} />
            <Route path="*" element={<Home onOpenCloth={setOpenCloth} />} />
          </Routes>
        </motion.main>
      </AnimatePresence>

      {showNav && <Navbar />}
      <ClothDetail item={openCloth} onClose={() => setOpenCloth(null)} />

      <AnimatePresence>
        {!ui.welcomeSeen && (
          <motion.div key="welcome" exit={{ opacity: 0, scale: 1.03 }} transition={{ duration: 0.3 }}>
            <Welcome onFinish={finishWelcome} />
          </motion.div>
        )}
      </AnimatePresence>
    </ToastProvider>
  );
}
