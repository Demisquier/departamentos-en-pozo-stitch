// lib/supabase.js — Cliente de Supabase para el navegador (auth con Google + favoritos).
// DORMIDO por diseño: si las env vars todavía no están seteadas (antes de provisionar
// Supabase), exporta null y toda la UI de login/guardar queda inerte SIN romper el build
// ni el sitio. Una vez cargadas NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
// en Vercel, se activa solo.
//
// La anon key es PÚBLICA por diseño (va en el cliente): la seguridad real la da Row Level
// Security en la tabla `favoritos` (cada usuario solo ve/edita sus filas).
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// flowType 'implicit': el token vuelve en el hash (#access_token) y no depende de un
// code_verifier atado al origen. Es robusto para un sitio 100% cliente con redirect
// www→apex: evita el loop de "logueate de nuevo" que produce PKCE cuando cambia el host.
export const supabase =
  url && anon
    ? createClient(url, anon, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: "implicit" },
      })
    : null;

// Flag para que los componentes sepan si la feature está configurada.
export const authEnabled = !!supabase;
