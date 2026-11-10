"use client";
import { useState, useEffect } from "react";
import { crearAlerta, leerEmailPerfil, EMAIL_RE } from "../../lib/alertaLead";

// "Guardar esta búsqueda" del listado: convierte los filtros activos en una ALERTA por email
// (zonas / presupuesto / ambientes) vía /api/lead. GA4: alerta_lead { fuente: "listado" }.
//  - destacado=false → botón compacto (pill) que despliega el input de email.
//  - destacado=true  → bloque visible para 0 resultados: "No hay proyectos con estos filtros…".
export default function GuardarBusqueda({ zonas = "", presupuesto = "", ambientes = "", resumen = "", destacado = false }) {
  const [abierto, setAbierto] = useState(destacado);
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState("idle"); // idle | sending | ok
  const [err, setErr] = useState("");

  useEffect(() => { const e = leerEmailPerfil(); if (e) setEmail(e); }, []);
  // Si cambian los filtros, la búsqueda guardada ya no es la misma → reset.
  useEffect(() => { setEstado("idle"); setErr(""); }, [zonas, presupuesto, ambientes]);
  useEffect(() => { if (destacado) setAbierto(true); }, [destacado]);

  async function guardar(e) {
    e.preventDefault();
    const val = email.trim();
    if (!EMAIL_RE.test(val)) { setErr("Ingresá un email válido."); return; }
    setErr(""); setEstado("sending");
    await crearAlerta({
      email: val, zonas, presupuesto, ambientes, fuente: "listado",
      mensaje: "Búsqueda guardada (listado)" + (resumen ? " · " + resumen : ""),
    });
    setEstado("ok");
  }

  if (estado === "ok") {
    return (
      <p className={destacado ? "mt-6 text-[14px] text-primary flex items-center justify-center gap-1.5" : "text-[13px] text-primary flex items-center gap-1.5"}>
        <span className="material-symbols-outlined text-[18px] text-green-700" aria-hidden="true">check_circle</span>
        Búsqueda guardada. Te avisamos por email cuando haya proyectos nuevos{resumen ? ` (${resumen})` : ""}.
      </p>
    );
  }

  const form = (
    <form onSubmit={guardar} className={destacado ? "mt-4 flex flex-col sm:flex-row gap-2 max-w-md mx-auto" : "flex flex-col sm:flex-row gap-2 sm:items-center"}>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Tu email" aria-label="Tu email"
        className="flex-1 min-w-0 min-h-[44px] px-3.5 py-2 border border-outline-variant rounded-lg text-[14px] outline-none focus:border-secondary bg-white" />
      <button type="submit" disabled={estado === "sending"}
        className="min-h-[44px] px-5 py-2 rounded-full bg-primary-container text-on-primary text-[13px] font-medium whitespace-nowrap hover:opacity-90 transition-opacity disabled:opacity-60">
        {estado === "sending" ? "Guardando…" : (destacado ? "Avisame cuando haya" : "Guardar y avisarme")}
      </button>
    </form>
  );

  if (destacado) {
    return (
      <div className="mt-8 rounded-xl border border-secondary/40 bg-surface-container-low p-5 text-center">
        <p className="text-primary font-medium text-[15px] flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-link-gold" aria-hidden="true">notifications_active</span>
          No hay proyectos con estos filtros. Te avisamos cuando haya.
        </p>
        {resumen && <p className="text-[13px] text-on-surface-variant mt-1">Tu búsqueda: {resumen}</p>}
        {form}
        {err && <p className="mt-2 text-[12px] text-error">{err}</p>}
        <p className="mt-2 text-[11px] text-on-surface-variant">Sin spam. Baja con un clic.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {!abierto ? (
        <button type="button" onClick={() => setAbierto(true)}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 border border-secondary text-secondary rounded-full text-[13px] whitespace-nowrap hover:bg-secondary hover:text-white transition-colors self-start">
          <span className="material-symbols-outlined text-[16px]" aria-hidden="true">bookmark</span>
          Guardar esta búsqueda
        </button>
      ) : (
        <div className="flex flex-col gap-1.5">
          <p className="text-[13px] text-on-surface-variant">Te avisamos por email cuando entren proyectos{resumen ? ` (${resumen})` : ""}.</p>
          {form}
        </div>
      )}
      {err && <p className="text-[12px] text-error">{err}</p>}
    </div>
  );
}
