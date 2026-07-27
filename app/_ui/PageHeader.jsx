// app/_ui/PageHeader.jsx — Shell del "hero oscuro" (navy) del sitio (Server Component).
// Centraliza la parte REPETIDA de los headers editoriales: fondo navy + texto claro + contenedor
// central + padding vertical. El contenido interno (breadcrumb, kicker, H1, bajada, meta) va como
// children y se mantiene EXACTO en cada página → refactor, no rediseño.
//   - py:        padding vertical (default "py-16 md:py-20"; el header de post usa "py-14 md:py-20").
//   - className: clases extra del contenedor interno.
import Container from "./Container";

export default function PageHeader({ py = "py-16 md:py-20", className = "", children }) {
  return (
    <header className="bg-primary-container text-on-primary">
      <Container className={className ? `${py} ${className}` : py}>
        {children}
      </Container>
    </header>
  );
}
