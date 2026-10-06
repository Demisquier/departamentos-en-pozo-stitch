"use client";
// Alta de inmobiliarias: dejan su contacto comercial y los proyectos que comercializan para
// recibir los leads directo. Queda pendiente hasta que lo aprobamos (anti-suplantación).
import { useState } from "react";

const cls = "w-full mt-1 px-3.5 py-2.5 rounded-lg border border-outline-variant bg-surface text-[14px] outline-none focus:border-secondary";

export default function SoyInmobiliariaForm() {
  const [f, setF] = useState({ firma: "", nombre: "", email: "", whatsapp: "", matricula: "", proyectos: "" });
  const [gotcha, setGotcha] = useState("");
  const [fase, setFase] = useState("idle");
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function enviar(e) {
    e.preventDefault();
    if (gotcha) return;
    if (!f.firma.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) { setFase("error"); return; }
    setFase("enviando");
    try {
      const r = await fetch("/api/soy-inmobiliaria", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, _gotcha: gotcha }) });
      setFase(r.ok ? "ok" : "error");
      try { window.gtag && window.gtag("event", "alta_inmobiliaria", { firma: f.firma }); } catch {}
    } catch { setFase("error"); }
  }

  if (fase === "ok") return (
    <div className="border border-outline-variant rounded-2xl p-8 text-center bg-surface">
      <span className="material-symbols-outlined icon-fill text-[40px] text-green-600">check_circle</span>
      <h2 className="font-headline-sm text-headline-sm text-primary mt-2">¡Recibido!</h2>
      <p className="text-on-surface-variant text-[14px] mt-1 max-w-md mx-auto">Verificamos los datos y, una vez aprobado, las consultas por tus proyectos te llegan directo a {f.email}.</p>
    </div>
  );

  return (
    <form onSubmit={enviar} className="border border-outline-variant rounded-2xl p-6 bg-surface flex flex-col gap-3.5">
      <div className="flex flex-col sm:flex-row gap-3.5">
        <label className="flex-1 block"><span className="text-[12px] text-on-surface-variant">Inmobiliaria *</span>
          <input value={f.firma} onChange={set("firma")} required placeholder="Nombre de la firma" className={cls} /></label>
        <label className="flex-1 block"><span className="text-[12px] text-on-surface-variant">Matrícula CUCICBA</span>
          <input value={f.matricula} onChange={set("matricula")} placeholder="N° de matrícula" className={cls} /></label>
      </div>
      <div className="flex flex-col sm:flex-row gap-3.5">
        <label className="flex-1 block"><span className="text-[12px] text-on-surface-variant">Email comercial * (donde recibís los leads)</span>
          <input value={f.email} onChange={set("email")} type="email" required placeholder="ventas@tuinmobiliaria.com" className={cls} /></label>
        <label className="flex-1 block"><span className="text-[12px] text-on-surface-variant">WhatsApp</span>
          <input value={f.whatsapp} onChange={set("whatsapp")} placeholder="+54 9 11 …" className={cls} /></label>
      </div>
      <label className="block"><span className="text-[12px] text-on-surface-variant">Tu nombre</span>
        <input value={f.nombre} onChange={set("nombre")} placeholder="Con quién hablamos" className={cls} /></label>
      <label className="block"><span className="text-[12px] text-on-surface-variant">Proyectos en pozo que comercializan</span>
        <textarea value={f.proyectos} onChange={set("proyectos")} rows={3} placeholder="Nombres o links de las fichas (uno por línea)" className={cls + " resize-none"} /></label>
      <input value={gotcha} onChange={(e) => setGotcha(e.target.value)} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {fase === "error" && <p className="text-[13px] text-red-600">Necesitamos el nombre de la inmobiliaria y un email válido.</p>}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <p className="text-[11px] text-on-surface-variant max-w-xs">Usamos estos datos solo para derivarte consultas de tus proyectos. Ver <a href="/politica-de-privacidad/" className="underline">privacidad</a>.</p>
        <button type="submit" disabled={fase === "enviando"} className="inline-flex items-center justify-center gap-2 rounded bg-primary-container text-on-primary px-6 py-3 font-label-caps text-label-caps uppercase tracking-wider hover:opacity-90 disabled:opacity-60">
          {fase === "enviando" ? "Enviando…" : "Quiero recibir los leads"}
        </button>
      </div>
    </form>
  );
}
