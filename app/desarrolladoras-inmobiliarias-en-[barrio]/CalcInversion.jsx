"use client";
import { useState, useMemo } from "react";

const fmtUSD = (n) => "USD " + Math.round(n).toLocaleString("es-AR");

// Calculadora de inversión en pozo (client). Prefill con el precio/m² promedio real del barrio.
export default function CalcInversion({ precioM2Default = 2500, barrio = "el barrio" }) {
  const [sup, setSup] = useState(45);
  const [precioM2, setPrecioM2] = useState(precioM2Default || 2500);
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
    return { total, anticipo, saldo, cuotaMes };
  }, [sup, precioM2, antPct, cuotas]);

  const Field = ({ label, value, setValue, suffix, min, max, step }) => (
    <label className="block">
      <span className="text-[12px] text-on-surface-variant">{label}</span>
      <div className="flex items-center border border-outline-variant rounded-lg mt-1 overflow-hidden focus-within:border-link-gold bg-white">
        <input type="number" value={value} min={min} max={max} step={step}
          onChange={(e) => setValue(e.target.value)}
          className="w-full px-3 py-2 text-[14px] text-primary outline-none bg-white" />
        {suffix && <span className="px-3 text-[12px] text-on-surface-variant bg-surface-container self-stretch flex items-center whitespace-nowrap">{suffix}</span>}
      </div>
    </label>
  );

  return (
    <div className="bg-surface border border-outline-variant rounded-xl p-6 md:p-8">
      <h3 className="text-headline-sm font-headline-sm text-primary mb-1 flex items-center gap-2">
        <span className="material-symbols-outlined text-link-gold">calculate</span>
        Calculá tu inversión en {barrio}
      </h3>
      <p className="text-[13px] text-on-surface-variant mb-5">Estimá tu plan de pago con valores del barrio. Orientativo, en USD.</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Field label="Superficie" value={sup} setValue={setSup} suffix="m²" min={10} max={500} step={1} />
        <Field label="Precio m²" value={precioM2} setValue={setPrecioM2} suffix="USD" min={100} step={50} />
        <Field label="Anticipo" value={antPct} setValue={setAntPct} suffix="%" min={0} max={100} step={5} />
        <Field label="Cuotas" value={cuotas} setValue={setCuotas} suffix="meses" min={1} max={120} step={1} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-outline-variant text-center">
        <div><span className="block text-[11px] text-on-surface-variant uppercase tracking-wide">Precio total</span><span className="text-headline-sm font-headline-sm text-primary">{fmtUSD(r.total)}</span></div>
        <div><span className="block text-[11px] text-on-surface-variant uppercase tracking-wide">Anticipo</span><span className="text-headline-sm font-headline-sm text-primary">{fmtUSD(r.anticipo)}</span></div>
        <div><span className="block text-[11px] text-on-surface-variant uppercase tracking-wide">Saldo en cuotas</span><span className="text-headline-sm font-headline-sm text-primary">{fmtUSD(r.saldo)}</span></div>
        <div><span className="block text-[11px] text-on-surface-variant uppercase tracking-wide">Cuota mensual</span><span className="text-headline-sm font-headline-sm text-link-gold">{fmtUSD(r.cuotaMes)}</span></div>
      </div>
      <p className="mt-4 text-[11px] text-on-surface-variant">El saldo suele pesificarse y ajustarse por índice CAC hasta la entrega. No constituye asesoramiento financiero.</p>
    </div>
  );
}
