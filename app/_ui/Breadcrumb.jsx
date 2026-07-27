// app/_ui/Breadcrumb.jsx — Miga de pan (Server Component). Unifica la ESTRUCTURA (nav + items
// + separadores) de los 5 breadcrumbs del sitio y, opcionalmente, emite el BreadcrumbList JSON-LD.
//
//   - items: [{ name, href?, html? }]  — el último suele ir sin href (página actual).
//            `html` renderiza el nombre con dangerouslySetInnerHTML (p.ej. cat.name de WP).
//   - tone:  "dark" (sobre navy) | "light". Fija color base del nav, hover de links y color del actual.
//   - sep:   separador (default "›"). sepAriaHidden: si el separador lleva aria-hidden.
//   - className:        clases extra del <nav> (p.ej. "mb-6" / "mb-4").
//   - currentClassName: override del <span> del item actual (p.ej. "text-on-primary/70 line-clamp-1").
//   - ariaLabel:        aria-label del <nav> (sólo se agrega si se pasa).
//   - schema:           objeto JSON-LD ya construido (breadcrumbSchema(...)) → se emite con <JsonLd>.
//
// Estructura de salida idéntica al inline: children directos del <nav> (Fragment, sin wrappers).
import { Fragment } from "react";
import Link from "next/link";
import JsonLd from "./JsonLd";

const TONES = {
  dark: { base: "text-on-primary-fixed-variant", link: "hover:text-link-gold", current: "text-on-primary" },
  light: { base: "text-on-surface-variant", link: "hover:text-secondary", current: "text-primary" },
};

export default function Breadcrumb({
  items = [],
  tone = "dark",
  sep = "›",
  sepAriaHidden = true,
  className = "",
  currentClassName,
  ariaLabel,
  schema,
}) {
  const t = TONES[tone] || TONES.dark;
  const navClass = `flex flex-wrap items-center gap-1.5 text-[13px] ${t.base}${className ? " " + className : ""}`;
  const currentClass = currentClassName || t.current;

  return (
    <>
      {schema ? <JsonLd data={schema} /> : null}
      <nav className={navClass} {...(ariaLabel ? { "aria-label": ariaLabel } : {})}>
        {items.map((it, i) => {
          const isLast = i === items.length - 1;
          return (
            <Fragment key={i}>
              {it.href ? (
                <Link href={it.href} className={t.link}>{it.name}</Link>
              ) : it.html ? (
                <span className={currentClass} dangerouslySetInnerHTML={{ __html: it.html }} />
              ) : (
                <span className={currentClass}>{it.name}</span>
              )}
              {!isLast && (
                <span {...(sepAriaHidden ? { "aria-hidden": "true" } : {})}>{sep}</span>
              )}
            </Fragment>
          );
        })}
      </nav>
    </>
  );
}
