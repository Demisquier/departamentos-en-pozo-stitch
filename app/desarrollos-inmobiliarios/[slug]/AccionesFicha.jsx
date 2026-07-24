"use client";
import { useState, useMemo } from "react";

const fmtUSD = (n) => "USD " + Math.round(n).toLocaleString("es-AR");

// Sidebar sticky (precio + datos + calculadora) + modal de contacto + barra fija móvil.
// Todo interactivo vive acá para compartir el estado del modal entre el sidebar y la barra móvil.
export default function AccionesFicha({
  slug, nombre, precioLabel, precioNum, anticipoLabel, entrega, cuotas, ajuste, comparableNum,
}) {
  const [modal, setModal] = useState(false);
  const [asunto, setAsunto] = useState("cotizacion");

  const openModal = (a) => { setAsunto(a); setModal(true); };

  return (
    <>
      <div className="lg:sticky lg:top-24 space-y-4">
        {/* Card precio + CTAs */}
        <div className="border border-outline-variant rounded-xl p-6 bg-surface shadow-sm">
          <p className="font-label-caps text-label-caps text-on-surface-variant">DESDE</p>
          <p className="font-headline-md text-headline-md text-primary mb-1">
            {precioLabel}{precioNum ? <span className="text-body-md text-on-surface-variant"> /m²</span> : null}
          </p>

          <dl className="space-y-2 py-4 my-4 border-y border-outline-variant text-[14px]">
            {anticipoLabel && (
              <div className="flex justify-between gap-4"><dt className="text-on-surface-variant">Anticipo</dt><dd className="text-primary font-medium">{anticipoLabel}</dd></div>
            )}
            {entrega && (
              <div className="flex justify-between gap-4"><dt className="text-on-surface-variant">Entrega</dt><dd className="text-primary font-medium">{entrega}</dd></div>
            )}
            {(cuotas || ajuste) && (
              <div className="flex justify-between gap-4"><dt className="text-on-surface-variant">Cuotas</dt><dd className="text-primary font-medium text-right">{cuotas || `Ajuste ${ajuste}`}</dd></div>
            )}
          </dl>

          <button type="button" onClick={() => openModal("cotizacion")}
            className="w-full py-3.5 bg-link-gold text-white rounded-lg font-label-caps text-label-caps tracking-widest hover:brightness-110 transition-all flex justify-center items-center gap-2 mb-3">
            SOLICITAR COTIZACIÓN
          </button>
          <button type="button" onClick={() => openModal("visita")}
            className="w-full py-3.5 border border-primary text-primary rounded-lg font-label-caps text-label-caps tracking-widest hover:bg-surface-container transition-all flex justify-center items-center gap-2">
            AGENDAR VISITA
          </button>

          <p className="text-[12px] text-on-surface-variant leading-relaxed mt-4 flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] text-link-gold">info</span>
            Cuotas en pesos ajustables. Consultá descuentos por pago contado y disponibilidad de unidades.
          </p>
        </div>

        {/* La calculadora salió de acá: competía con el CTA. Ahora se renderiza en el
            cuerpo principal (ver page.jsx). El sidebar queda solo con precio + contacto. */}
      </div>

      {/* Barra fija móvil */}
      <div className="fixed bottom-0 left-0 w-full z-[60] p-3 bg-surface/90 backdrop-blur-md border-t border-outline-variant lg:hidden">
        <button type="button" onClick={() => openModal("cotizacion")}
          className="w-full px-8 py-3.5 bg-link-gold text-white rounded-lg font-label-caps text-label-caps tracking-widest shadow-lg flex items-center justify-center gap-3">
          QUIERO MÁS INFORMACIÓN
          <span className="material-symbols-outlined fill-icon">send</span>
        </button>
      </div>

      {modal && (
        <ModalContacto slug={slug} nombre={nombre} asunto={asunto} onClose={() => setModal(false)} />
      )}
    </>
  );
}

export function Calculadora({ precioNum, comparableNum }) {
  const [sup, setSup] = useState(40);
  const [precioM2, setPrecioM2] = useState(precioNum || 2500);
  const [antPct, setAntPct] = useState(30);
  const [cuotas, setCuotas] = useState(24);

  const r = useMemo(() => {
    const s = Math.max(0, Number(sup) || 0);
    const pm = Math.max(0, Number(precioM2) || 0);
    const ap = Math.min(100, Math.max(0, Number(antPct) || 0));
    const nc = Math.max(1, Number(cuotas) || 1);
    const total = s * pm;
    const anticipo = total * (ap / 100);
    const saldo = total - anticipo;
    const cuotaMes = saldo / nc;
    const terminado = comparableNum ? s * comparableNum : null;
    const upside = terminado != null ? terminado - total : null;
    const upsidePct = terminado != null && total > 0 ? (upside / total) * 100 : null;
    return { total, anticipo, saldo, cuotaMes, terminado, upside, upsidePct };
  }, [sup, precioM2, antPct, cuotas, comparableNum]);

  const Field = ({ label, value, setValue, suffix, min, max, step }) => (
    <label className="block">
      <span className="text-[12px] text-on-surface-variant">{label}</span>
      <div className="flex items-center border border-outline-variant rounded-lg mt-1 overflow-hidden focus-within:border-link-gold">
        <input type="number" value={value} min={min} max={max} step={step}
          onChange={(e) => setValue(e.target.value)}
          className="w-full px-3 py-2 text-[14px] text-primary outline-none bg-white" />
        {suffix && <span className="px-3 text-[12px] text-on-surface-variant bg-surface-container whitespace-nowrap self-stretch flex items-center">{suffix}</span>}
      </div>
    </label>
  );

  return (
    <div className="border border-outline-variant rounded-xl p-6 bg-surface shadow-sm">
      <h3 className="font-headline-sm text-headline-sm text-primary mb-1 flex items-center gap-2">
        <span className="material-symbols-outlined text-link-gold">calculate</span> Calculadora de inversión
      </h3>
      <p className="text-[12px] text-on-surface-variant mb-4">Estimá tu plan de pago. Valores orientativos en USD.</p>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Superficie" value={sup} setValue={setSup} suffix="m²" min={10} max={500} step={1} />
        <Field label="Precio m²" value={precioM2} setValue={setPrecioM2} suffix="USD" min={100} step={50} />
        <Field label="Anticipo" value={antPct} setValue={setAntPct} suffix="%" min={0} max={100} step={5} />
        <Field label="Cuotas" value={cuotas} setValue={setCuotas} suffix="meses" min={1} max={120} step={1} />
      </div>

      <dl className="mt-5 space-y-2 text-[14px]">
        <div className="flex justify-between"><dt className="text-on-surface-variant">Precio total</dt><dd className="text-primary font-semibold">{fmtUSD(r.total)}</dd></div>
        <div className="flex justify-between"><dt className="text-on-surface-variant">Anticipo</dt><dd className="text-primary font-medium">{fmtUSD(r.anticipo)}</dd></div>
        <div className="flex justify-between"><dt className="text-on-surface-variant">Saldo en cuotas</dt><dd className="text-primary font-medium">{fmtUSD(r.saldo)}</dd></div>
        <div className="flex justify-between items-baseline pt-2 mt-1 border-t border-outline-variant">
          <dt className="text-primary font-medium">Cuota mensual</dt>
          <dd className="text-link-gold font-headline-sm text-headline-sm">{fmtUSD(r.cuotaMes)}</dd>
        </div>
      </dl>

      {r.terminado != null && (
        <div className="mt-4 pt-4 border-t border-outline-variant">
          <div className="flex justify-between text-[13px]"><dt className="text-on-surface-variant">Valor estimado terminado</dt><dd className="text-primary font-medium">{fmtUSD(r.terminado)}</dd></div>
          <div className="flex justify-between items-baseline mt-1">
            <span className="text-[13px] text-on-surface-variant">Upside potencial</span>
            <span className={`font-semibold ${r.upside >= 0 ? "text-green-700" : "text-red-700"}`}>
              {r.upside >= 0 ? "+" : ""}{fmtUSD(r.upside)} ({r.upsidePct >= 0 ? "+" : ""}{Math.round(r.upsidePct)}%)
            </span>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-2">Diferencia estimada vs. un usado terminado comparable en la zona. No es una garantía de revalorización.</p>
        </div>
      )}
    </div>
  );
}

function ModalContacto({ slug, nombre, asunto, onClose }) {
  const [form, setForm] = useState({
    nombre: "", email: "", whatsapp: "",
    mensaje: asunto === "visita" ? `Quiero agendar una visita a ${nombre}.` : `Quiero recibir la cotización y disponibilidad de ${nombre}.`,
    proyecto: slug, origen: "ficha:" + slug, _gotcha: "",
  });
  const [status, setStatus] = useState("idle");

  const change = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contacto", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("bad");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-surface w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-outline-variant sticky top-0 bg-surface">
          <h3 className="font-headline-sm text-headline-sm text-primary">
            {asunto === "visita" ? "Agendar visita" : "Solicitar cotización"}
          </h3>
          <button type="button" onClick={onClose} className="p-1 text-on-surface-variant hover:text-primary" aria-label="Cerrar">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {status === "sent" ? (
          <div className="p-8 text-center">
            <span className="material-symbols-outlined text-5xl text-green-600">check_circle</span>
            <p className="font-headline-sm text-headline-sm text-primary mt-3">¡Consulta enviada!</p>
            <p className="text-body-md text-on-surface-variant mt-1">Te contactamos a la brevedad por {nombre}.</p>
            <button type="button" onClick={onClose} className="mt-5 px-6 py-2.5 bg-primary-container text-on-primary rounded-lg font-label-caps text-label-caps">CERRAR</button>
          </div>
        ) : (
          <form onSubmit={submit} className="p-5 space-y-3">
            <p className="text-[13px] text-on-surface-variant">Sobre <span className="text-primary font-medium">{nombre}</span>. Dejanos tus datos y te respondemos con precios y disponibilidad.</p>
            <input name="nombre" value={form.nombre} onChange={change} required placeholder="Nombre y apellido *"
              className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-[14px] outline-none focus:border-link-gold bg-white" />
            <input name="email" type="email" value={form.email} onChange={change} placeholder="Email"
              className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-[14px] outline-none focus:border-link-gold bg-white" />
            <input name="whatsapp" value={form.whatsapp} onChange={change} placeholder="WhatsApp / teléfono"
              className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-[14px] outline-none focus:border-link-gold bg-white" />
            <textarea name="mensaje" value={form.mensaje} onChange={change} rows={3}
              className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-[14px] outline-none focus:border-link-gold bg-white resize-none" />
            {/* honeypot */}
            <input type="text" name="_gotcha" value={form._gotcha} onChange={change} tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
            <p className="text-[11px] text-on-surface-variant">Requerido: nombre + email o teléfono.</p>
            {status === "error" && <p className="text-[13px] text-red-700">No se pudo enviar. Probá de nuevo o escribinos a contacto@departamentosenpozo.com.ar.</p>}
            <button type="submit" disabled={status === "sending"}
              className="w-full py-3 bg-link-gold text-white rounded-lg font-label-caps text-label-caps tracking-widest hover:brightness-110 transition-all disabled:opacity-60">
              {status === "sending" ? "ENVIANDO…" : "ENVIAR CONSULTA"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
