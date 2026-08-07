"use client";
// app/soy-desarrolladora/SoyDesarrolladoraForm.jsx — Formulario para desarrolladoras que quieran
// actualizar sus datos, sumar un proyecto, corregir algo o conversar. Envía por mail vía Formsubmit
// (SIN WordPress): primario a contacto@departamentosenpozo.com.ar, con copia (_cc) a dema2910@gmail.com.
import { useState } from "react";

const MOTIVOS = ["Actualizar mis datos", "Sumar / actualizar un proyecto", "Corregir un dato", "Conversar con el equipo"];

export default function SoyDesarrolladoraForm() {
  const [form, setForm] = useState({ empresa: "", nombre: "", email: "", whatsapp: "", motivo: MOTIVOS[0], mensaje: "" });
  const [gotcha, setGotcha] = useState("");
  const [fase, setFase] = useState("idle"); // idle | enviando | ok | error
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function enviar(e) {
    e.preventDefault();
    if (gotcha) return; // honeypot
    if (!form.empresa.trim() || (!form.email.trim() && !form.whatsapp.trim())) { setFase("error"); return; }
    setFase("enviando");
    const payload = {
      _subject: "Desarrolladora: contacto / actualización de datos",
      _template: "table", _captcha: "false", _cc: "dema2910@gmail.com",
      Desarrolladora: form.empresa.trim(),
      Contacto: form.nombre.trim() || "—",
      Email: form.email.trim() || "—",
      WhatsApp: form.whatsapp.trim() || "—",
      Motivo: form.motivo,
      Mensaje: form.mensaje.trim() || "—",
      Origen: "Soy desarrolladora",
    };
    try {
      const res = await fetch("https://formsubmit.co/ajax/contacto@departamentosenpozo.com.ar", {
        method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      setFase(res.ok && (data.success === true || data.success === "true") ? "ok" : "error");
    } catch { setFase("error"); }
  }

  if (fase === "ok") {
    return (
      <div className="border border-outline-variant rounded-2xl p-8 text-center bg-surface">
        <span className="material-symbols-outlined icon-fill text-[40px] text-green-600">check_circle</span>
        <h2 className="font-headline-sm text-headline-sm text-primary mt-2">¡Recibido, gracias!</h2>
        <p className="text-on-surface-variant text-[14px] mt-1 max-w-md mx-auto">Tomamos tu mensaje y te vamos a contactar para actualizar tus datos o coordinar. Cualquier corrección la aplicamos apenas la confirmes.</p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="border border-outline-variant rounded-2xl p-6 bg-surface flex flex-col gap-3.5">
      <div className="flex flex-col sm:flex-row gap-3.5">
        <label className="flex-1 block">
          <span className="text-[12px] text-on-surface-variant">Desarrolladora *</span>
          <input value={form.empresa} onChange={set("empresa")} required placeholder="Nombre de la empresa"
            className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface text-[14px] outline-none focus:border-secondary" />
        </label>
        <label className="flex-1 block">
          <span className="text-[12px] text-on-surface-variant">Tu nombre</span>
          <input value={form.nombre} onChange={set("nombre")} placeholder="Con quién hablamos"
            className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface text-[14px] outline-none focus:border-secondary" />
        </label>
      </div>

      <div className="flex flex-col sm:flex-row gap-3.5">
        <label className="flex-1 block">
          <span className="text-[12px] text-on-surface-variant">Email</span>
          <input value={form.email} onChange={set("email")} type="email" placeholder="tu@empresa.com"
            className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface text-[14px] outline-none focus:border-secondary" />
        </label>
        <label className="flex-1 block">
          <span className="text-[12px] text-on-surface-variant">WhatsApp</span>
          <input value={form.whatsapp} onChange={set("whatsapp")} placeholder="+54 9 11 …"
            className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface text-[14px] outline-none focus:border-secondary" />
        </label>
      </div>

      <label className="block">
        <span className="text-[12px] text-on-surface-variant">¿Qué necesitás?</span>
        <select value={form.motivo} onChange={set("motivo")}
          className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface text-[14px] outline-none focus:border-secondary">
          {MOTIVOS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </label>

      <label className="block">
        <span className="text-[12px] text-on-surface-variant">Mensaje (opcional)</span>
        <textarea value={form.mensaje} onChange={set("mensaje")} rows={3} placeholder="Contanos qué corregir, qué proyecto sumar o qué te gustaría conversar."
          className="w-full mt-1 px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface text-[14px] outline-none focus:border-secondary resize-none" />
      </label>

      <input value={gotcha} onChange={(e) => setGotcha(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      {fase === "error" && <p className="text-[13px] text-red-600">Necesitamos el nombre de la desarrolladora y un mail o WhatsApp. Revisá y probá de nuevo.</p>}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-[11px] text-on-surface-variant max-w-xs">Requerido: desarrolladora + un mail o WhatsApp. No compartimos tus datos con terceros.</p>
        <button type="submit" disabled={fase === "enviando"}
          className="inline-flex items-center justify-center gap-2 rounded bg-primary-container text-on-primary px-6 py-3 font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 transition-all disabled:opacity-60">
          {fase === "enviando" ? "Enviando…" : "Enviar"}
        </button>
      </div>
    </form>
  );
}
