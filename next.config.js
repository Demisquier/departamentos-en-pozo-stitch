/** next.config.js
 *  - trailingSlash: true  => replica EXACTA de las URLs de WordPress (que usan barra final).
 *    Esto es CLAVE para no romper SEO: /contacto/ sigue siendo /contacto/.
 *  - redirects(): acá van SOLO las URLs que cambien. Hoy el plan es preservar todo 1:1,
 *    así que el array está listo para sumar redirects 301 si algo se renombra.
 *  - images.remotePatterns: permite servir las imágenes que hoy viven en tu WordPress.
 */
const WP_HOST = process.env.WP_HOST || "departamentosenpozo.com.ar";

/** @type {import('next').NextConfig} */
const nextConfig = {
  trailingSlash: true,
  // output:'export' => genera HTML estático abrible sin servidor (para preview local).
  // En Vercel se puede quitar para usar ISR/SSR. Controlado por env EXPORT=1.
  ...(process.env.EXPORT ? { output: "export" } : {}),
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: WP_HOST },
      { protocol: "https", hostname: "lh3.googleusercontent.com" }, // placeholders Stitch (reemplazar)
    ],
  },
  async redirects() {
    return [
      // Los posts viven en la raíz (como en WordPress). Si algún link viejo apunta a
      // /novedades/{slug}, lo mandamos con 301 a /{slug} para no duplicar contenido.
      { source: "/novedades/:slug", destination: "/:slug", permanent: true },
    ];
  },
  // Proxy: las imágenes/archivos de WordPress siguen viviendo en el hosting (cms.*).
  // Cualquier request a /wp-content o /wp-includes en el dominio nuevo se sirve desde WP.
  // Esto cubre las imágenes inline viejas que quedaron con URL del dominio raíz.
  async rewrites() {
    return [
      { source: "/wp-content/:path*", destination: `https://${WP_HOST}/wp-content/:path*` },
      { source: "/wp-includes/:path*", destination: `https://${WP_HOST}/wp-includes/:path*` },
    ];
  },
};

module.exports = nextConfig;
