/** next.config.js
 *  - trailingSlash: true  => replica EXACTA de las URLs de WordPress (que usan barra final).
 *    Esto es CLAVE para no romper SEO: /contacto/ sigue siendo /contacto/.
 *  - redirects(): acá van SOLO las URLs que cambien. Hoy el plan es preservar todo 1:1,
 *    así que el array está listo para sumar redirects 301 si algo se renombra.
 *  - images.remotePatterns: permite servir las imágenes que hoy viven en tu WordPress.
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  // output:'export' => genera HTML estático abrible sin servidor (para preview local).
  // En Vercel se puede quitar para usar ISR/SSR. Controlado por env EXPORT=1.
  ...(process.env.EXPORT ? { output: "export" } : {}),
  images: {
    unoptimized: true,
    remotePatterns: [
      // WordPress eliminado: las imágenes son locales (/public). Sólo queda el host de
      // placeholders Stitch (a reemplazar por imágenes propias).
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  async redirects() {
    return [
      // Los posts viven en la raíz (como en WordPress). Si algún link viejo apunta a
      // /novedades/{slug}, lo mandamos con 301 a /{slug} para no duplicar contenido.
      { source: "/novedades/:slug", destination: "/:slug", permanent: true },

      // --- Redirects legacy del WordPress viejo (evitan 404) ---
      // NOTA: /feed/ y /comments/feed/ NO se redirigen: /feed/ sirve RSS real
      // (Route Handler en app/feed/route.js).
      // Páginas de autor: no existen en el front nuevo → home.
      { source: "/author/:slug", destination: "/", permanent: true },
      // Archivos de tag: no hay páginas de tag → índice de novedades.
      { source: "/tag/:slug", destination: "/novedades/", permanent: true },

      // --- Barrios: las viejas taxonomías /barrio/{x}/ del WP daban 404 en el front
      // headless pero seguían indexadas y con tráfico en Google. Las mandamos 301 a la
      // página curada de desarrolladoras de ese barrio (recupera tráfico + link equity). ---
      { source: "/barrio/palermo", destination: "/desarrolladoras-inmobiliarias-en-palermo/", permanent: true },
      { source: "/barrio/palermo/", destination: "/desarrolladoras-inmobiliarias-en-palermo/", permanent: true },
      { source: "/barrio/belgrano", destination: "/desarrolladoras-inmobiliarias-en-belgrano/", permanent: true },
      { source: "/barrio/belgrano/", destination: "/desarrolladoras-inmobiliarias-en-belgrano/", permanent: true },
      { source: "/barrio/caballito", destination: "/desarrolladoras-inmobiliarias-en-caballito/", permanent: true },
      { source: "/barrio/caballito/", destination: "/desarrolladoras-inmobiliarias-en-caballito/", permanent: true },
      { source: "/barrio/nunez", destination: "/desarrolladoras-inmobiliarias-en-nunez/", permanent: true },
      { source: "/barrio/nunez/", destination: "/desarrolladoras-inmobiliarias-en-nunez/", permanent: true },
      { source: "/barrio/puerto-madero", destination: "/desarrolladoras-inmobiliarias-en-puerto-madero/", permanent: true },
      { source: "/barrio/puerto-madero/", destination: "/desarrolladoras-inmobiliarias-en-puerto-madero/", permanent: true },
      { source: "/barrio/villa-urquiza", destination: "/desarrolladoras-inmobiliarias-en-villa-urquiza/", permanent: true },
      { source: "/barrio/villa-urquiza/", destination: "/desarrolladoras-inmobiliarias-en-villa-urquiza/", permanent: true },
      { source: "/barrio/colegiales", destination: "/desarrolladoras-inmobiliarias-en-colegiales-chacarita/", permanent: true },
      { source: "/barrio/colegiales/", destination: "/desarrolladoras-inmobiliarias-en-colegiales-chacarita/", permanent: true },

      // --- Renombre de landings de catálogo por barrio (consistencia con el pilar
      // /desarrollos-inmobiliarios/): /departamentos-en-pozo-en-{barrio}/ →
      // /desarrollos-inmobiliarios-en-{barrio}/. Fuentes EXACTAS por barrio para NO
      // atrapar el post de blog "departamentos-en-pozo-en-caballito-mejores-proyectos...". ---
      { source: "/departamentos-en-pozo-en-palermo", destination: "/desarrollos-inmobiliarios-en-palermo/", permanent: true },
      { source: "/departamentos-en-pozo-en-palermo/", destination: "/desarrollos-inmobiliarios-en-palermo/", permanent: true },
      { source: "/departamentos-en-pozo-en-caballito", destination: "/desarrollos-inmobiliarios-en-caballito/", permanent: true },
      { source: "/departamentos-en-pozo-en-caballito/", destination: "/desarrollos-inmobiliarios-en-caballito/", permanent: true },
      { source: "/departamentos-en-pozo-en-puerto-madero", destination: "/desarrollos-inmobiliarios-en-puerto-madero/", permanent: true },
      { source: "/departamentos-en-pozo-en-puerto-madero/", destination: "/desarrollos-inmobiliarios-en-puerto-madero/", permanent: true },
      { source: "/departamentos-en-pozo-en-belgrano", destination: "/desarrollos-inmobiliarios-en-belgrano/", permanent: true },
      { source: "/departamentos-en-pozo-en-belgrano/", destination: "/desarrollos-inmobiliarios-en-belgrano/", permanent: true },
      { source: "/departamentos-en-pozo-en-nunez", destination: "/desarrollos-inmobiliarios-en-nunez/", permanent: true },
      { source: "/departamentos-en-pozo-en-nunez/", destination: "/desarrollos-inmobiliarios-en-nunez/", permanent: true },
      { source: "/departamentos-en-pozo-en-villa-urquiza", destination: "/desarrollos-inmobiliarios-en-villa-urquiza/", permanent: true },
      { source: "/departamentos-en-pozo-en-villa-urquiza/", destination: "/desarrollos-inmobiliarios-en-villa-urquiza/", permanent: true },
      { source: "/departamentos-en-pozo-en-colegiales", destination: "/desarrollos-inmobiliarios-en-colegiales/", permanent: true },
      { source: "/departamentos-en-pozo-en-colegiales/", destination: "/desarrollos-inmobiliarios-en-colegiales/", permanent: true },

      // --- Consolidación de guías canibalizadoras (Auditoría-Guias-SEO-2026-07) ---
      // Guías duplicadas puras: 301 a la guía ganadora para concentrar señal por URL.
      // 164 → 10 (los tres "cómo elegir proyecto" 8/10/164; 10 es la ganadora del trío).
      { source: "/como-elegir-un-emprendimiento-en-pozo-guia-completa-para-reducir-riesgo", destination: "/emprendimientos-en-pozo-en-buenos-aires-como-elegir-el-mejor-proyecto-y-no-equivocarte/", permanent: true },
      // 167 → 192 (dos guías de contrato; 192 tiene mejor cuerpo y es la ganadora).
      { source: "/contrato-de-pozo-en-argentina-clausulas-clave-que-deberias-entender-antes-de-firmar", destination: "/contrato-de-pozo-12-clausulas-clave-que-deberias-entender-antes-de-firmar/", permanent: true },
      // 183 → 98 (dos guías "evaluar desarrolladora / red flags"; 98 es la ganadora).
      { source: "/como-evaluar-una-desarrolladora-de-pozo-senales-de-confianza-y-red-flags", destination: "/desarrolladoras-de-departamentos-en-pozo-como-evaluarlas-y-reducir-riesgos-al-invertir/", permanent: true },

      // --- Fix link interno roto: el slug real es plural (…vs-usados). Varias guías
      // enlazan al singular (…vs-usado) → 301 al plural para no generar 404. ---
      { source: "/comprar-en-pozo-en-caba-vs-usado", destination: "/comprar-en-pozo-en-caba-vs-usados/", permanent: true },

      // --- Fusiones de guías (2da tanda, Auditoría-Guias-SEO): absorbida → ganadora ---
      { source: "/8-desarrolladoras-de-departamentos-en-pozo-en-caba-con-proyectos-entregados", destination: "/10-desarrolladoras-de-departamentos-en-pozo-con-proyectos-finalizados-en-argentina/", permanent: true },
      { source: "/mejores-barrios-para-invertir-en-pozo-en-caba-como-elegir-zona-sin-equivocarte", destination: "/desarrollos-en-pozo-por-barrio/", permanent: true },
      { source: "/tendencias-en-departamentos-en-pozo-tipologias-amenities-y-que-se-vende-mas-facil", destination: "/amenities-y-tipologias-que-mas-se-revenden-y-alquilan-en-pozo/", permanent: true },
      { source: "/estrategia-alquiler-en-pozo-que-tipologia-comprar-y-como-asegurar-demanda", destination: "/amenities-y-tipologias-que-mas-se-revenden-y-alquilan-en-pozo/", permanent: true },
      { source: "/estrategia-reventa-en-pozo-cuando-entrar-cuando-salir-y-como-maximizar-ganancia", destination: "/invertir-en-pozo-cuanto-se-gana-y-como-calcular-la-rentabilidad-paso-a-paso/", permanent: true },
    ];
  },
  // MIGRACIÓN COMPLETA: las imágenes ahora viven en /public/wp-content del repo.
  // Se quitó el proxy a WordPress (cms.*) — el sitio ya no depende del hosting de WP.
  // Verificado: 0 referencias a cms., 0 a /wp-includes, 80/80 imágenes locales.
};

module.exports = nextConfig;
