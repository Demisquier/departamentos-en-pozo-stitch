# Departamentos en Pozo — Front Next.js (diseño Stitch)

Reconstrucción del front-end con el **diseño exacto de Stitch**, manteniendo WordPress como CMS headless y **preservando todas las URLs** (cero riesgo SEO).

## Arquitectura

```
WordPress (departamentosenpozo.com.ar)   →  API REST (contenido: proyectos, posts, páginas)
        [seguís publicando acá]                         │
                                                        ▼
                              Next.js (este proyecto) → renderiza diseño Stitch
                                                        │
                                                        ▼
                                          Vercel (deploy) → dominio final
```

- **Vos seguís usando WordPress** para cargar proyectos, posts y contenido. No cambia tu workflow.
- **Next.js** lee ese contenido por API y lo muestra con el diseño Stitch (Tailwind compilado = pixel-perfect, sin CDN).
- **URLs idénticas** a las actuales (ver `URL-MAP.md`). ISR (`revalidate: 300`) mantiene el contenido fresco sin rebuilds.

## Estado

| Parte | Estado |
|---|---|
| Scaffold + design system Stitch (tokens exactos) | ✅ |
| Capa de datos WP (`lib/wp.js`) | ✅ |
| Header + Footer + layout | ✅ |
| **Home** (`app/page.jsx`) con destacados reales | ✅ compila |
| Resto de páginas (12 plantillas) | ⏳ (ver `URL-MAP.md`) |
| Meta SEO por página (RankMath) | ⏳ |
| Sitemap + schema | ⏳ |

## Correr localmente

```bash
cd nextjs-stitch
npm install
npm run dev      # http://localhost:3000
```
> Nota: en esta carpeta montada el `build` da un error de permisos de filesystem al limpiar `.next/` (EPERM). No es un error de código — en tu máquina o en Vercel compila limpio. El `dev` anda igual para previsualizar.

## Deploy a Vercel (resumen)

1. Subir esta carpeta a un repo (GitHub/GitLab).
2. Importar el repo en **vercel.com** (detecta Next automáticamente).
3. Variable de entorno: `WP_HOST=departamentosenpozo.com.ar`.
4. Deploy → Vercel da una URL de preview. Revisar que todo se vea idéntico a Stitch.
5. **Recién cuando esté completo y validado**, apuntar el dominio (DNS) a Vercel.
   Hasta ese momento WordPress sigue sirviendo el sitio real → cero downtime, cero riesgo.

## Pendiente para completar (Camino A)

1. Convertir las 12 plantillas restantes desde `../stitch_redesign/*/code.html` (mismo método que la home).
2. Traer meta SEO (title/description) y schema desde WordPress/RankMath por API.
3. Wire del formulario de contacto (a un endpoint: el mismo WP, o un form service).
4. Sitemap.xml + robots.
5. QA de paridad de URLs (crawl viejo vs nuevo) antes de migrar DNS.
