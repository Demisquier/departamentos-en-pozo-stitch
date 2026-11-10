"use client";

import { useState } from "react";
import { crearAlerta } from "../../lib/alertaLead";
import { BARRIO_CATALOGO, zonaDeBarrio } from "../../lib/barrios";

// Alta de alertas de lanzamientos. Va por /api/lead con el shape ÚNICO de alertas
// (lib/alertaLead → origen "Alerta", tipo "alerta_lanzamiento") y con zonas / presupuesto /
// ambientes en COLUMNAS propias, así llega a la planilla que lee el job de alertas
// (antes posteaba a /api/contacto, otro webhook, con todo metido en "mensaje").
const ABIERTO = "Cualquier barrio de CABA";
const BARRIOS = [ABIERTO, ...Object.values(BARRIO_CATALOGO).map((b) => b.label).filter((l) => zonaDeBarrio(l) === "Capital Federal").sort((a, b) => a.localeCompare(b, "es")), "Zona Norte (GBA)", "Zona Oeste (GBA)", "Zona Sur (GBA)", "La Plata"];
const ZONA_VALOR = { [ABIERTO]: "abierto", "Zona Norte (GBA)": "zona norte", "Zona Oeste (GBA)": "zona oeste", "Zona Sur (GBA)": "zona sur" };
// Rango → presupuesto máximo (USD). "Más de 350k" no pone tope.
const RANGOS = [
  ["Sin definir", ""], ["Hasta USD 120.000", "120000"], ["Hasta USD 200.000", "200000"],
  ["Hasta USD 350.000", "350000"], ["Más de USD 350.000", ""],
];
const AMBIENTES = [["Cualquiera", ""], ["1 amb (monoambiente)", "1"], ["2 amb", "2"], ["3 amb", "3"], ["4 amb o más", "4+"]];
const ETAPAS = ["Cualquier etapa", "Pozo (inicio de obra)", "En construcción", "Próxima a entrega"];

export default function AlertasForm() {
  const [form, setForm] = useState({
    nombre: "", email: "", whatsapp: "",
    barrio: BARRIOS[0], rango: RANGOS[0][0], ambientes: "", etapa: ETAPAS[0],
    _gotcha: "",
  });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form._gotcha) { setStatus("sent"); return; }
    setStatus("sending");
    const presupuesto = (RANGOS.find((r) => r[0] === form.rango) || ["", ""])[1];
    const zonas = ZONA_VALOR[form.barrio] || form.barrio;
    const r = await crearAlerta({
      email: form.email, nombre: form.nombre, whatsapp: form.whatsapp,
      zonas, presupuesto, ambientes: form.ambientes, fuente: "alertas_form",
      mensaje: `Alta de alerta de lanzamientos | Barrio: ${form.barrio} | Rango: ${form.rango} | Ambientes: ${form.ambientes || "cualquiera"} | Etapa: ${form.etapa}`,
    });
    if (r.ok) {
      setStatus("sent");
      setForm((p) => ({ ...p, nombre: "", email: "", whatsapp: "" }));
      setTimeout(() => setStatus("idle"), 5000);
    } else {
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
        <input aria-label=" gotcha" type="text" name="_gotcha" tabIndex={-1} autoComplete="off" value={form._gotcha} onChange={handleChange} className="hidden" aria-hidden="true" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="font-label-caps text-on-surface-variant uppercase text-[12px]" htmlFor="a-nombre">Nombre</label>
            <input aria-label="Ej: Juan" id="a-nombre" name="nombre" type="text" required placeholder="Ej: Juan" value={form.nombre} onChange={handleChange} className={inpCls} />
          </div>
          <div className="space-y-2">
            <label className="font-label-caps text-on-surface-variant uppercase text-[12px]" htmlFor="a-email">Email</label>
            <input aria-label="juan@email.com" id="a-email" name="email" type="email" required placeholder="juan@email.com" value={form.email} onChange={handleChange} className={inpCls} />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="font-label-caps text-on-surface-variant uppercase text-[12px]" htmlFor="a-barrio">Barrio de interés</label>
            <select id="a-barrio" name="barrio" value={form.barrio} onChange={handleChange} className={selCls}>
              {BARRIOS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="font-label-caps text-on-surface-variant uppercase text-[12px]" htmlFor="a-rango">Presupuesto</label>
            <select id="a-rango" name="rango" value={form.rango} onChange={handleChange} className={selCls}>
              {RANGOS.map(([r]) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="font-label-caps text-on-surface-variant uppercase text-[12px]" htmlFor="a-amb">Ambientes</label>
            <select id="a-amb" name="ambientes" value={form.ambientes} onChange={handleChange} className={selCls}>
              {AMBIENTES.map(([l, v]) => <option key={l} value={v}>{l}</option>)}
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
            <input aria-label="11 1234 5678" id="a-wa" name="whatsapp" type="tel" placeholder="11 1234 5678" value={form.whatsapp} onChange={handleChange} className="w-full border border-outline-variant rounded-r-lg p-3 focus:ring-2 focus:ring-secondary focus:border-secondary transition-all" />
          </div>
        </div>

        <button type="submit" disabled={status === "sending"}
          className="w-full py-4 rounded font-label-caps text-[14px] tracking-widest uppercase shadow-md flex justify-center items-center gap-2 bg-primary-container text-on-primary hover:opacity-90 transition-all disabled:opacity-70">
          {status === "sending" && (<><span className="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>Activando...</>)}
          {status === "sent" && (<><span className="material-symbols-outlined text-[18px]">check_circle</span>Alerta activada</>)}
          {(status === "idle" || status === "error") && (<>Activar mi alerta <span className="material-symbols-outlined text-[18px]">notifications_active</span></>)}
        </button>

        {status === "sent" && (<p className="text-center text-[13px] text-secondary">Listo. Te vamos a avisar cuando aparezca un proyecto que encaje con tu búsqueda.</p>)}
        {status === "error" && (<p className="text-center text-[12px] text-error">Hubo un problema. Por favor, intenta de nuevo.</p>)}

        <p className="text-center text-[12px] text-on-surface-variant italic">
          Sin spam. Cuidamos tus datos: no los compartimos ni los vendemos. Podés darte de baja con un clic desde cualquier mail.
        </p>
      </form>
    </div>
  );
}
