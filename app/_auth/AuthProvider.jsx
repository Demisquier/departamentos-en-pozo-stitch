"use client";
// app/_auth/AuthProvider.jsx — Favoritos con SESIÓN de Google (Supabase).
// Modelo login-gated: para guardar o ver "Mi selección" tenés que estar logueado.
// • Al tocar "Guardar" sin sesión → se abre el modal (AuthPrompt), se recuerda la
//   intención (dpp_pending_fav_v1) y al volver del OAuth el proyecto se guarda solo.
// • Migración: si había favoritos viejos en el navegador (modelo anterior), al primer
//   login se suben a la cuenta. localStorage queda solo como caché.
// Si faltan las env vars de Supabase (authEnabled=false), cae a modo local sin romper nada.
import { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase, authEnabled } from "../../lib/supabase";
import AuthPrompt from "./AuthPrompt";

const KEY = "dpp_favoritos_v1";
const PERFIL_KEY = "dpp_perfil_v1";
const PENDING_KEY = "dpp_pending_fav_v1"; // favorito que se quiso guardar antes de loguear
const Ctx = createContext(null);

export function useAuth() {
  return (
    useContext(Ctx) || {
      enabled: authEnabled, ready: false, authReady: false, user: null,
      favoritos: new Set(), items: [], count: 0,
      isSaved: () => false, toggleFavorito: () => {},
      login: () => {}, logout: () => {},
      promptCard: null, openAuthPrompt: () => {}, closeAuthPrompt: () => {},
    }
  );
}

const readLocal = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
const readPerfil = () => { try { return JSON.parse(localStorage.getItem(PERFIL_KEY)); } catch { return null; } };

export default function AuthProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);
  const [authReady, setAuthReady] = useState(!authEnabled); // sin auth: resuelto de entrada
  const [user, setUser] = useState(null);
  const [promptCard, setPromptCard] = useState(null); // card pendiente que abre el modal de login
  const syncing = useRef(false);

  const persist = useCallback((next) => {
    setItems(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  }, []);

  // Al iniciar sesión: fusionamos favoritos nube ⇄ local ⇄ pendiente, subimos lo que falte, sincronizamos perfil.
  const onLogin = useCallback(async (u) => {
    setUser(u);
    if (!authEnabled || syncing.current) return;
    syncing.current = true;
    try {
      const { data: rows } = await supabase.from("favoritos").select("slug,data").eq("user_id", u.id);
      const cloud = (rows || []).map((r) => ({ ...(r.data || {}), slug: r.slug }));
      const bySlug = new Map();
      cloud.forEach((c) => bySlug.set(c.slug, c));
      const toUpload = [];
      // Favoritos viejos del navegador (modelo anterior) → migran a la cuenta.
      readLocal().forEach((l) => { if (l.slug && !bySlug.has(l.slug)) { bySlug.set(l.slug, l); toUpload.push(l); } });
      // Favorito pendiente (tocó "Guardar" sin sesión, se logueó recién).
      try {
        const pend = JSON.parse(localStorage.getItem(PENDING_KEY) || "null");
        if (pend && pend.slug && !bySlug.has(pend.slug)) { bySlug.set(pend.slug, pend); toUpload.push(pend); }
      } catch {}
      try { localStorage.removeItem(PENDING_KEY); } catch {}
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
      supabase.auth.getSession().then(({ data }) => {
        const u = data?.session?.user;
        if (u) onLogin(u);
        setAuthReady(true);
      });
      const { data: sub } = supabase.auth.onAuthStateChange((_ev, session) => {
        const u = session?.user || null;
        if (u) onLogin(u); else setUser(null);
        setAuthReady(true);
      });
      unsub = () => sub?.subscription?.unsubscribe?.();
    }
    return () => { window.removeEventListener("storage", onStorage); if (unsub) unsub(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const slugs = useMemo(() => new Set(items.map((x) => x.slug)), [items]);
  // Deslogueado (con auth activo) no mostramos favoritos: la selección vive en la cuenta.
  const isSaved = useCallback((slug) => (authEnabled && !user ? false : slugs.has(slug)), [slugs, user]);

  const toggleFavorito = useCallback((card) => {
    if (!card?.slug) return;
    // Con auth activo, guardar requiere sesión. GuardarBtn abre el modal antes de llegar acá.
    if (authEnabled && !user) { setPromptCard(card); return "needsLogin"; }
    const exists = items.some((x) => x.slug === card.slug);
    persist(exists ? items.filter((x) => x.slug !== card.slug) : [{ ...card, _ts: Date.now() }, ...items]);
    if (authEnabled && user) {
      if (exists) supabase.from("favoritos").delete().eq("user_id", user.id).eq("slug", card.slug).then(() => {}, () => {});
      else supabase.from("favoritos").upsert({ user_id: user.id, slug: card.slug, data: card }).then(() => {}, () => {});
    }
    return exists ? "removed" : "added";
  }, [items, persist, user]);

  // login(redirectTo): vuelve a la página donde estabas (para retomar el guardado).
  // Normalizamos SIEMPRE al dominio canónico (apex, https) para que el callback de Google
  // no aterrice en www y el redirect www→apex rompa la sesión (loop "logueate de nuevo").
  const login = useCallback((redirectTo) => {
    if (!authEnabled) return;
    let dest = "https://departamentosenpozo.com.ar/mi-seleccion/";
    try {
      const base = redirectTo || (typeof window !== "undefined" ? window.location.href : dest);
      const u = new URL(base, "https://departamentosenpozo.com.ar");
      u.protocol = "https:"; u.host = "departamentosenpozo.com.ar";
      dest = u.toString();
    } catch {}
    supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: dest } });
  }, []);

  const logout = useCallback(async () => {
    if (authEnabled) { try { await supabase.auth.signOut(); } catch {} }
    setUser(null);
    setItems([]); // limpiamos la vista al salir (la data queda en la cuenta)
    // Borramos el caché local para que los favoritos de una cuenta NO migren a otra
    // si alguien más se loguea en el mismo navegador. La data real vive en la nube.
    try { localStorage.removeItem(KEY); localStorage.removeItem(PENDING_KEY); } catch {}
  }, []);

  const openAuthPrompt = useCallback((card) => setPromptCard(card || {}), []);
  const closeAuthPrompt = useCallback(() => setPromptCard(null), []);

  // Para la vista, si hay auth y no hay sesión, no exponemos favoritos.
  const viewItems = authEnabled && !user ? [] : items;

  const value = useMemo(
    () => ({
      enabled: authEnabled, ready, authReady, user,
      favoritos: slugs, items: viewItems, count: viewItems.length,
      isSaved, toggleFavorito, login, logout,
      promptCard, openAuthPrompt, closeAuthPrompt,
    }),
    [ready, authReady, user, slugs, viewItems, isSaved, toggleFavorito, login, logout, promptCard, openAuthPrompt, closeAuthPrompt]
  );

  return (
    <Ctx.Provider value={value}>
      {children}
      <AuthPrompt />
    </Ctx.Provider>
  );
}
