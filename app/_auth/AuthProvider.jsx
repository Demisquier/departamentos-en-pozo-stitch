"use client";
// app/_auth/AuthProvider.jsx — Favoritos SIN login, persistidos en el navegador (localStorage).
// El usuario guarda las propiedades que le interesan y las ve en /mi-seleccion, sin crear
// cuenta. Estado compartido por toda la app (una sola lectura de localStorage), con sync
// entre pestañas. (El nombre del archivo/hook se mantiene para no tocar los imports; la
// versión con login-Google queda para sumar más adelante.)
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

const KEY = "dpp_favoritos_v1";
const Ctx = createContext(null);

export function useAuth() {
  return (
    useContext(Ctx) || {
      enabled: true,
      ready: false,
      favoritos: new Set(),
      items: [],
      count: 0,
      isSaved: () => false,
      toggleFavorito: () => {},
    }
  );
}

export default function AuthProvider({ children }) {
  const [items, setItems] = useState([]); // array de cards (más reciente primero)
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw) || []);
    } catch {}
    setReady(true);
    // Sync entre pestañas: si se guarda en otra pestaña, se refleja acá.
    const onStorage = (e) => {
      if (e.key === KEY) {
        try { setItems(e.newValue ? JSON.parse(e.newValue) : []); } catch {}
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next) => {
    setItems(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  }, []);

  const slugs = useMemo(() => new Set(items.map((x) => x.slug)), [items]);
  const isSaved = useCallback((slug) => slugs.has(slug), [slugs]);

  const toggleFavorito = useCallback((card) => {
    if (!card?.slug) return;
    const exists = items.some((x) => x.slug === card.slug);
    persist(exists ? items.filter((x) => x.slug !== card.slug) : [{ ...card, _ts: Date.now() }, ...items]);
    return exists ? "removed" : "added";
  }, [items, persist]);

  const value = useMemo(
    () => ({ enabled: true, ready, favoritos: slugs, items, count: items.length, isSaved, toggleFavorito }),
    [ready, slugs, items, isSaved, toggleFavorito]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
