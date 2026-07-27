// app/_ui/Callout.jsx — Bloque destacado gris con borde bronce (Server Component).
// Reproduce el patrón "caja gris (#f3f4f5) + borde izq. bronce (#a68966)" que hoy vive SÓLO
// como CSS de contenido en globals.css (.wp-content blockquote / th). Se expone como componente
// reutilizable para cuando ese contenido pase de HTML-de-WP a JSX (aún sin instancia JSX que migrar).
//   - bg / border mapean a los tokens del sistema equivalentes (surface-container-low + link-gold).
//   - className: clases extra (márgenes, tipografía).
export default function Callout({ className = "", children }) {
  return (
    <div className={`bg-surface-container-low border-l-4 border-link-gold rounded-r-lg p-5 text-on-surface-variant leading-relaxed${className ? " " + className : ""}`}>
      {children}
    </div>
  );
}
