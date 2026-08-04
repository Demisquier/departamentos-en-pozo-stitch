'use client';

import { useState, useMemo } from 'react';

// Simulador conceptual: proyecta cómo evoluciona la cuota si ajusta por un índice
// de construcción (CAC/ICC). Es una estimacion direccional, NO una cotizacion.
export default function SimuladorCAC() {
  const [monto, setMonto] = useState(100000);   // monto a financiar (USD)
  const [cuotas, setCuotas] = useState(24);      // cantidad de cuotas
  const [ajuste, setAjuste] = useState(2);       // ajuste mensual estimado (%)

  const r = useMemo(() => {
    const m = Math.max(0, Number(monto) || 0);
    const n = Math.max(1, Math.min(240, Math.round(Number(cuotas) || 1)));
    const a = Math.max(0, Number(ajuste) || 0) / 100;
    const base = m / n;                          // cuota base (sin ajuste)
    let total = 0;
    const serie = [];
    for (let i = 1; i <= n; i++) {
      const c = base * Math.pow(1 + a, i - 1);
      total += c;
      serie.push({ i, c });
    }
    const hitos = [1, 3, 6, 12, 24, n].filter((v, idx, arr) => v <= n && arr.indexOf(v) === idx);
    return {
      base, n, cuotaInicial: serie[0]?.c || 0, cuotaFinal: serie[n - 1]?.c || 0,
      total, sinAjuste: base * n,
      filas: hitos.map((h) => serie[h - 1]),
    };
  }, [monto, cuotas, ajuste]);

  const fmt = (v) => 'USD ' + Math.round(v).toLocaleString('es-AR');

  const reset = () => { setMonto(100000); setCuotas(24); setAjuste(2); };

  return (
    <div className="border border-outline-variant rounded-lg p-5 md:p-7 bg-surface">
      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <label className="flex flex-col gap-1.5 text-[13px] text-on-surface-variant">
          Monto a financiar (USD)
          <input type="number" min="0" step="1000" value={monto} onChange={(e) => setMonto(e.target.value)}
            className="border border-outline-variant rounded px-3 py-2.5 text-[15px] text-primary bg-white outline-none focus:border-secondary" />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] text-on-surface-variant">
          Cantidad de cuotas
          <input type="number" min="1" max="240" step="1" value={cuotas} onChange={(e) => setCuotas(e.target.value)}
            className="border border-outline-variant rounded px-3 py-2.5 text-[15px] text-primary bg-white outline-none focus:border-secondary" />
        </label>
        <label className="flex flex-col gap-1.5 text-[13px] text-on-surface-variant">
          Ajuste mensual estimado (%)
          <input type="number" min="0" step="0.1" value={ajuste} onChange={(e) => setAjuste(e.target.value)}
            className="border border-outline-variant rounded px-3 py-2.5 text-[15px] text-primary bg-white outline-none focus:border-secondary" />
        </label>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          ['Cuota inicial', fmt(r.cuotaInicial)],
          ['Cuota final', fmt(r.cuotaFinal)],
          ['Total con ajuste', fmt(r.total)],
          ['Total sin ajuste', fmt(r.sinAjuste)],
        ].map(([k, v]) => (
          <div key={k} className="border border-outline-variant rounded-lg p-3.5">
            <div className="text-[12px] text-on-surface-variant">{k}</div>
            <div className="text-[18px] font-semibold text-primary mt-1 leading-tight">{v}</div>
          </div>
        ))}
      </div>

      {/* Tabla de evolucion */}
      <div className="overflow-x-auto">
        <table className="w-full text-[14px] border-collapse">
          <thead>
            <tr className="text-left text-on-surface-variant">
              <th className="border border-outline-variant px-3 py-2 font-medium">Cuota N°</th>
              <th className="border border-outline-variant px-3 py-2 font-medium">Valor estimado</th>
              <th className="border border-outline-variant px-3 py-2 font-medium">Var. vs inicial</th>
            </tr>
          </thead>
          <tbody>
            {r.filas.map((f) => (
              <tr key={f.i}>
                <td className="border border-outline-variant px-3 py-2 text-primary">{f.i}{f.i === r.n ? ' (última)' : ''}</td>
                <td className="border border-outline-variant px-3 py-2 text-primary">{fmt(f.c)}</td>
                <td className="border border-outline-variant px-3 py-2 text-on-surface-variant">
                  {r.cuotaInicial ? '+' + Math.round((f.c / r.cuotaInicial - 1) * 100) + '%' : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-5 gap-4 flex-wrap">
        <p className="text-[12px] text-on-surface-variant max-w-xl">
          Estimacion direccional. El CAC/ICC se aplica en <strong>pesos</strong>: el impacto real en dolares
          depende de cómo se mueva el tipo de cambio frente al índice. No es una cotización.
        </p>
        <button onClick={reset} className="text-[13px] text-secondary underline underline-offset-2 shrink-0">Reiniciar</button>
      </div>
    </div>
  );
}
