// app/_ui/SectionTitle.jsx — Título de sección canónico (H2) del sitio (Server Component).
// Unifica el estilo de TODOS los H2 de secciones (no-wp-content): mismo tamaño, fuente y color
// en directorios, listados, fichas y hubs. Antes cada página lo hardcodeaba con clases sueltas
// (a veces headline-sm, a veces text-[Npx]) → se veía "de otro sitio". Un solo lugar ahora.
//   - as:   "h2" (default) | "h3" — jerarquía semántica sin cambiar el look salvo tamaño.
//   - sub:  bajada opcional debajo del título (texto o JSX).
//   - id:   ancla para deep-links / índice.
export default function SectionTitle({ as: Comp = "h2", id, sub, className = "", children }) {
  const size = Comp === "h3" ? "text-[20px]" : "font-headline-sm text-headline-sm";
  return (
    <div className={className ? `mb-4 ${className}` : "mb-4"}>
      <Comp id={id} className={`${size} text-primary leading-snug`}>{children}</Comp>
      {sub && <p className="mt-2 text-on-surface-variant font-body-md text-body-md max-w-2xl">{sub}</p>}
    </div>
  );
}
