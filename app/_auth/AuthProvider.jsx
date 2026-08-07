"use client";
// app/_auth/AuthProvider.jsx — Estado global (client) de sesión + favoritos. Envuelve la
// app en el layout. Expone: user, login con Google, logout, el set de slugs guardados,
// isSaved(slug) y toggleFavorito(card). Los favoritos se cargan UNA vez por sesión y se
// comparten, así las cards no disparan N queries. Si Supabase no está configurado
// (authEnabled=false) queda todo inerte y el sitio funciona igual.
import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { supabase, authEnabled } from "../../lib/supabase";

const AuthCtx = createContext(null);

export function useAuth() {
  return useContext(AuthCtx) || { user: null, loading: false, enabled: false, favoritos: new Set(), isSaved: () => false, toggleFavorito: () => {}, signIn: () => {}, signOut: () => {} };
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [favSlugs, setFavSlugs] = useState(() => new Set());

  // Sesión + suscripción a cambios de auth.
  useEffect(() => {
    if (!authEnabled) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data?.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  // Al loguear (o cambiar de user), cargar los slugs guardados. Al desloguear, vaciar.
  useEffect(() => {
    if (!authEnabled || !user) { setFavSlugs(new Set()); return; }
    let alive = true;
    supabase.from("favoritos").select("slug").eq("user_id", user.id).then(({ data }) => {
      if (alive && data) setFavSlugs(new Set(data.map((r) => r.slug)));
    });
    return () => { alive = false; };
  }, [user]);

  const signIn = useCallback(async () => {
    if (!authEnabled) return;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: typeof window !== "undefined" ? window.location.href : undefined },
    });
  }, []);

  const signOut = useCallback(async () => {
    if (!authEnabled) return;
    await supabase.auth.signOut();
    setUser(null);
    setFavSlugs(new Set());
  }, []);

  const isSaved = useCallback((slug) => favSlugs.has(slug), [favSlugs]);

  // Toggle optimista: actualiza el set local al toque y persiste en Supabase. `card` es el
  // dato denormalizado de la tarjeta (slug, nombre, barrio, precio, img, href) para que la
  // página privada renderice sin volver a leer el catálogo.
  const toggleFavorito = useCallback(async (card) => {
    if (!authEnabled) return "disabled";
    if (!user) { signIn(); return "login"; }
    const slug = card?.slug;
    if (!slug) return;
    const saved = favSlugs.has(slug);
    setFavSlugs((prev) => {
      const n = new Set(prev);
      saved ? n.delete(slug) : n.add(slug);
      return n;
    });
    if (saved) {
      await supabase.from("favoritos").delete().eq("user_id", user.id).eq("slug", slug);
    } else {
      await supabase.from("favoritos").upsert({ user_id: user.id, slug, data: card }, { onConflict: "user_id,slug" });
    }
    return saved ? "removed" : "added";
  }, [user, favSlugs, signIn]);

  const value = useMemo(
    () => ({ user, loading, enabled: authEnabled, favoritos: favSlugs, isSaved, toggleFavorito, signIn, signOut }),
    [user, loading, favSlugs, isSaved, toggleFavorito, signIn, signOut]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}
