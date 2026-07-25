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
    ];
  },
  // MIGRACIÓN COMPLETA: las imágenes ahora viven en /public/wp-content del repo.
  // Se quitó el proxy a WordPress (cms.*) — el sitio ya no depende del hosting de WP.
  // Verificado: 0 referencias a cms., 0 a /wp-includes, 80/80 imágenes locales.
};

module.exports = nextConfig;
