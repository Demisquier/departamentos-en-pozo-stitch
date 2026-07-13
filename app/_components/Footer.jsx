import Link from "next/link";

/* Footer idéntico a Stitch: navy (primary-container), wordmark Caslon, columnas con labels bronce */
export default function Footer() {
  return (
    <footer className="bg-primary-container text-primary-fixed-dim">
      <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <h3 className="font-headline-md text-white text-2xl mb-3">Departamentos en Pozo</h3>
            <p className="text-on-primary-fixed-variant text-sm leading-relaxed max-w-xs">
              Portal de análisis independiente sobre inversión en departamentos en pozo (preventa) en CABA y GBA.
              No somos inmobiliaria ni desarrolladora.
            </p>
          </div>
          <FootCol title="Navegación" links={[
            ["Inicio", "/"],
            ["Proyectos en pozo", "/desarrollos-inmobiliarios/"],
            ["Desarrolladoras", "/desarrolladoras-inmobiliarias-en-capital-federal/"],
          ]} />
          <FootCol title="Recursos" links={[
            ["Guías y novedades", "/novedades/"],
            ["Nosotros", "/sobre-nosotros/"],
          ]} />
          <FootCol title="Contacto" links={[
            ["Escribinos", "/contacto/"],
            ["Guías por barrio", "/desarrolladoras-inmobiliarias-en-palermo/"],
          ]} />
        </div>
        <div className="mt-10 pt-6 border-t border-white/10 text-on-primary-fixed-variant text-xs flex flex-col md:flex-row justify-between gap-2">
          <span>© {new Date().getFullYear()} Departamentos en Pozo. Todos los derechos reservados.</span>
          <span>Contenido informativo · No constituye asesoramiento financiero.</span>
        </div>
      </div>
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
            <Link href={href} className="text-sm hover:text-white transition-colors">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
