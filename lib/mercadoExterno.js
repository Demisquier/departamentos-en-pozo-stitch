// lib/mercadoExterno.js — Datos de mercado de TERCEROS, citados con fuente y mes.
// Actualizar a mano cuando sale un nuevo Index (mensual). Nunca inventar cifras: cada valor sale
// del informe enlazado en `url`.
export const MERCADO = {
  fuente: "Index Zonaprop CABA",
  mes: "octubre 2026",
  url: "https://www.zonaprop.com.ar/blog/wp-content/uploads/2026/11/INDEX_CABA_REPORTE_2026-10.pdf",
  usadoM2: 2493,          // USD/m² medio de departamentos en venta en CABA
  monoUsd: 111000,        // monoambiente medio 40 m² (venta)
  dosAmbUsd: 132000,      // 2 ambientes 50 m²
  tresAmbUsd: 181000,     // 3 ambientes 70 m²
  monoAlq: 786735,        // ARS/mes monoambiente 40 m²
  dosAmbAlq: 909058,      // ARS/mes 2 ambientes 50 m²
  rentaCaba: 5.74,        // % bruto anual (relación alquiler/precio)
  aniosRecupero: 17.4,
  // Retorno bruto anual por región de la ciudad (mismo informe, página "Retorno anual del alquiler").
  rentaRegion: [
    ["Sur", 9.1], ["Sur-Este", 6.7], ["Oeste", 6.6], ["Macrocentro", 6.5], ["Eje Central", 6.3],
    ["Noroeste", 5.8], ["Corredor Noroeste", 5.5], ["Corredor Norte", 4.8],
  ],
  rentaMax: ["Lugano", 9.6],
  rentaMin: ["Puerto Madero", 3.3],
  topRenta: ["Lugano", "Nueva Pompeya"],
};
