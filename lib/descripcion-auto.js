// lib/descripcion-auto.js — Genera una descripción de calidad para fichas de
// desarrollo cuyo content.rendered viene pobre (<200 chars), a partir de los datos
// estructurados que ya trae el nodo (barrio, dirección, precio, tipologías, entrega,
// amenities, desarrolladora/comercializadora, estado de obra). Determinístico y
// variado por slug para que no se lean todas iguales. NO inventa datos: solo arma
// prosa con lo que existe. Enfoque inversor (pozo), tono AR.

function _acf(n, k) {
  const a = (n && n.acf) || {};
  const v = a[k];
  return typeof v === "string" ? v.trim() : v;
}
function _h(slug, mod) {
  let s = 0;
  for (let i = 0; i < slug.length; i++) s = (s * 31 + slug.charCodeAt(i)) >>> 0;
  return s % mod;
}
function _money(v) {
  const n = parseInt(String(v).replace(/[^\d]/g, ""), 10);
  if (!n || isNaN(n)) return null;
  return "USD " + n.toLocaleString("es-AR").replace(/,/g, ".");
}
function _year(v) {
  if (!v) return null;
  const m = String(v).match(/20\d{2}/);
  return m ? m[0] : null;
}
function _tipos(v) {
  let t = Array.isArray(v) ? v.map((x) => String(x).replace(/_/g, " ")).join(", ") : (v ? String(v).trim() : null);
  if (!t) return null;
  if (!/amb|monoambiente|estudio|dormitor|suite|loft|ph|oficina|local|duplex|semipiso/i.test(t)) t = t + " ambientes";
  return t;
}
function _amen(v) {
  let s = Array.isArray(v) ? v.join(", ") : String(v || "").trim();
  s = s.replace(/\.\s*$/, "");
  return s ? s.charAt(0).toLowerCase() + s.slice(1) : s;
}
function _cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

export function generarDescripcion(n) {
  if (!n) return null;
  const slug = n.slug || "";
  const nombre = ((n.title && n.title.rendered) || "").split("—")[0].trim() || "Este emprendimiento";
  const barrio = (n.barrio || "").trim();
  const direccion = _acf(n, "direccion");
  const dev = _acf(n, "desarrolladora") || _acf(n, "constructora") || _acf(n, "comercializadora");
  const precio = _acf(n, "precio_desde");
  const pm2 = _acf(n, "precio_m2");
  const tp = _tipos(_acf(n, "tipologias"));
  const entrega = _year(_acf(n, "fecha_entrega"));
  const estadoRaw = (_acf(n, "estado_obra") || _acf(n, "estado") || "");
  const avance = _acf(n, "avance_obra");
  const amen = _acf(n, "amenities");
  const anticipo = _acf(n, "anticipo");
  const cuotas = _acf(n, "esquema_cuotas") || _acf(n, "esquema_pago");
  const comp = _acf(n, "comparable_terminado");

  const P = [];
  const loc = barrio ? "en " + barrio : "en CABA";
  const dirTxt = direccion ? ", sobre " + direccion + "," : "";
  let p1 = [
    "<strong>" + nombre + "</strong> es un emprendimiento en pozo ubicado " + loc + dirTxt + " dentro del mercado de departamentos en construcción de Buenos Aires.",
    "<strong>" + nombre + "</strong> es un proyecto de obra nueva " + loc + dirTxt + " orientado a quienes buscan invertir en pozo en la Ciudad de Buenos Aires.",
    "Ubicado " + loc + dirTxt + " <strong>" + nombre + "</strong> es un desarrollo en pozo pensado para comprar en etapa de construcción con precio de entrada por debajo del terminado.",
  ][_h(slug, 3)];
  if (dev) p1 += " El proyecto es " + (_h(slug, 2) ? "comercializado" : "desarrollado") + " por " + dev + ".";
  P.push("<p>" + p1 + "</p>");

  const prod = [];
  if (tp) prod.push("Ofrece tipologías de " + tp);
  if (amen) prod.push((prod.length ? "con amenities de " : "Cuenta con amenities de ") + _amen(amen));
  if (estadoRaw || avance) {
    const el = estadoRaw.toLowerCase();
    let est;
    if (el.indexOf("pozo") >= 0) est = "en etapa de pozo (preventa)";
    else if (el.indexOf("construc") >= 0 || el.indexOf("obra") >= 0) est = "en construcción";
    else if (el.indexOf("termin") >= 0 || el.indexOf("entrega") >= 0) est = "terminado/en entrega";
    else if (el.indexOf("lanz") >= 0 || el.indexOf("prox") >= 0 || el.indexOf("próx") >= 0) est = "en lanzamiento";
    else est = estadoRaw ? el : "en construcción";
    const av = avance && est.indexOf(String(avance).toLowerCase()) < 0 ? " (avance de obra: " + avance + ")" : "";
    prod.push((prod.length ? "y hoy se encuentra " : "La obra se encuentra ") + est + av);
  }
  if (prod.length) P.push("<p>" + _cap(prod.join(", ")) + ".</p>");

  const inv = [];
  const pv = _money(precio);
  if (pv) inv.push("El valor de ingreso arranca en " + pv);
  if (pm2) { const pm = _money(pm2); if (pm) inv.push((inv.length ? "con un precio de referencia de " : "El precio ronda ") + pm + " por m²"); }
  if (entrega) inv.push((inv.length ? "y la entrega está prevista para " : "La entrega está prevista para ") + entrega);
  const pago = [];
  if (anticipo) pago.push("anticipo " + anticipo);
  if (cuotas) pago.push(String(cuotas));
  if (inv.length) {
    let s = _cap(inv.join(", "));
    if (pago.length) s += ". La forma de pago contempla " + pago.join(", ");
    P.push("<p>" + s + ".</p>");
  } else if (pago.length) {
    P.push("<p>La forma de pago contempla " + pago.join(", ") + ".</p>");
  }

  let close = [
    "Comprar en pozo permite acceder a un precio por m² menor al de una unidad terminada y capturar la valorización durante la obra, a cambio de asumir el plazo y el riesgo de construcción.",
    "La inversión en pozo se apoya en la brecha de precio frente al usado terminado: se paga en cuotas durante la obra y se busca la revalorización a la entrega.",
    "En pozo, el diferencial de precio contra el terminado es el principal motor de retorno; conviene validar avance de obra, estructura (fideicomiso) y trayectoria de quien construye.",
  ][_h(slug + "z", 3)];
  if (comp) close += " Referencia de comparación con el terminado del barrio: " + comp + ".";
  close += " En Departamentos en Pozo analizamos cada proyecto con datos de fuentes públicas; verificá precio y disponibilidad final con la desarrolladora antes de decidir.";
  P.push("<p>" + close + "</p>");

  return P.join("");
}
