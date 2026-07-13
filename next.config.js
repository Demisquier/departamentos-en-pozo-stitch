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
      // Plantilla de redirect 301 (agregar acá cualquier URL que se renombre):
      // { source: "/url-vieja/", destination: "/url-nueva/", permanent: true },
    ];
  },
};

module.exports = nextConfig;
