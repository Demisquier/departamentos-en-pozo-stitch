// lib/barrios.js — Fuente ÚNICA de verdad de los barrios.
// Modelo canónico (una lista de objetos) + mapas/derivados para no romper los usos
// actuales. Reemplaza los ~8 mapas dispersos (BARRIO_CPT, BARRIO_NOMBRE, BARRIO_LABEL,
// BARRIO_URL, BARRIO_PAGE, BARRIO_ORDEN, BARRIOS, barrioNombre) que estaban en
// app/[slug], app/desarrolladoras-inmobiliarias-en-[barrio], app/page.jsx, DirectorioDevs,
// DirectorioInmo, Footer y novedades. CERO cambio de URLs, nombres ni SEO.

// Barrios con página propia /desarrolladoras-inmobiliarias-en-{slug}/.
//  - slug:    segmento de la URL de la página.
//  - nombre:  título visible ("Colegiales y Chacarita").
//  - cptKey:  clave con la que se guarda el barrio en el CPT (dev_barrios_key / barriosKey).
//  - aliases: otras claves del CPT que también apuntan a esta misma página (barrios agrupados).
//  - enHome + orden: si aparece (y en qué posición) en el bloque "Explorá por barrio" de la home.
// El ORDEN de este array = el orden visible del footer y del bloque "por barrio" de
// novedades (BARRIOS_PAGINA). El orden de la home es independiente (campo `orden`).
export const BARRIOS = [
  { slug: "palermo",              nombre: "Palermo",                cptKey: "palermo",       enHome: true, orden: 1 },
  { slug: "belgrano",             nombre: "Belgrano",               cptKey: "belgrano",      enHome: true, orden: 3 },
  { slug: "caballito",            nombre: "Caballito",              cptKey: "caballito",     enHome: true, orden: 2 },
  { slug: "nunez",                nombre: "Núñez",                  cptKey: "nunez",         enHome: true, orden: 5 },
  { slug: "puerto-madero",        nombre: "Puerto Madero",          cptKey: "puerto-madero", enHome: true, orden: 4 },
  { slug: "recoleta",             nombre: "Recoleta",               cptKey: "recoleta" },
  { slug: "villa-urquiza",        nombre: "Villa Urquiza",          cptKey: "villa-urquiza" },
  { slug: "colegiales-chacarita", nombre: "Colegiales y Chacarita", cptKey: "colegiales", aliases: ["chacarita"] },
  { slug: "saavedra-coghlan",     nombre: "Saavedra y Coghlan",     cptKey: "saavedra",   aliases: ["coghlan"] },
];

const bySlug = Object.fromEntries(BARRIOS.map((b) => [b.slug, b]));

// slug de página → clave del CPT.  (colegiales-chacarita → "colegiales", saavedra-coghlan → "saavedra")
export const BARRIO_CPT = Object.fromEntries(BARRIOS.map((b) => [b.slug, b.cptKey]));

// slug de página → nombre visible.
export const BARRIO_NOMBRE = Object.fromEntries(BARRIOS.map((b) => [b.slug, b.nombre]));

// Lista de slugs de página (para generateStaticParams de la ruta [barrio]).
export const BARRIOS_SLUGS = BARRIOS.map((b) => b.slug);

// [nombre, slug] de las 9 páginas de barrio (footer + bloque "por barrio" de novedades).
export const BARRIOS_PAGINA = BARRIOS.map((b) => [b.nombre, b.slug]);

// Barrios de la home: nombre → URL de la página, y el orden de aparición.
const enHome = BARRIOS.filter((b) => b.enHome).sort((a, b) => a.orden - b.orden);
export const BARRIO_PAGE = Object.fromEntries(
  enHome.map((b) => [b.nombre, `/desarrolladoras-inmobiliarias-en-${b.slug}/`])
);
export const BARRIO_ORDEN = enHome.map((b) => b.nombre);

// clave del CPT (o alias) → slug de página. Con esto los chips del hub son links navegables.
export const BARRIO_URL = Object.fromEntries(
  BARRIOS.flatMap((b) => [[b.cptKey, b.slug], ...(b.aliases || []).map((a) => [a, b.slug])])
);

// slug → nombre. Default "Buenos Aires"; title-case para slugs desconocidos.
export function barrioNombre(slug) {
  if (!slug) return "Buenos Aires";
  if (bySlug[slug]) return bySlug[slug].nombre;
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Etiqueta por clave (token) de barrio del CPT — chips del directorio de DESARROLLADORAS.
// Incluye claves sueltas sin página propia (colegiales, chacarita, saavedra, coghlan, retiro).
// Sirve a la vez de label y de WHITELIST de chips: agregar/quitar claves cambia qué chips
// se muestran, así que se mantiene idéntico al mapa original.
export const BARRIO_LABEL = {
  palermo: "Palermo", belgrano: "Belgrano", caballito: "Caballito", nunez: "Núñez",
  "puerto-madero": "Puerto Madero", "puerto madero": "Puerto Madero", recoleta: "Recoleta",
  "villa-urquiza": "Villa Urquiza", "villa urquiza": "Villa Urquiza", colegiales: "Colegiales",
  chacarita: "Chacarita", saavedra: "Saavedra", coghlan: "Coghlan", retiro: "Retiro",
};

// Etiqueta por clave de ZONA del directorio de INMOBILIARIAS. Vocabulario DISTINTO al de
// desarrolladoras (cubre barrios sin página de devs, ej. Almagro / Villa Devoto) y también
// funciona como whitelist de chips → se mantiene como mapa propio para no cambiar los chips.
export const ZONA_INMO_LABEL = {
  palermo: "Palermo", belgrano: "Belgrano", caballito: "Caballito", nunez: "Núñez",
  "puerto-madero": "Puerto Madero", recoleta: "Recoleta", "villa-urquiza": "Villa Urquiza",
  colegiales: "Colegiales", "barrio-norte": "Barrio Norte", almagro: "Almagro",
  "las-canitas": "Las Cañitas", "villa-devoto": "Villa Devoto", "palermo-chico": "Palermo Chico",
};

// Landings de CATÁLOGO por barrio (/departamentos-en-pozo-en-{slug}/): el listado de
// PROYECTOS pre-filtrado por barrio. Distinto de los directorios de empresas.
//  - label:  nombre visible / H1.
//  - match:  prefijos del campo `barrio` (viene del título "Nombre — Barrio", granular:
//            "Palermo Hollywood", "Palermo Soho"...). Un proyecto entra si su barrio
//            EMPIEZA con alguno de estos prefijos. Solo barrios con inventario suficiente.
export const BARRIO_CATALOGO = {
  // ── CABA ──
  "palermo":          { label: "Palermo",          match: ["Palermo"] },
  "caballito":        { label: "Caballito",        match: ["Caballito"] },
  "puerto-madero":    { label: "Puerto Madero",    match: ["Puerto Madero"] },
  "belgrano":         { label: "Belgrano",         match: ["Belgrano"] },
  "nunez":            { label: "Núñez",            match: ["Núñez", "Nuñez"] },
  "villa-urquiza":    { label: "Villa Urquiza",    match: ["Villa Urquiza"] },
  "colegiales":       { label: "Colegiales",       match: ["Colegiales"] },
  "coghlan":          { label: "Coghlan",          match: ["Coghlan"] },
  "saavedra":         { label: "Saavedra",         match: ["Saavedra"] },
  "almagro":          { label: "Almagro",          match: ["Almagro"] },
  "san-telmo":        { label: "San Telmo",        match: ["San Telmo"] },
  "villa-crespo":     { label: "Villa Crespo",     match: ["Villa Crespo"] },
  "villa-del-parque": { label: "Villa del Parque", match: ["Villa del Parque"] },
  "chacarita":        { label: "Chacarita",        match: ["Chacarita"] },
  "recoleta":         { label: "Recoleta",         match: ["Recoleta"] },
  "flores":           { label: "Flores",           match: ["Flores"] },
  "boedo":            { label: "Boedo",            match: ["Boedo"] },
  "villa-devoto":     { label: "Villa Devoto",     match: ["Villa Devoto"] },
  "villa-ortuzar":    { label: "Villa Ortúzar",    match: ["Villa Ortúzar", "Villa Ortuzar"] },
  "barracas":         { label: "Barracas",         match: ["Barracas"] },
  "monserrat":        { label: "Monserrat",        match: ["Monserrat", "Montserrat"] },
  "las-canitas":      { label: "Las Cañitas",      match: ["Las Cañitas", "Las Canitas"] },
  "floresta":         { label: "Floresta",         match: ["Floresta"] },
  "villa-luro":       { label: "Villa Luro",       match: ["Villa Luro"] },
  "villa-pueyrredon": { label: "Villa Pueyrredón", match: ["Villa Pueyrredón", "Villa Pueyrredon"] },
  "parque-chacabuco": { label: "Parque Chacabuco", match: ["Parque Chacabuco"] },
  "monte-castro":     { label: "Monte Castro",     match: ["Monte Castro"] },
  "parque-patricios": { label: "Parque Patricios", match: ["Parque Patricios"] },
  "barrio-norte":     { label: "Barrio Norte",     match: ["Barrio Norte"] },
  "san-cristobal":    { label: "San Cristóbal",    match: ["San Cristóbal", "San Cristobal"] },
  "agronomia":        { label: "Agronomía",        match: ["Agronomía", "Agronomia"] },
  "balvanera":        { label: "Balvanera",        match: ["Balvanera"] },
  "parque-chas":      { label: "Parque Chas",      match: ["Parque Chas"] },
  "retiro":           { label: "Retiro",           match: ["Retiro"] },
  "villa-santa-rita": { label: "Villa Santa Rita", match: ["Villa Santa Rita"] },
  // ── GBA (la zona se resuelve por zonaDeBarrio del label) ──
  "la-plata":         { label: "La Plata",         match: ["La Plata"] },
  "moron":            { label: "Morón",            match: ["Morón", "Moron"] },
  "vicente-lopez":    { label: "Vicente López",    match: ["Vicente López", "Vicente Lopez"] },
  "olivos":           { label: "Olivos",           match: ["Olivos"] },
  "nordelta":         { label: "Nordelta",         match: ["Nordelta"] },
  "wilde":            { label: "Wilde",            match: ["Wilde"] },
  "pilar":            { label: "Pilar",            match: ["Pilar"] },
  "quilmes":          { label: "Quilmes",          match: ["Quilmes"] },
  "lanus":            { label: "Lanús",            match: ["Lanús", "Lanus"] },
  "berazategui":      { label: "Berazategui",      match: ["Berazategui"] },
  "san-isidro":       { label: "San Isidro",       match: ["San Isidro"] },
  "san-fernando":     { label: "San Fernando",     match: ["San Fernando"] },
  "ramos-mejia":      { label: "Ramos Mejía",      match: ["Ramos Mejía", "Ramos Mejia"] },
  "avellaneda":       { label: "Avellaneda",       match: ["Avellaneda"] },
  "lomas-de-zamora":  { label: "Lomas de Zamora",  match: ["Lomas de Zamora"] },
  "adrogue":          { label: "Adrogué",          match: ["Adrogué", "Adrogue"] },
  "benavidez":        { label: "Benavídez",        match: ["Benavídez", "Benavidez"] },
  "puertos-del-lago": { label: "Puertos del Lago", match: ["Puertos del Lago"] },
};

// Barrios linderos (solo los que tienen landing de catálogo) para el bloque
// "Barrios cercanos" de cada landing por barrio → interlinking + navegación long-tail.
export const NEARBY_CATALOGO = {
  // CABA base
  "palermo":          ["colegiales", "villa-urquiza", "belgrano", "las-canitas"],
  "caballito":        ["almagro", "flores", "parque-chacabuco"],
  "puerto-madero":    ["san-telmo", "retiro"],
  "belgrano":         ["nunez", "colegiales", "coghlan", "villa-urquiza"],
  "nunez":            ["belgrano", "coghlan", "saavedra"],
  "villa-urquiza":    ["coghlan", "colegiales", "belgrano", "villa-pueyrredon"],
  "colegiales":       ["belgrano", "palermo", "coghlan", "chacarita"],
  "coghlan":          ["nunez", "belgrano", "villa-urquiza", "saavedra"],
  "saavedra":         ["nunez", "coghlan", "villa-pueyrredon"],
  "almagro":          ["caballito", "boedo", "balvanera", "villa-crespo"],
  "san-telmo":        ["puerto-madero", "monserrat", "barracas"],
  // CABA nuevos
  "villa-crespo":     ["chacarita", "almagro", "palermo", "villa-ortuzar"],
  "villa-del-parque": ["villa-devoto", "villa-santa-rita", "villa-pueyrredon", "monte-castro"],
  "chacarita":        ["villa-crespo", "colegiales", "villa-ortuzar", "palermo"],
  "recoleta":         ["barrio-norte", "retiro", "balvanera"],
  "flores":           ["floresta", "parque-chacabuco", "caballito"],
  "boedo":            ["almagro", "san-cristobal", "parque-patricios", "parque-chacabuco"],
  "villa-devoto":     ["villa-del-parque", "monte-castro", "villa-santa-rita"],
  "villa-ortuzar":    ["chacarita", "colegiales", "villa-crespo", "villa-urquiza"],
  "barracas":         ["parque-patricios", "san-telmo", "boedo"],
  "monserrat":        ["san-telmo", "balvanera", "san-cristobal", "retiro"],
  "las-canitas":      ["palermo", "belgrano", "colegiales"],
  "floresta":         ["flores", "monte-castro", "villa-luro", "villa-santa-rita"],
  "villa-luro":       ["floresta", "monte-castro", "villa-del-parque"],
  "villa-pueyrredon": ["villa-urquiza", "villa-del-parque", "saavedra"],
  "parque-chacabuco": ["flores", "boedo", "caballito", "parque-patricios"],
  "monte-castro":     ["villa-devoto", "floresta", "villa-luro", "villa-del-parque"],
  "parque-patricios": ["boedo", "barracas", "parque-chacabuco", "san-cristobal"],
  "barrio-norte":     ["recoleta", "palermo", "balvanera", "retiro"],
  "san-cristobal":    ["balvanera", "boedo", "monserrat", "parque-patricios"],
  "agronomia":        ["chacarita", "villa-ortuzar", "parque-chas"],
  "balvanera":        ["san-cristobal", "monserrat", "almagro", "recoleta"],
  "parque-chas":      ["villa-urquiza", "agronomia", "villa-ortuzar", "coghlan"],
  "retiro":           ["recoleta", "barrio-norte", "san-telmo", "monserrat"],
  "villa-santa-rita": ["villa-del-parque", "floresta", "monte-castro"],
  // GBA (clusters por zona)
  "moron":            ["ramos-mejia"],
  "ramos-mejia":      ["moron"],
  "vicente-lopez":    ["olivos", "san-isidro"],
  "olivos":           ["vicente-lopez", "san-isidro"],
  "san-isidro":       ["vicente-lopez", "olivos", "san-fernando"],
  "san-fernando":     ["san-isidro", "nordelta"],
  "nordelta":         ["benavidez", "san-fernando", "puertos-del-lago"],
  "benavidez":        ["nordelta", "puertos-del-lago"],
  "puertos-del-lago": ["nordelta", "benavidez"],
  "avellaneda":       ["wilde", "lanus", "quilmes"],
  "wilde":            ["avellaneda", "quilmes"],
  "quilmes":          ["berazategui", "wilde", "avellaneda"],
  "berazategui":      ["quilmes"],
  "lanus":            ["avellaneda", "lomas-de-zamora"],
  "lomas-de-zamora":  ["lanus", "adrogue"],
  "adrogue":          ["lomas-de-zamora"],
};

// ¿El barrio granular de un proyecto pertenece a la landing `slug`? Match con LÍMITE DE PALABRA:
// el barrio debe ser EXACTAMENTE el prefijo, o el prefijo seguido de separador (espacio, coma o
// paréntesis). Así "Palermo" matchea "Palermo Hollywood" pero "Flores" NO matchea "Floresta".
export function matchBarrioCatalogo(barrioProyecto, slug) {
  const conf = BARRIO_CATALOGO[slug];
  if (!conf) return false;
  const b = String(barrioProyecto || "").toLowerCase().trim();
  return conf.match.some((p) => {
    const pl = p.toLowerCase();
    return b === pl || b.startsWith(pl + " ") || b.startsWith(pl + ",") || b.startsWith(pl + "(");
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ZONAS: agrupar barrios crudos del catálogo por zona (selector estilo portal AR).
// El WP trae los barrios de GBA con formato irregular: a veces con sufijo "- GBA Norte/Sur/Oeste",
// a veces con el partido entre paréntesis o tras coma ("Adrogué (Almirante Brown)", "Benavídez, Tigre"),
// a veces el nombre pelado ("Olivos", "Quilmes"). Clasificamos por SUBSTRING contra tokens de partido/
// localidad conocidos. Orden de chequeo N→O→S; el sufijo "gba norte/sur/oeste" también es un token.
const _GBA_NORTE = ["gba norte", "vicente lopez", "san isidro", "san fernando", "tigre", "escobar", "pilar",
  "olivos", "florida", "martinez", "acassuso", "beccar", "victoria", "boulogne", "la lucila", "munro",
  "carapachay", "nordelta", "benavidez", "rincon de milberg", "maschwitz", "puertos del lago",
  "buena vista", "la calabria", "la horqueta", "malvinas argentinas", "san miguel", "jose c. paz"];
const _GBA_OESTE = ["gba oeste", "la matanza", "moron", "ituzaingo", "merlo", "moreno", "hurlingham",
  "tres de febrero", "ramos mejia", "haedo", "castelar", "el palomar"];
const _GBA_SUR = ["gba sur", "avellaneda", "lanus", "lomas de zamora", "quilmes", "berazategui",
  "almirante brown", "esteban echeverria", "ezeiza", "florencio varela", "adrogue", "banfield",
  "temperley", "bernal", "wilde", "ezpeleta", "canning", "valentin alsina"];
const ZONA_ORDEN = ["Capital Federal", "GBA · Zona Norte", "GBA · Zona Oeste", "GBA · Zona Sur", "GBA · La Plata", "Gran Buenos Aires"];
const _normZ = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

// Zona de un barrio crudo. Default Capital Federal (los barrios CABA no traen tokens de partido GBA).
export function zonaDeBarrio(label) {
  const s = _normZ(label);
  const has = (arr) => arr.some((t) => s.includes(t));
  if (has(_GBA_NORTE)) return "GBA · Zona Norte";
  if (has(_GBA_OESTE)) return "GBA · Zona Oeste";
  if (has(_GBA_SUR)) return "GBA · Zona Sur";
  if (s.includes("la plata")) return "GBA · La Plata";
  if (/\bgba\b/.test(s)) return "Gran Buenos Aires";
  return "Capital Federal";
}

// slug de landing propia para un barrio crudo (o null). Reutiliza el match de BARRIO_CATALOGO.
export function landingDeBarrio(label) {
  for (const slug of Object.keys(BARRIO_CATALOGO)) if (matchBarrioCatalogo(label, slug)) return slug;
  return null;
}

// zonificarBarrios(labels) → [{ zona, items: [{ label, slug|null }] }] ordenado por zona y
// alfabético dentro. Consolida barrios con landing (Palermo Hollywood/Soho/… → "Palermo").
export function zonificarBarrios(labels) {
  const grupos = new Map(); // zona -> Map(clave -> {label, slug})
  for (const raw of labels || []) {
    const label = String(raw || "").trim();
    if (!label) continue;
    const slug = landingDeBarrio(label);
    const canon = slug ? BARRIO_CATALOGO[slug].label : label;
    const zona = zonaDeBarrio(canon); // zona por el label canónico (sirve para landings CABA y GBA)
    const clave = _normZ(canon);
    if (!grupos.has(zona)) grupos.set(zona, new Map());
    if (!grupos.get(zona).has(clave)) grupos.get(zona).set(clave, { label: canon, slug });
  }
  const orden = [...ZONA_ORDEN, ...[...grupos.keys()].filter((z) => !ZONA_ORDEN.includes(z))];
  return orden.filter((z) => grupos.has(z)).map((zona) => ({
    zona,
    items: [...grupos.get(zona).values()].sort((a, b) => a.label.localeCompare(b.label, "es")),
  }));
}
