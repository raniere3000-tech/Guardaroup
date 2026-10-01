import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { get, set } from "idb-keyval";
import { DEFAULT_LOOK_CATEGORIES } from "../lib/constants";

// Tudo fica salvo no próprio aparelho (IndexedDB): aguenta centenas de fotos,
// diferente do localStorage, que lota com umas 15.

const StoreContext = createContext(null);

const today = () => new Date().toISOString().slice(0, 10);
export const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

const DEFAULT_STATS = { firstOpen: null, days: [], clothesAdded: 0, looksCreated: 0, randomUses: 0, exports: 0, bgRemoved: 0, bgKept: 0 };
const DEFAULT_UI = { welcomeSeen: false, tipsSeen: {} };

export function StoreProvider({ children }) {
  const [ready, setReady] = useState(false);
  const [clothes, setClothes] = useState([]);
  const [outfits, setOutfits] = useState([]);
  const [lookCategories, setLookCategories] = useState(DEFAULT_LOOK_CATEGORIES);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [ui, setUi] = useState(DEFAULT_UI);
  const loaded = useRef(false);

  useEffect(() => {
    (async () => {
      try {
        const [c, o, lc, s, u] = await Promise.all([get("clothes"), get("outfits"), get("lookCategories"), get("stats"), get("ui")]);
        // migração: quem testou a versão antiga com localStorage não perde as peças
        let legacy = [];
        try {
          legacy = JSON.parse(localStorage.getItem("clothes") || "[]");
        } catch {}
        setClothes(c ?? legacy ?? []);
        setOutfits(o ?? []);
        setLookCategories(lc ?? DEFAULT_LOOK_CATEGORIES);
        const st = { ...DEFAULT_STATS, ...(s || {}) };
        if (!st.firstOpen) st.firstOpen = new Date().toISOString();
        if (!st.days.includes(today())) st.days = [...st.days, today()];
        setStats(st);
        setUi({ ...DEFAULT_UI, ...(u || {}) });
      } finally {
        loaded.current = true;
        setReady(true);
      }
    })();
  }, []);

  // grava cada parte quando muda (depois de carregar)
  useEffect(() => { if (loaded.current) set("clothes", clothes); }, [clothes]);
  useEffect(() => { if (loaded.current) set("outfits", outfits); }, [outfits]);
  useEffect(() => { if (loaded.current) set("lookCategories", lookCategories); }, [lookCategories]);
  useEffect(() => { if (loaded.current) set("stats", stats); }, [stats]);
  useEffect(() => { if (loaded.current) set("ui", ui); }, [ui]);

  const bump = useCallback((key, n = 1) => setStats((s) => ({ ...s, [key]: (s[key] || 0) + n })), []);

  const addCloth = useCallback((item) => {
    const cloth = { id: newId(), createdAt: Date.now(), ...item };
    setClothes((list) => [cloth, ...list]);
    bump("clothesAdded");
    return cloth;
  }, [bump]);

  const updateCloth = useCallback((id, patch) => setClothes((list) => list.map((c) => (c.id === id ? { ...c, ...patch } : c))), []);
  const deleteCloth = useCallback((id) => setClothes((list) => list.filter((c) => c.id !== id)), []);

  const saveOutfit = useCallback((outfit) => {
    if (outfit.id) {
      setOutfits((list) => list.map((o) => (o.id === outfit.id ? { ...o, ...outfit, updatedAt: Date.now() } : o)));
      return outfit;
    }
    const created = { ...outfit, id: newId(), createdAt: Date.now(), updatedAt: Date.now() };
    setOutfits((list) => [created, ...list]);
    bump("looksCreated");
    return created;
  }, [bump]);

  const deleteOutfit = useCallback((id) => setOutfits((list) => list.filter((o) => o.id !== id)), []);

  const addLookCategory = useCallback((name) => {
    const clean = name.trim();
    if (!clean) return;
    setLookCategories((list) => (list.some((l) => l.toLowerCase() === clean.toLowerCase()) ? list : [...list, clean]));
  }, []);

  const markTip = useCallback((key) => setUi((u) => ({ ...u, tipsSeen: { ...u.tipsSeen, [key]: true } })), []);
  const resetTips = useCallback(() => setUi((u) => ({ ...u, tipsSeen: {} })), []);
  const finishWelcome = useCallback(() => setUi((u) => ({ ...u, welcomeSeen: true })), []);
  const showWelcomeAgain = useCallback(() => setUi((u) => ({ ...u, welcomeSeen: false, tipsSeen: {} })), []);

  const clothesById = useMemo(() => Object.fromEntries(clothes.map((c) => [c.id, c])), [clothes]);

  const value = {
    ready, clothes, clothesById, outfits, lookCategories, stats, ui,
    addCloth, updateCloth, deleteCloth, saveOutfit, deleteOutfit, addLookCategory,
    bump, markTip, resetTips, finishWelcome, showWelcomeAgain,
  };
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore precisa estar dentro de <StoreProvider>");
  return ctx;
}
