"use client";
// app/_components/ComparadorPlan.jsx — Comparador de los proyectos GUARDADOS (Mi Plan).
// Diferencial vs portales: no comparás cualquier cosa, comparás TU plan (lo que marcaste),
// con los campos que le importan al inversor en pozo: precio desde, precio/m2, etapa, entrega,
// tipologia y desarrolladora. Tabla responsive (scroll horizontal en mobile) + CTA por columna.
import { useState } from "react";
import Link from "next/link";
import { track } from "../../lib/track";

function usd(n) {
  const v = Number(n);
  if (!v || isNaN(v)) return "—";
  return "USD " + v.toLocaleString("es-AR");
}

const FILAS = [
  { label: "Precio desde", get: (p) => usd(p.precioDesde || p.precio) },
  { label: "Precio / m²", get: (p) => (p.precioM2 ? usd(p.precioM2) + "/m²" : "—") },
  { label: "Barrio", get: (p) => p.barrio || "—" },
  { label: "Etapa de obra", get: (p) => p.etapa || "—" },
  { label: "Entrega", get: (p) => p.entrega || "—" },
  { label: "Tipologías", get: (p) => p.ambientes || "—" },
  { label: "Desarrolladora", get: (p) => p.desarrolladora || "—" },
];

export default function ComparadorPlan({ items = [] }) {
  const [open, setOpen] = useState(false);
  const list = Array.isArray(items) ? items : [];
  if (list.length < 2) return null;

  const abrir = () => { setOpen(true); try { track("comparador_open", { n: list.length }); } catch (e) {} };

  return (
    <>
      <button
        type="button"
        onClick={abrir}
        className="inline-flex items-center gap-1.5 rounded-full border border-secondary px-3.5 py-1.5 text-label-caps font-label-caps uppercase tracking-wider text-primary hover:bg-secondary-container transition-colors"
      >
        <span className="material-symbols-outlined text-[18px]">table_rows</span>
        Comparar ({list.length})
      </button>

      {open && (
        <div className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={() => setOpen(false)}>
          <div className="w-full sm:max-w-4xl max-h-[92vh] bg-surface rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-outline-variant">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary icon-fill">table_rows</span>
                Comparar tu plan
              </h3>
              <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar" className="w-9 h-9 rounded-full hover:bg-surface-container-high flex items-center justify-center text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="overflow-auto">
              <table className="min-w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    <th className="sticky left-0 z-10 bg-surface-container-low text-left align-bottom p-3 min-w-[120px] border-b border-outline-variant" />
                    {list.map((p) => (
                      <th key={p.slug} className="text-left align-bottom p-3 min-w-[160px] border-b border-outline-variant bg-surface-container-low">
                        <Link href={"/desarrollos-inmobiliarios/" + p.slug + "/"} className="font-headline-sm text-[15px] text-primary hover:text-secondary leading-tight block">
                          {p.nombre}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {FILAS.map((f, ri) => (
                    <tr key={f.label} className={ri % 2 ? "bg-surface-container-low/40" : ""}>
                      <td className="sticky left-0 z-10 bg-surface p-3 font-label-caps text-label-caps uppercase text-on-surface-variant whitespace-nowrap border-b border-outline-variant">{f.label}</td>
                      {list.map((p) => (
                        <td key={p.slug} className="p-3 text-on-surface border-b border-outline-variant">{f.get(p)}</td>
                      ))}
                    </tr>
                  ))}
                  <tr>
                    <td className="sticky left-0 z-10 bg-surface p-3" />
                    {list.map((p) => (
                      <td key={p.slug} className="p-3">
                        <Link
                          href={"/asesor/?proyecto=" + encodeURIComponent(p.slug) + "&nombre=" + encodeURIComponent(p.nombre || "")}
                          className="inline-flex items-center gap-1 rounded-full bg-secondary text-white px-3 py-1.5 text-label-caps font-label-caps uppercase tracking-wider hover:bg-secondary/90 transition-colors whitespace-nowrap"
                        >
                          <span className="material-symbols-outlined text-[16px]">forum</span> Consultar
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="px-5 py-3 text-[12px] text-on-surface-variant border-t border-outline-variant">Comparás los proyectos que guardaste en tu plan. Consultá precio y forma de pago sin compromiso.</p>
          </div>
        </div>
      )}
    </>
  );
}
