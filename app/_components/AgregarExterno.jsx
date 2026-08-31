"use client";
// app/_components/AgregarExterno.jsx — Sumá a Mi Plan proyectos/propiedades que viste en otro lado
// (que no están en nuestro catálogo). Guardado local en dpp_externos_v1. Independiente del store de
// favoritos (no rompe las cards ni el modal existentes). v1: carga a mano / por link.
import { useEffect, useState } from "react";

const KEY = "dpp_externos_v1";
const read = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
const hrefOk = (u) => (/^https?:\/\//i.test(u) ? u : (u ? "https://" + u : ""));

export default function AgregarExterno() {
  const [items, setItems] = useState([]);
  const [abierto, setAbierto] = useState(false);
  const [f, setF] = useState({ nombre: "", zona: "", link: "", nota: "" });

  useEffect(() => { setItems(read()); }, []);
  const persist = (next) => { setItems(next); try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {} };

  function agregar(e) {
    e.preventDefault();
    const nombre = f.nombre.trim(); if (!nombre) return;
    const item = { id: "ext-" + Date.now(), nombre, zona: f.zona.trim(), link: f.link.trim(), nota: f.nota.trim(), ts: Date.now() };
    persist([item, ...items]);
    setF({ nombre: "", zona: "", link: "", nota: "" }); setAbierto(false);
  }
  function quitar(id) { persist(items.filter((x) => x.id !== id)); }

  return (
    <section id="externos" className="scroll-mt-28">
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="font-headline-sm text-headline-sm text-primary">Otros proyectos que te interesan</h2>
          <p className="text-on-surface-variant text-[13.5px] mt-0.5">Sumá algo que viste en otro lado y no está en nuestro catálogo. Queda guardado en tu plan.</p>
        </div>
        {!abierto && (
          <button type="button" onClick={() => setAbierto(true)} className="shrink-0 inline-flex items-center gap-2 rounded-full bg-secondary-container text-primary px-5 py-2.5 text-[13px] font-label-caps uppercase tracking-wider hover:opacity-90 transition">Agregar</button>
        )}
      </div>

      {abierto && (
        <form onSubmit={agregar} className="border border-outline-variant rounded-xl p-4 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-[12.5px] text-on-surface-variant">Nombre del proyecto o propiedad *</span>
            <input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} placeholder="Ej: Torre X en Palermo" className="rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-[14.5px] text-primary focus:border-secondary outline-none" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[12.5px] text-on-surface-variant">Zona / barrio</span>
            <input value={f.zona} onChange={(e) => setF({ ...f, zona: e.target.value })} placeholder="Palermo" className="rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-[14.5px] text-primary focus:border-secondary outline-none" />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-[12.5px] text-on-surface-variant">Link (Zonaprop, Instagram, etc.)</span>
            <input value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} inputMode="url" placeholder="https://" className="rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-[14.5px] text-primary focus:border-secondary outline-none" />
          </label>
          <label className="flex flex-col gap-1 sm:col-span-2">
            <span className="text-[12.5px] text-on-surface-variant">Nota (opcional)</span>
            <input value={f.nota} onChange={(e) => setF({ ...f, nota: e.target.value })} placeholder="Por que te interesa, precio que viste, etc." className="rounded-lg border border-outline-variant bg-surface px-3 py-2.5 text-[14.5px] text-primary focus:border-secondary outline-none" />
          </label>
          <div className="sm:col-span-2 flex items-center gap-3">
            <button type="submit" className="rounded bg-primary-container text-on-primary px-5 py-2.5 text-[13px] font-label-caps uppercase tracking-wider hover:opacity-90 transition">Agregar a mi plan</button>
            <button type="button" onClick={() => setAbierto(false)} className="text-[13px] text-on-surface-variant underline hover:text-primary">Cancelar</button>
          </div>
        </form>
      )}

      {items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((it) => (
            <div key={it.id} className="relative border border-outline-variant rounded-xl p-4 bg-surface">
              <span className="inline-block mb-2 text-[10px] font-label-caps uppercase tracking-widest text-secondary bg-secondary-container rounded px-2 py-0.5">Agregado por vos</span>
              <h3 className="serif text-[17px] text-primary leading-tight">{it.nombre}</h3>
              {it.zona && (<p className="text-on-surface-variant text-[12.5px] flex items-center gap-1 mt-1"><span className="material-symbols-outlined text-[15px] text-link-gold">location_on</span>{it.zona}</p>)}
              {it.nota && (<p className="text-on-surface-variant text-[13px] mt-2 leading-snug">{it.nota}</p>)}
              <div className="flex items-center gap-3 mt-3">
                {it.link && (<a href={hrefOk(it.link)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[13px] text-secondary underline hover:no-underline">Ver aviso <span className="material-symbols-outlined text-[15px]">arrow_forward</span></a>)}
                <button type="button" onClick={() => quitar(it.id)} className="text-[12.5px] text-on-surface-variant underline hover:text-primary ml-auto">Quitar</button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        !abierto && (<p className="text-on-surface-variant text-[13.5px] border border-dashed border-outline-variant rounded-xl p-4">Todavía no sumaste ninguno. Tocá "Agregar" para cargar el primero.</p>)
      )}
    </section>
  );
}
