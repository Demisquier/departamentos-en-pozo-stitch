"use client";

import { useState } from "react";

// Captura de alertas de lanzamientos. Reusa el pipeline de leads existente
// (/api/contacto → CPT lead) empaquetando los filtros en `mensaje` y
// etiquetando origen="alerta-lanzamientos". Arranque manual: los envios se
// disparan a mano hasta automatizar el match desarrollo→suscriptor.
const BARRIOS = ["Cualquier barrio", "Palermo", "Caballito", "Belgrano", "Nunez", "Puerto Madero", "Villa Urquiza", "Colegiales", "Coghlan", "Otro / no se todavia"];
const RANGOS = ["Sin definir", "Hasta USD 120.000", "USD 120.000 - 200.000", "USD 200.000 - 350.000", "Mas de USD 350.000"];
const ETAPAS = ["Cualquier etapa", "Pozo (inicio de obra)", "En construccion", "Proxima a entrega"];

export default function AlertasForm() {
  const [form, setForm] = useState({
    nombre: "", email: "", whatsapp: "",
    barrio: BARRIOS[0], rango: RANGOS[0], etapa: ETAPAS[0],
    _gotcha: "",
  });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    const payload = {
      nombre: form.nombre,
      email: form.email,
      whatsapp: form.whatsapp,
      origen: "alerta-lanzamientos",
      mensaje: `Alta de alerta de lanzamientos | Barrio: ${form.barrio} | Rango: ${form.rango} | Etapa: ${form.etapa}`,
      _gotcha: form._gotcha,
    };
    try {
      const res = await fetch("/api/contacto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("bad response");
      setStatus("sent");
      setForm((p) => ({ ...p, nombre: "", email: "", whatsapp: "" }));
      setTimeout(() => setStatus("idle"), 5000);
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 5000);
    }
  };

  const selCls = "w-full border border-outline-variant rounded-lg p-3 bg-white text-primary focus:ring-2 focus:ring-secondary focus:border-secondary transition-all";
  const inpCls = "w-full border border-outline-variant rounded-lg p-3 focus:ring-2 focus:ring-secondary focus:border-secondary transition-all";

  return (
    <div className="bg-white p-6 md:p-9 shadow-sm rounded-lg border border-outline-variant">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Honeypot */}
        <input type="text" name="_gotcha" tabIndex={-1} autoComplete="off" value={form._gotcha} onChange={handleChange} className="hidden" aria-hidden="true" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="font-label-caps text-on-surface-variant uppercase text-[12px]" htmlFor="a-nombre">Nombre</label>
            <input id="a-nombre" name="nombre" type="text" required placeholder="Ej: Juan" value={form.nombre} onChange={handleChange} className={inpCls} />
          </div>
          <div className="space-y-2">
            <label className="font-label-caps text-on-surface-variant uppercase text-[12px]" htmlFor="a-email">Email</label>
            <input id="a-email" name="email" type="email" required placeholder="juan@email.com" value={form.email} onChange={handleChange} className={inpCls} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="space-y-2">
            <label className="font-label-caps text-on-surface-variant uppercase text-[12px]" htmlFor="a-barrio">Barrio de interes</label>
            <select id="a-barrio" name="barrio" value={form.barrio} onChange={handleChange} className={selCls}>
              {BARRIOS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="font-label-caps text-on-surface-variant uppercase text-[12px]" htmlFor="a-rango">Rango de inversion</label>
            <select id="a-rango" name="rango" value={form.rango} onChange={handleChange} className={selCls}>
              {RANGOS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="font-label-caps text-on-surface-variant uppercase text-[12px]" htmlFor="a-etapa">Etapa de obra</label>
            <select id="a-etapa" name="etapa" value={form.etapa} onChange={handleChange} className={selCls}>
              {ETAPAS.map((et) => <option key={et} value={et}>{et}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="font-label-caps text-on-surface-variant uppercase text-[12px]" htmlFor="a-wa">WhatsApp <span className="normal-case tracking-normal text-on-surface-variant/70">(opcional)</span></label>
          <div className="flex">
            <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-outline-variant bg-surface-container-low text-on-surface-variant">+54</span>
            <input id="a-wa" name="whatsapp" type="tel" placeholder="11 1234 5678" value={form.whatsapp} onChange={handleChange} className="w-full border border-outline-variant rounded-r-lg p-3 focus:ring-2 focus:ring-secondary focus:border-secondary transition-all" />
          </div>
        </div>

        <button type="submit" disabled={status === "sending"}
          className="w-full py-4 rounded font-label-caps text-[14px] tracking-widest uppercase shadow-md flex justify-center items-center gap-2 bg-primary-container text-on-primary hover:opacity-90 transition-all disabled:opacity-70">
          {status === "sending" && (<><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>Activando...</>)}
          {status === "sent" && (<><span className="material-symbols-outlined text-[18px]">check_circle</span>Alerta activada</>)}
          {(status === "idle" || status === "error") && (<>Activar mi alerta <span className="material-symbols-outlined text-[18px]">notifications_active</span></>)}
        </button>

        {status === "sent" && (<p className="text-center text-[13px] text-secondary">Listo. Te vamos a avisar cuando aparezca un proyecto que encaje con tu busqueda.</p>)}
        {status === "error" && (<p className="text-center text-[12px] text-error">Hubo un problema. Por favor, intenta de nuevo.</p>)}

        <p className="text-center text-[12px] text-on-surface-variant italic">
          Sin spam. Cuidamos tus datos: no los compartimos ni los vendemos. Podes darte de baja cuando quieras.
        </p>
      </form>
    </div>
  );
}
