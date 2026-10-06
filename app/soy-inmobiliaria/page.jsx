// app/soy-inmobiliaria/page.jsx — Captación de inmobiliarias: que carguen su contacto comercial
// para recibir directo las consultas de los proyectos que comercializan (sin costo).
import Container from "../_ui/Container";
import { SITE } from "../../lib/wp";
import SoyInmobiliariaForm from "./SoyInmobiliariaForm";

export const metadata = {
  title: "Soy inmobiliaria — recibí las consultas de tus proyectos en pozo | Departamentos en Pozo",
  description: "Si comercializás proyectos en pozo que figuran en Departamentos en Pozo, dejá tu contacto comercial y te derivamos directo las consultas de compradores. Sin costo.",
  alternates: { canonical: `${SITE}/soy-inmobiliaria/` },
};

export default function SoyInmobiliariaPage() {
  return (
    <Container as="main" className="py-10 md:py-14">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-headline-md text-headline-md md:text-display-lg text-primary leading-tight mb-3">¿Comercializás proyectos en pozo?</h1>
          <p className="text-on-surface-variant font-body-lg text-body-lg">
            Dejanos tu contacto comercial y las consultas de compradores por tus proyectos te llegan directo. Sin costo, sin intermediarios.
          </p>
        </div>
        <ul className="grid sm:grid-cols-3 gap-3 mb-6 text-[13.5px]">
          {[["mail", "Recibís el lead con nombre, WhatsApp y consulta"], ["verified", "Verificamos la matrícula para evitar suplantaciones"], ["bolt", "Activo apenas lo aprobamos"]].map(([i, t]) => (
            <li key={i} className="border border-outline-variant rounded-xl p-4 flex items-start gap-2.5 bg-surface-container-low">
              <span className="material-symbols-outlined text-[20px] text-link-gold shrink-0">{i}</span><span className="text-on-surface">{t}</span>
            </li>
          ))}
        </ul>
        <SoyInmobiliariaForm />
        <p className="text-[12px] text-on-surface-variant text-center mt-4">
          ¿Sos desarrolladora? <a href="/soy-desarrolladora/" className="text-secondary underline">Actualizá tus datos acá</a>.
        </p>
      </div>
    </Container>
  );
}
