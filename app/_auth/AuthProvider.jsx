"use client";
// app/_auth/AuthProvider.jsx — Favoritos + login con Google (Supabase), con localStorage de RESPALDO.
// • Sin sesión: funciona igual que antes, guardando en el navegador (localStorage 'dpp_favoritos_v1').
// • Con sesión Google (Supabase): favoritos y perfil quedan en la nube (tablas con RLS) → persisten
//   cross-device. Al primer login MIGRAMOS lo que había en localStorage a la cuenta.
// Si faltan las env vars de Supabase (authEnabled=false), queda en modo localStorage sin romper nada.
import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase, authEnabled } from "../../lib/supabase";

const KEY = "dpp_favoritos_v1";
const PERFIL_KEY = "dpp_perfil_v1";
const Ctx = createContext(null);

export function useAuth() {
  return (
    useContext(Ctx) || {
      enabled: authEnabled, ready: false, user: null,
      favoritos: new Set(), items: [], count: 0,
      isSaved: () => false, toggleFavorito: () => {},
      login: () => {}, logout: () => {},
    }
  );
}

const readLocal = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
const readPerfil = () => { try { return JSON.parse(localStorage.getItem(PERFIL_KEY)); } catch { return null; } };

export default function AuthProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const [user, setUser] = useState(null);
  const syncing = useRef(false);

  const persist = useCallback((next) => {
    setItems(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  }, []);

  // Al iniciar sesión: fusionamos favoritos nube ⇄ local, subimos lo que falte, y sincronizamos perfil.
  const onLogin = useCallback(async (u) => {
    setUser(u);
    if (!authEnabled || syncing.current) return;
    syncing.current = true;
    try {
      const { data: rows } = await supabase.from("favoritos").select("slug,data").eq("user_id", u.id);
      const cloud = (rows || []).map((r) => ({ ...(r.data || {}), slug: r.slug }));
      const local = readLocal();
      const bySlug = new Map();
      cloud.forEach((c) => bySlug.set(c.slug, c));
      const toUpload = [];
      local.forEach((l) => { if (l.slug && !bySlug.has(l.slug)) { bySlug.set(l.slug, l); toUpload.push(l); } });
      persist([...bySlug.values()]);
      if (toUpload.length) await supabase.from("favoritos").upsert(toUpload.map((c) => ({ user_id: u.id, slug: c.slug, data: c })));
      // Perfil (asesor): nube → local si existe; si no, local → nube.
      const { data: prow } = await supabase.from("perfiles").select("data").eq("user_id", u.id).maybeSingle();
      const localPerfil = readPerfil();
      if (prow && prow.data) { try { localStorage.setItem(PERFIL_KEY, JSON.stringify(prow.data)); } catch {} }
      else if (localPerfil) { await supabase.from("perfiles").upsert({ user_id: u.id, data: localPerfil }); }
    } catch {}
    syncing.current = false;
  }, [persist]);

  useEffect(() => {
    setItems(readLocal());
    setReady(true);
    const onStorage = (e) => { if (e.key === KEY) { try { setItems(e.newValue ? JSON.parse(e.newValue) : []); } catch {} } };
    window.addEventListener("storage", onStorage);

    let unsub = null;
    if (authEnabled) {
      supabase.auth.getSession().then(({ data }) => { const u = data?.session?.user; if (u) onLogin(u); });
      const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
        const u = session?.user || null;
        if (u) onLogin(u); else setUser(null);
      });
      unsub = () => sub?.subscription?.unsubscribe?.();
    }
    return () => { window.removeEventListener("storage", onStorage); if (unsub) unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slugs = useMemo(() => new Set(items.map((x) => x.slug)), [items]);
  const isSaved = useCallback((slug) => slugs.has(slug), [slugs]);

  const toggleFavorito = useCallback((card) => {
    if (!card?.slug) return;
    const exists = items.some((x) => x.slug === card.slug);
    persist(exists ? items.filter((x) => x.slug !== card.slug) : [{ ...card, _ts: Date.now() }, ...items]);
    if (authEnabled && user) {
      if (exists) supabase.from("favoritos").delete().eq("user_id", user.id).eq("slug", card.slug).then(() => {}, () => {});
      else supabase.from("favoritos").upsert({ user_id: user.id, slug: card.slug, data: card }).then(() => {}, () => {});
    }
    return exists ? "removed" : "added";
  }, [items, persist, user]);

  const login = useCallback(() => {
    if (!authEnabled) return;
    const redirectTo = (typeof window !== "undefined" ? window.location.origin : "") + "/mi-seleccion/";
    supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo } });
  }, []);

  const logout = useCallback(async () => {
    if (authEnabled) { try { await supabase.auth.signOut(); } catch {} }
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ enabled: authEnabled, ready, user, favoritos: slugs, items, count: items.length, isSaved, toggleFavorito, login, logout }),
    [ready, user, slugs, items, isSaved, toggleFavorito, login, logout]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
