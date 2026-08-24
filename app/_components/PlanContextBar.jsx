"use client";
// app/_components/PlanContextBar.jsx — Barra de contexto "plan-aware" para fichas.
// Se monta global (bajo el Header). No renderiza nada salvo que la página actual sea un
// proyecto que el usuario tiene guardado en su Plan. En ese caso muestra una tira slim:
// "En tu plan · X de N · Anterior · Mi Plan · Siguiente", para recorrer los guardados
// como si fueran items de un carrito, sin salir del flujo de navegación.
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "../_auth/AuthProvider";

function norm(p) {
  if (!p) return "";
  let s = String(p).split("?")[0].split("#")[0];
  if (s.length > 1 && s.endsWith("/")) s = s.slice(0, -1);
  return s;
}

function hrefOf(it) {
  if (!it) return "#";
  return it.href || (it.slug ? "/" + it.slug : "#");
}

export default function PlanContextBar() {
  const { items } = useAuth();
  const pathname = usePathname();
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return null;
  const here = norm(pathname);
  const idx = list.findIndex((it) => {
    const h = norm(hrefOf(it));
    return h && h !== "#" && h === here;
  });
  if (idx < 0) return null;
  const prev = idx > 0 ? list[idx - 1] : null;
  const next = idx < list.length - 1 ? list[idx + 1] : null;

  return (
    <div className="border-b border-secondary/30 bg-secondary-container/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="material-symbols-outlined icon-fill text-secondary text-[18px]" aria-hidden="true">favorite</span>
          <span className="truncate text-xs font-medium text-on-surface">En tu plan · {idx + 1} de {list.length}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {prev ? (
            <Link href={hrefOf(prev)} className="rounded-full px-2.5 py-1 text-xs text-primary transition-colors hover:bg-secondary-container" aria-label="Proyecto anterior de tu plan">← Anterior</Link>
          ) : (
            <span className="px-2.5 py-1 text-xs text-on-surface/30">← Anterior</span>
          )}
          <Link href="/mi-seleccion/" className="rounded-full bg-secondary px-3 py-1 text-label-caps font-label-caps uppercase tracking-wider text-white transition-colors hover:bg-secondary/90">Mi Plan</Link>
          {next ? (
            <Link href={hrefOf(next)} className="rounded-full px-2.5 py-1 text-xs text-primary transition-colors hover:bg-secondary-container" aria-label="Siguiente proyecto de tu plan">Siguiente →</Link>
          ) : (
            <span className="px-2.5 py-1 text-xs text-on-surface/30">Siguiente →</span>
          )}
        </div>
      </div>
    </div>
  );
}
