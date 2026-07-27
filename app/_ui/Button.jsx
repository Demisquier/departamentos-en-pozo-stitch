// app/_ui/Button.jsx — Botón / CTA unificado (Server Component; sin estado propio).
// Un solo lugar para el COLOR y el comportamiento hover de los CTA del sitio. Las variantes
// mapean a las combinaciones ya estandarizadas en la pasada de botones:
//   - primary   → navy:   bg-primary-container text-on-primary   (hover opacity)
//   - gold      → bronce sobre navy: bg-link-gold text-primary-container (hover brightness)
//   - secondary → outline: border border-outline-variant text-primary-container (hover border)
// Todas comparten `rounded` + `transition-all` (radio y transición del sistema).
//
// El LAYOUT específico de cada CTA (padding, flex, gap, ancho, tracking, uppercase, iconos)
// se pasa por `className`, así el set de clases efectivas queda idéntico al markup original
// (refactor, no rediseño). `size` es un atajo opcional para el padding más común.
//   - as: "button" (default) | "a" | un componente (p.ej. Link de next).

const VARIANTS = {
  primary: "bg-primary-container text-on-primary hover:opacity-90",
  gold: "bg-link-gold text-primary-container hover:brightness-110",
  secondary: "border border-outline-variant text-primary-container hover:border-secondary",
};

const SIZES = { sm: "px-6 py-2", md: "px-8 py-3", lg: "px-10 py-4" };

export default function Button({
  as: Comp = "button",
  variant = "primary",
  size,
  href,
  className = "",
  children,
  ...rest
}) {
  const parts = ["rounded transition-all", VARIANTS[variant] || VARIANTS.primary];
  if (size && SIZES[size]) parts.push(SIZES[size]);
  if (className) parts.push(className);
  const props = { className: parts.join(" "), ...rest };
  if (Comp !== "button") props.href = href; // <a> o Link necesitan href; <button> no
  return <Comp {...props}>{children}</Comp>;
}
