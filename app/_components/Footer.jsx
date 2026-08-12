import Link from "next/link";
import { BARRIOS_PAGINA } from "../../lib/barrios";
import { CONTACT_EMAIL } from "../../lib/constants";
import Container from "../_ui/Container";

/* Footer: navy (primary-container), wordmark Caslon, columnas con labels bronce */
export default function Footer() {
  return (
    <footer className="bg-primary-container text-primary-fixed-dim">
      <Container className="py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-10">
          <div className="md:col-span-1">
            <h3 className="font-headline-md text-white text-2xl mb-3">Departamentos en Pozo</h3>
            <p className="text-on-primary-fixed-variant text-sm leading-relaxed max-w-xs mb-4">
              Portal de análisis independiente sobre inversión en departamentos en pozo (preventa) en CABA y GBA.
              No somos inmobiliaria ni desarrolladora.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center gap-2 text-sm text-white hover:text-link-gold transition-colors"
            >
              <span className="material-symbols-outlined text-[18px] text-link-gold">mail</span>
              {CONTACT_EMAIL}
            </a>
          </div>

          <FootCol title="Navegación" links={[
            ["Inicio", "/"],
            ["Proyectos en pozo", "/desarrollos-inmobiliarios/"],
            ["Desarrolladoras", "/desarrolladoras-inmobiliarias-en-capital-federal/"],
            ["Inmobiliarias", "/mejores-inmobiliarias-caba/"],
            ["Corralones y materiales", "/corralones-y-materiales-de-construccion-en-caba/"],
          ]} />

          <FootCol title="Herramientas" links={[
            ["Simulador de cuota CAC", "/simulador-cuota-cac-pozo/"],
            ["Alertas de lanzamientos", "/alertas-de-lanzamientos-en-pozo/"],
            ["Reels de emprendimientos", "/reels/"],
          ]} />

          {/* Las 9 páginas de barrio, todas. Patrón Zonaprop: el bloque de links de barrio
              al pie es el activo SEO real del directorio (facetas indexables), no el listado.
              Acá viven todas para que ninguna quede huérfana aunque salgan del menú. */}
          <FootCol title="Por barrio" links={BARRIOS_PAGINA.map(([label, slug]) => [label, `/desarrolladoras-inmobiliarias-en-${slug}/`])} />

          <FootCol title="Contacto" links={[
            ["Soy desarrolladora", "/soy-desarrolladora/"],
            [CONTACT_EMAIL, `mailto:${CONTACT_EMAIL}`],
            ["Guías y novedades", "/novedades/"],
            ["Nosotros", "/sobre-nosotros/"],
          ]} />
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 text-on-primary-fixed-variant text-xs flex flex-col md:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} Departamentos en Pozo. Todos los derechos reservados.</span>
          <span>Contenido informativo · No constituye asesoramiento financiero.</span>
        </div>
      </Container>
    </footer>
  );
}

function FootCol({ title, links }) {
  return (
    <div>
      <h4 className="text-label-caps font-label-caps uppercase text-link-gold mb-4">{title}</h4>
      <ul className="space-y-2.5">
        {links.map(([label, href]) => (
          <li key={href}>
            {href.startsWith("mailto:") ? (
              <a href={href} className="text-sm hover:text-white transition-colors break-all">{label}</a>
            ) : (
              <Link href={href} className="text-sm hover:text-white transition-colors">{label}</Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
