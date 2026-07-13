# Mapa de URLs — Preservación SEO 1:1

Objetivo: el sitio Next replica **exactamente** las URLs actuales de WordPress. Cero cambios ⇒ cero pérdida de ranking. `trailingSlash: true` en `next.config.js` mantiene la barra final como WordPress.

## URLs actuales (todas se preservan)

| Tipo | URL | Ruta Next | Estado |
|---|---|---|---|
| Home | `/` | `app/page.jsx` | ✅ hecho |
| Contacto | `/contacto/` | `app/contacto/page.jsx` | ⏳ pendiente |
| Nosotros | `/sobre-nosotros/` | `app/sobre-nosotros/page.jsx` | ⏳ |
| Novedades (blog) | `/novedades/` | `app/novedades/page.jsx` | ⏳ |
| Hub desarrolladoras | `/desarrolladoras-inmobiliarias-en-capital-federal/` | `app/desarrolladoras-inmobiliarias-en-capital-federal/page.jsx` | ⏳ |
| Guía barrio (x9) | `/desarrolladoras-inmobiliarias-en-{barrio}/` | `app/desarrolladoras-inmobiliarias-en-[barrio]/page.jsx` (ruta dinámica) | ⏳ |
| Catálogo proyectos | `/desarrollos-inmobiliarios/` | `app/desarrollos-inmobiliarios/page.jsx` | ⏳ |
| Ficha proyecto (x25) | `/desarrollos-inmobiliarios/{slug}/` | `app/desarrollos-inmobiliarios/[slug]/page.jsx` (dinámica) | ⏳ |
| Guía pillar | `/guia-invertir-departamentos-en-pozo-argentina/` | ruta propia | ⏳ |
| Índice precios | `/indice-precios-pozo-caballito-2026/` | ruta propia | ⏳ |
| Posts (x29) | `/{post-slug}/` | `app/[post]/page.jsx` (catch-all, verificar permalink) | ⏳ |

> Barrios con guía: palermo, caballito, belgrano, nunez, puerto-madero, recoleta, villa-urquiza, colegiales-chacarita, saavedra-coghlan.

## Redirects (301)

Hoy **no hace falta ningún redirect** porque las URLs se mantienen idénticas. Si en el futuro se renombra alguna, se agrega en `next.config.js → redirects()`:

```js
{ source: "/url-vieja/", destination: "/url-nueva/", permanent: true } // 301
```

## Checklist SEO de la migración (antes de apuntar el dominio)

- [ ] Todas las URLs responden 200 en el nuevo sitio (crawl de comparación).
- [ ] `<title>` y meta description por página = las de RankMath actual (traer por API o portar).
- [ ] Sitemap.xml generado (Next puede generarlo) y enviado a Search Console.
- [ ] Schema (Article/FAQ/ItemList) portado por página.
- [ ] Canonicals correctos.
- [ ] Redirect de `www`/no-`www` y `http`→`https` (Vercel lo hace).
- [ ] Mantener WordPress accesible (headless) para que la API siga sirviendo contenido.
- [ ] GA4 (G-G2FM2450HS) + Search Console reconfigurados en el nuevo front.
