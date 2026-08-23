"use client";
import { useState, useMemo, useRef } from "react";
import { track } from "../../../lib/track";
import AsesorModal from "../../asesor/AsesorModal";

const fmtUSD = (n) => "USD " + Math.round(n).toLocaleString("es-AR");

// Sidebar sticky (precio + datos + calculadora) + barra fija móvil. El CTA "Quiero más info"
// abre el asesor como MODAL sobre la ficha (sin perder la navegación).
export default function AccionesFicha({
  slug, nombre, precioHeroLabel, precioDesdeNum, refM2Label, cuotaEstim, anticipoLabel, entrega, cuotas, ajuste, comparableNum,
}) {
  const [asesorOpen, setAsesorOpen] = useState(false);

  return (
    <>
      <div className="lg:sticky lg:top-24 space-y-4">
        {/* Card precio + CTAs */}
        <div className="border border-outline-variant rounded-xl p-6 bg-surface shadow-sm">
          <p className="font-label-caps text-label-caps text-on-surface-variant">PRECIO</p>
          <p className="font-headline-md text-headline-md text-primary mb-1">{precioHeroLabel}</p>
          {cuotaEstim ? <p className="text-body-md text-secondary font-medium mb-1">≈ {cuotaEstim}</p> : null}
          {refM2Label ? <p className="text-[13px] text-on-surface-variant mb-1">Referencia: {refM2Label}</p> : null}

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

          <p className="text-[12px] text-on-surface-variant mb-2 flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[15px] text-green-700">bolt</span>
            Respondemos en el día · Sin costo · Análisis independiente
          </p>
          <button type="button" onClick={() => setAsesorOpen(true)}
            className="w-full py-3.5 bg-primary-container text-on-primary rounded font-label-caps text-label-caps tracking-widest hover:opacity-90 transition-all flex justify-center items-center gap-2">
            VER PRECIOS Y DISPONIBILIDAD
            <span className="material-symbols-outlined text-[18px]">forum</span>
          </button>

          <p className="text-[12px] text-on-surface-variant leading-relaxed mt-4 flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] text-link-gold">info</span>
            Te hacemos unas preguntas rápidas y te pasamos precios, disponibilidad y opciones a tu medida — sin compromiso.
          </p>
        </div>

        {/* La calculadora salió de acá: competía con el CTA. Ahora se renderiza en el
            cuerpo principal (ver page.jsx). El sidebar queda solo con precio + contacto. */}
      </div>

      {/* Barra fija móvil */}
      <div className="fixed bottom-0 left-0 w-full z-[60] p-3 bg-surface/90 backdrop-blur-md border-t border-outline-variant lg:hidden">
        <button type="button" onClick={() => setAsesorOpen(true)}
          className="w-full px-8 py-3.5 bg-primary-container text-on-primary rounded font-label-caps text-label-caps tracking-widest shadow-lg flex items-center justify-center gap-3">
          VER PRECIOS Y DISPONIBILIDAD
          <span className="material-symbols-outlined fill-icon">send</span>
        </button>
      </div>

      {asesorOpen && <AsesorModal nombre={nombre} slug={slug} onClose={() => setAsesorOpen(false)} />}
    </>
  );
}

export function Calculadora({ precioNum, comparableNum }) {
  const [sup, setSup] = useState(40);
  const [precioM2, setPrecioM2] = useState(precioNum || 2500);
  const [antPct, setAntPct] = useState(30);
  const [cuotas, setCuotas] = useState(24);
  const tracked = useRef(false);
  const mark = () => { if (!tracked.current) { tracked.current = true; track("calc_use"); } };

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
      <div className="flex items-center border border-outline-variant rounded-lg mt-1 overflow-hidden focus-within:border-secondary">
        <input type="number" value={value} min={min} max={max} step={step}
          onChange={(e) => { mark(); setValue(e.target.value); }}
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
          <dt className="text-primary font-medium">Cuota inicial estimada</dt>
          <dd className="text-secondary font-headline-sm text-headline-sm">{fmtUSD(r.cuotaMes)}</dd>
        </div>
      </dl>
      <p className="text-[11px] text-on-surface-variant mt-2 leading-snug">
        Cuota inicial orientativa. En pozo, las cuotas suelen <strong>ajustar por CAC</strong> (índice de la construcción) durante la obra, así que el valor sube con el tiempo.{" "}
        <a href="/simulador-cuota-cac-pozo/" className="text-secondary font-medium hover:underline">Simular el ajuste CAC →</a>
      </p>

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

